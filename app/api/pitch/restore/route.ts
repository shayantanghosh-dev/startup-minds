import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/pitch/restore — restore a pitch from a version snapshot
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { version_id } = await req.json();
  if (!version_id) return NextResponse.json({ error: "version_id required" }, { status: 400 });

  // Fetch the version
  const { data: pv, error: pvError } = await supabase
    .from("pitch_versions")
    .select("*, pitches(startup_id, startups(founder_id))")
    .eq("id", version_id)
    .single();

  if (pvError || !pv) return NextResponse.json({ error: "Version not found" }, { status: 404 });

  // Verify ownership
  const pitch = pv.pitches as { startup_id: string; startups: { founder_id: string } };
  if (pitch?.startups?.founder_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const snapshot = pv.snapshot as Record<string, unknown>;

  // Fields safe to restore (exclude metadata fields)
  const RESTORABLE_FIELDS = [
    "company_overview", "problem_statement", "pain_points", "real_world_examples",
    "solution_description", "technology_stack", "proprietary_innovations",
    "unique_value_proposition", "competitive_advantages", "product_features",
    "customer_segments", "tam", "sam", "som", "market_trends", "revenue_model",
    "pricing_strategy", "scalability_plan", "monthly_revenue", "monthly_growth_rate",
    "total_customers", "mrr", "arr", "partnerships", "awards",
    "amount_raising", "valuation_expectation", "equity_offered", "use_of_funds",
    "milestones_achieved", "future_roadmap", "demo_video_url",
  ];

  const restoreData: Record<string, unknown> = { status: "draft" };
  for (const field of RESTORABLE_FIELDS) {
    if (snapshot[field] !== undefined) restoreData[field] = snapshot[field];
  }

  const { error: updateError } = await supabase
    .from("pitches")
    .update(restoreData)
    .eq("id", pv.pitch_id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Audit log
  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "pitch_version_restored",
    entity_type: "pitch",
    entity_id: pv.pitch_id,
    new_data: { restored_from_version: pv.version, version_id },
  });

  return NextResponse.json({ success: true });
}

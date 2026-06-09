import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (!profile || !["sub_admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all published startups with pitches
    const { data: startups } = await adminSupabase
      .from("startups")
      .select("id, industry, stage, city, country")
      .limit(100);

    // Get all verified investors
    const { data: investors } = await adminSupabase
      .from("investors")
      .select("id, preferred_sectors, preferred_stages, preferred_geographies, min_ticket_size, max_ticket_size")
      .eq("is_verified", true);

    if (!startups || !investors) return NextResponse.json({ matched: 0 });

    let matchCount = 0;
    const inserts = [];

    for (const startup of startups) {
      for (const investor of investors) {
        let score = 0;
        const reasons: string[] = [];

        // Sector match
        if (investor.preferred_sectors?.includes(startup.industry)) {
          score += 35;
          reasons.push("Sector match");
        }

        // Stage match
        if (investor.preferred_stages?.includes(startup.stage)) {
          score += 30;
          reasons.push("Stage match");
        }

        // Geography match
        if (investor.preferred_geographies?.includes(startup.country) || investor.preferred_geographies?.includes(startup.city)) {
          score += 20;
          reasons.push("Geography match");
        }

        // Base score for having both available
        score += 15;

        if (score >= 50) {
          inserts.push({
            startup_id: startup.id,
            investor_id: investor.id,
            compatibility_score: Math.min(score, 100),
            match_reasons: reasons,
            ai_explanation: `This startup matches ${reasons.join(", ").toLowerCase()} with the investor's preferences.`,
          });
          matchCount++;
        }
      }
    }

    // Batch insert matches
    if (inserts.length > 0) {
      const { error } = await adminSupabase
        .from("startup_matches")
        .upsert(inserts, { onConflict: "startup_id,investor_id", ignoreDuplicates: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ matched: matchCount });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FounderAnalytics from "@/components/dashboard/founder/analytics";

export default async function FounderAnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: startup } = await supabase
    .from("startups")
    .select("id, name")
    .eq("founder_id", user.id)
    .single();

  if (!startup) redirect("/dashboard/founder");

  const [
    { data: healthHistory },
    { data: pitchViews },
    { data: connections },
    { data: crmStages },
  ] = await Promise.all([
    supabase
      .from("startup_health_scores")
      .select("overall_score, team_score, market_score, product_score, traction_score, financials_score, calculated_at")
      .eq("startup_id", startup.id)
      .order("calculated_at", { ascending: true })
      .limit(12),
    supabase
      .from("analytics_events")
      .select("created_at, properties")
      .eq("event_type", "startup_view")
      .eq("startup_id", startup.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("connection_requests")
      .select("status, created_at")
      .eq("target_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("crm_records")
      .select("stage")
      .eq("startup_id", startup.id),
  ]);

  return (
    <FounderAnalytics
      startupName={startup.name}
      healthHistory={healthHistory ?? []}
      pitchViews={pitchViews ?? []}
      connections={connections ?? []}
      crmStages={crmStages ?? []}
    />
  );
}

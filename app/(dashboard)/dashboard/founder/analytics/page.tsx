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
      .select("overall_score, traction_score, growth_score, engagement_score, team_quality_score, business_model_score, computed_at")
      .eq("startup_id", startup.id)
      .order("computed_at", { ascending: true })
      .limit(12),
    supabase
      .from("analytics_events")
      .select("created_at, properties")
      .eq("event_name", "startup_view")
      .eq("entity_type", "startup")
      .eq("entity_id", startup.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("connection_requests")
      .select("status, created_at")
      .eq("receiver_id", user.id)
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

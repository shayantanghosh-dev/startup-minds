import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FounderOverview } from "@/components/dashboard/founder/overview";

export const dynamic = "force-dynamic";

export default async function FounderDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [
    { data: startup },
    { data: pitch },
    { data: stats },
    { data: profile },
    { data: recentMatches },
    { data: connections },
  ] = await Promise.all([
    supabase.from("startups").select("*, startup_health_scores(*)").eq("founder_id", user.id).maybeSingle(),
    supabase.from("pitches").select("*").eq("founder_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.rpc("get_founder_stats", { p_user_id: user.id }).maybeSingle(),
    supabase.from("users").select("bio, location, linkedin_url").eq("id", user.id).maybeSingle(),
    admin.from("startup_matches").select("compatibility_score, investors(user_id, organization)").eq("startup_id", (await supabase.from("startups").select("id").eq("founder_id", user.id).maybeSingle().then(r => r.data?.id)) ?? "").eq("is_dismissed", false).order("compatibility_score", { ascending: false }).limit(3),
    supabase.from("connection_requests").select("id, status").or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).eq("status", "accepted").limit(1),
  ]);

  return (
    <FounderOverview
      startup={startup}
      pitch={pitch}
      stats={stats as Record<string, number> | null}
      profileComplete={!!(profile?.bio && profile?.location)}
      recentMatches={recentMatches ?? []}
      hasConnections={(connections?.length ?? 0) > 0}
    />
  );
}

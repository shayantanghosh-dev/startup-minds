import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FounderOverview } from "@/components/dashboard/founder/overview";

export default async function FounderDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: startup }, { data: pitch }, { data: stats }] = await Promise.all([
    supabase.from("startups").select("*, startup_health_scores(*)").eq("founder_id", user.id).single(),
    supabase.from("pitches").select("*").eq("startup_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
    supabase.rpc("get_founder_stats", { p_user_id: user.id }),
  ]);

  return <FounderOverview startup={startup} pitch={pitch} stats={stats} />;
}

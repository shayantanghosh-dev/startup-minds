import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LeaderboardPage } from "@/components/dashboard/leaderboard-page";

export const dynamic = "force-dynamic";

export default async function InvestorLeaderboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: startups } = await supabase
    .rpc("get_startup_leaderboard", { p_type: "health_score", p_limit: 50 });

  return <LeaderboardPage initialStartups={startups ?? []} />;
}

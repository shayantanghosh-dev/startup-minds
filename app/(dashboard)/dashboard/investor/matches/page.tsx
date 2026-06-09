import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InvestorMatchesPage } from "@/components/dashboard/investor/matches-page";

export const dynamic = "force-dynamic";

export default async function InvestorMatches() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: investor } = await supabase
    .from("investors")
    .select("id, is_verified, kyc_status")
    .eq("user_id", user.id)
    .single();

  if (!investor?.is_verified) redirect("/dashboard/investor/kyc");

  const { data: matches } = await supabase
    .from("startup_matches")
    .select(`
      *,
      startups(
        id, name, slogan, logo_url, industry, stage, city, country,
        total_views, total_likes, total_bookmarks, health_score,
        startup_health_scores(overall_score),
        pitches(amount_raising, ai_quality_score, status)
      )
    `)
    .eq("investor_id", investor.id)
    .eq("is_dismissed", false)
    .order("compatibility_score", { ascending: false });

  return <InvestorMatchesPage matches={matches ?? []} investorId={investor.id} />;
}

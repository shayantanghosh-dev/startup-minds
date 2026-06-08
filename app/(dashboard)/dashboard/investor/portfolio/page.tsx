export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InvestorPortfolio from "@/components/investor/portfolio";

export default async function InvestorPortfolioPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: investor } = await supabase
    .from("investors")
    .select("id, is_verified")
    .eq("user_id", user.id)
    .single();

  if (!investor) redirect("/dashboard/investor/kyc");

  const { data: portfolio } = await supabase
    .from("crm_records")
    .select(`
      *,
      startup:startups(
        id, name, logo_url, tagline, stage, industry, website_url,
        health_scores:startup_health_scores(overall_score)
      )
    `)
    .eq("investor_id", investor.id)
    .in("stage", ["invested"])
    .order("updated_at", { ascending: false });

  const { data: watchlist } = await supabase
    .from("bookmarks")
    .select(`
      *,
      startup:startups(
        id, name, logo_url, tagline, stage, industry,
        health_scores:startup_health_scores(overall_score)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <InvestorPortfolio portfolio={portfolio ?? []} watchlist={watchlist ?? []} />;
}

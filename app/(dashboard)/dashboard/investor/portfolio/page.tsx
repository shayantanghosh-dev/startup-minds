export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InvestorPortfolio from "@/components/investor/portfolio";

export default async function InvestorPortfolioPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: investor } = await supabase
    .from("investors")
    .select("id, is_verified")
    .eq("user_id", user.id)
    .single();

  if (!investor) redirect("/dashboard/investor/kyc");

  // Fetch full CRM pipeline (all stages except none)
  const { data: pipeline } = await supabase
    .from("crm_records")
    .select(`
      id, stage, investment_amount, notes, updated_at,
      startups(id, name, logo_url, tagline, stage, industry, health_score)
    `)
    .eq("investor_id", investor.id)
    .order("updated_at", { ascending: false });

  // Fetch watchlist bookmarks
  const { data: watchlist } = await supabase
    .from("bookmarks")
    .select(`
      id, startup_id, created_at,
      startups(id, name, logo_url, tagline, stage, industry, health_score)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <InvestorPortfolio
      pipeline={(pipeline ?? []) as never}
      watchlist={(watchlist ?? []) as never}
      investorId={investor.id}
      userId={user.id}
    />
  );
}

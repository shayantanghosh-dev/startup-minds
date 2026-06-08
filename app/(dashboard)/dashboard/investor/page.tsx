import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InvestorOverview } from "@/components/dashboard/investor/overview";

export default async function InvestorDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: investor } = await supabase
    .from("investors")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: crmRecords } = await supabase
    .from("crm_records")
    .select("*, startups(name, stage, industry, logo_url)")
    .eq("investor_id", investor?.id ?? "")
    .order("updated_at", { ascending: false })
    .limit(5);

  const { data: matches } = await supabase
    .from("startup_matches")
    .select("*, startups(name, stage, industry, logo_url, health_score)")
    .eq("investor_id", investor?.id ?? "")
    .eq("is_dismissed", false)
    .order("compatibility_score", { ascending: false })
    .limit(5);

  return (
    <InvestorOverview
      investor={investor}
      crmRecords={crmRecords ?? []}
      matches={matches ?? []}
    />
  );
}

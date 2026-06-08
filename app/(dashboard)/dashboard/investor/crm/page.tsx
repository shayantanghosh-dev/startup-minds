import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InvestorCRM } from "@/components/investor/crm";

export default async function CRMPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: investor } = await supabase
    .from("investors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!investor) redirect("/dashboard/investor/kyc");

  const { data: records } = await supabase
    .from("crm_records")
    .select(`
      *,
      startups(id, name, stage, industry, logo_url, health_score),
      crm_tasks(*)
    `)
    .eq("investor_id", investor.id)
    .order("updated_at", { ascending: false });

  return <InvestorCRM records={records ?? []} investorId={investor.id} />;
}

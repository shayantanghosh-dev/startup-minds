import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { KYCPage } from "@/components/investor/kyc-page";

export default async function InvestorKYCPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: investor } = await supabase
    .from("investors")
    .select("*, kyc_documents(*)")
    .eq("user_id", user.id)
    .single();

  return <KYCPage investor={investor} userId={user.id} />;
}

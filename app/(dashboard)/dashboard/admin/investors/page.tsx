import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminInvestorsPage } from "@/components/dashboard/admin/investors-page";

export const dynamic = "force-dynamic";

export default async function AdminInvestors() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || !["sub_admin", "super_admin"].includes(profile.role)) redirect("/dashboard/founder");

  const { data: investors } = await supabase
    .from("investors")
    .select(`
      *, users(full_name, email, avatar_url, is_active, created_at, location),
      kyc_documents(id, status)
    `)
    .order("created_at", { ascending: false });

  return <AdminInvestorsPage investors={investors ?? []} />;
}

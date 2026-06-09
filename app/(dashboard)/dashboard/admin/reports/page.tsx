import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminReportsPage } from "@/components/dashboard/admin/reports-page";

export const dynamic = "force-dynamic";

export default async function AdminReports() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || !["sub_admin", "super_admin"].includes(profile.role)) redirect("/dashboard/founder");

  const { data: reports } = await supabase
    .from("reports")
    .select(`*, users!reporter_id(full_name, email)`)
    .order("created_at", { ascending: false });

  return <AdminReportsPage reports={reports ?? []} adminId={user.id} />;
}

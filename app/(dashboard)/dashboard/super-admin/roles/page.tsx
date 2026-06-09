import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SuperAdminRolesPage } from "@/components/dashboard/super-admin/roles-page";

export const dynamic = "force-dynamic";

export default async function SuperAdminRoles() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "super_admin") redirect("/dashboard/admin");

  const [{ data: customRoles }, { data: admins }] = await Promise.all([
    supabase.from("custom_roles").select("*, users!created_by(full_name)").order("created_at", { ascending: false }),
    supabase.from("users").select("id, full_name, email, role").in("role", ["sub_admin", "super_admin", "reviewer"]),
  ]);

  return <SuperAdminRolesPage customRoles={customRoles ?? []} admins={admins ?? []} />;
}

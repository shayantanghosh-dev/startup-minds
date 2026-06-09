import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SuperAdminUsersPage } from "@/components/dashboard/super-admin/users-page";

export const dynamic = "force-dynamic";

export default async function SuperAdminUsers() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "super_admin") redirect("/dashboard/admin");

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  return <SuperAdminUsersPage users={users ?? []} />;
}

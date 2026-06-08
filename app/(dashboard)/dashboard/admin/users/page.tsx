export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminUsersPage from "@/components/dashboard/admin/users-page";

export default async function UsersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["sub_admin", "super_admin"].includes(profile.role)) {
    redirect("/dashboard/founder");
  }

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email, role, avatar_url, is_verified, created_at, last_seen_at")
    .order("created_at", { ascending: false });

  return <AdminUsersPage users={users ?? []} currentUserId={user.id} isSuperAdmin={profile.role === "super_admin"} />;
}

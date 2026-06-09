export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminAnnouncementsPage } from "@/components/dashboard/admin/announcements-page";

export default async function AdminAnnouncements() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || !["sub_admin", "super_admin"].includes(profile.role)) redirect("/dashboard/founder");

  // Recent announcements (last 20)
  const { data: recent } = await supabase
    .from("notifications")
    .select("id, title, body, created_at, metadata")
    .eq("type", "admin_announcement")
    .order("created_at", { ascending: false })
    .limit(20);

  return <AdminAnnouncementsPage recentAnnouncements={recent ?? []} />;
}

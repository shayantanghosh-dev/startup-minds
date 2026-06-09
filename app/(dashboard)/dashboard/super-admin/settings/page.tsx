import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSettingsPage } from "@/components/dashboard/admin/settings-page";

export const dynamic = "force-dynamic";

export default async function SuperAdminSettings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "super_admin") redirect("/dashboard/admin");

  const { data: settings } = await supabase.from("platform_settings").select("*").order("key");

  return <AdminSettingsPage settings={settings ?? []} />;
}

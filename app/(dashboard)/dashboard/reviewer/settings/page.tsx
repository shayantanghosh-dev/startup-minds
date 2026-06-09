import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsPage from "@/components/dashboard/settings-page";

export const dynamic = "force-dynamic";

export default async function ReviewerSettings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
  const { data: preferences } = await supabase.from("notification_preferences").select("*").eq("user_id", user.id).single();

  return <SettingsPage profile={profile} notifPrefs={preferences} />;
}

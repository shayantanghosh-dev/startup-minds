import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StartupProfileForm } from "@/components/startup/profile-form";

export default async function StartupProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: startup } = await supabase
    .from("startups")
    .select("*, startup_members(*)")
    .eq("founder_id", user.id)
    .single();

  return <StartupProfileForm startup={startup} userId={user.id} />;
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SuperAdminStartupsPage } from "@/components/dashboard/super-admin/startups-page";

export const dynamic = "force-dynamic";

export default async function SuperAdminStartups() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "super_admin") redirect("/dashboard/admin");

  const { data: startups } = await supabase
    .from("startups")
    .select(`*, users!founder_id(full_name, email), startup_health_scores(overall_score), pitches(status)`)
    .order("created_at", { ascending: false });

  return <SuperAdminStartupsPage startups={startups ?? []} />;
}

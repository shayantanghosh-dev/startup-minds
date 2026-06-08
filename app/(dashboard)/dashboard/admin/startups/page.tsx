export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminStartupsList from "@/components/dashboard/admin/startups-list";

export default async function AdminStartupsPage() {
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

  const { data: startups } = await supabase
    .from("startups")
    .select(`
      id, name, tagline, stage, industry, is_verified, is_featured, created_at,
      founder:users!startups_founder_id_fkey(full_name, email),
      pitches(id, status),
      health_scores:startup_health_scores(overall_score)
    `)
    .order("created_at", { ascending: false });

  return <AdminStartupsList startups={startups ?? []} />;
}

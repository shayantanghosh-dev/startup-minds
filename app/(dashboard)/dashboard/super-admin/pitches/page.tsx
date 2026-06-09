import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminPitchesList from "@/components/dashboard/admin/pitches-list";

export const dynamic = "force-dynamic";

export default async function SuperAdminPitches() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "super_admin") redirect("/dashboard/admin");

  const { data: pitches } = await supabase
    .from("pitches")
    .select(`*, startups(name, logo_url, industry, stage, users!founder_id(full_name))`)
    .order("created_at", { ascending: false });

  return <AdminPitchesList pitches={pitches ?? []} />;
}

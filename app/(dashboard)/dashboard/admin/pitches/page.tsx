export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminPitchesList from "@/components/dashboard/admin/pitches-list";

export default async function AdminPitchesPage() {
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

  const { data: pitches } = await supabase
    .from("pitches")
    .select(`
      *,
      startup:startups(id, name, logo_url, stage, industry),
      reviews:pitch_reviews(id, overall_score, recommendation, reviewer:users!pitch_reviews_reviewer_id_fkey(full_name))
    `)
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return <AdminPitchesList pitches={pitches ?? []} />;
}

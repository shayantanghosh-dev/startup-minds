export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminPitchDetail from "@/components/dashboard/admin/pitch-detail";

export default async function AdminPitchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: pitch } = await supabase
    .from("pitches")
    .select(`
      *,
      startup:startups(
        *,
        founder:users!startups_founder_id_fkey(id, full_name, email, avatar_url)
      ),
      reviews:pitch_reviews(
        *,
        reviewer:users!pitch_reviews_reviewer_id_fkey(id, full_name, avatar_url)
      ),
      ai_analysis:ai_analyses(*),
      versions:pitch_versions(id, version_number, created_at, change_summary)
    `)
    .eq("id", id)
    .single();

  if (!pitch) notFound();

  return <AdminPitchDetail pitch={pitch} adminId={user.id} />;
}

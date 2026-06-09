import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SuperAdminReviewsPage } from "@/components/dashboard/super-admin/reviews-page";

export const dynamic = "force-dynamic";

export default async function SuperAdminReviews() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "super_admin") redirect("/dashboard/admin");

  const { data: reviews } = await supabase
    .from("pitch_reviews")
    .select(`*, users!reviewer_id(full_name, email), pitches(startups(name, logo_url))`)
    .order("created_at", { ascending: false });

  return <SuperAdminReviewsPage reviews={reviews ?? []} />;
}

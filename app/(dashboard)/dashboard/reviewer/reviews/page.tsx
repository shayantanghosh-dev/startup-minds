import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReviewerMyReviewsPage } from "@/components/dashboard/reviewer/my-reviews-page";

export const dynamic = "force-dynamic";

export default async function ReviewerReviews() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: reviews } = await supabase
    .from("pitch_reviews")
    .select(`
      *,
      pitches(
        id, status, ai_quality_score, amount_raising,
        startups(id, name, logo_url, industry, stage)
      )
    `)
    .eq("reviewer_id", user.id)
    .order("created_at", { ascending: false });

  return <ReviewerMyReviewsPage reviews={reviews ?? []} />;
}

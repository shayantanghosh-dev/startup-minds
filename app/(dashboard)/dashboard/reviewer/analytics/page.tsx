import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReviewerAnalyticsPage } from "@/components/dashboard/reviewer/analytics-page";

export const dynamic = "force-dynamic";

export default async function ReviewerAnalytics() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { count: totalReviews },
    { count: approvedReviews },
    { count: rejectedReviews },
    { data: recentReviews },
  ] = await Promise.all([
    supabase.from("pitch_reviews").select("*", { count: "exact", head: true }).eq("reviewer_id", user.id),
    supabase.from("pitch_reviews").select("*", { count: "exact", head: true }).eq("reviewer_id", user.id).eq("recommendation", "approve"),
    supabase.from("pitch_reviews").select("*", { count: "exact", head: true }).eq("reviewer_id", user.id).eq("recommendation", "reject"),
    supabase.from("pitch_reviews").select("*, pitches(startups(name))").eq("reviewer_id", user.id).order("created_at", { ascending: false }).limit(10),
  ]);

  return (
    <ReviewerAnalyticsPage
      stats={{ totalReviews: totalReviews ?? 0, approvedReviews: approvedReviews ?? 0, rejectedReviews: rejectedReviews ?? 0 }}
      recentReviews={recentReviews ?? []}
    />
  );
}

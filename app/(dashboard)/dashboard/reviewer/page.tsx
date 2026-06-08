import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReviewerOverview } from "@/components/dashboard/reviewer/overview";

export default async function ReviewerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: assignedPitches } = await supabase
    .from("pitches")
    .select("*, startups(name, stage, industry, logo_url)")
    .eq("reviewer_id", user.id)
    .in("status", ["assigned", "under_review"])
    .order("submitted_at", { ascending: true });

  const { data: completedReviews } = await supabase
    .from("pitch_reviews")
    .select("*, pitches(startups(name))")
    .eq("reviewer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <ReviewerOverview
      assignedPitches={assignedPitches ?? []}
      completedReviews={completedReviews ?? []}
    />
  );
}

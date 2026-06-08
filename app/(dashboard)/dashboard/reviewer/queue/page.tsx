export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReviewQueue from "@/components/dashboard/reviewer/review-queue";

export default async function ReviewQueuePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pitches } = await supabase
    .from("pitches")
    .select(`
      id, status, created_at, submitted_at, tagline,
      startup:startups(id, name, stage, industry, logo_url)
    `)
    .in("status", ["submitted", "assigned", "under_review", "resubmitted"])
    .order("submitted_at", { ascending: true, nullsFirst: false });

  return <ReviewQueue pitches={pitches ?? []} />;
}

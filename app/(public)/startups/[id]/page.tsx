export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StartupPublicProfile from "@/components/startup/public-profile";

export default async function StartupPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: startup } = await supabase
    .from("startups")
    .select(`
      *,
      founder:users!startups_founder_id_fkey(id, full_name, avatar_url, bio),
      members:startup_members(
        *,
        user:users(id, full_name, avatar_url)
      ),
      pitch:pitches(
        id, tagline, problem_statement, solution, value_proposition,
        funding_ask, pre_money_valuation, tam, sam, som, status,
        ai_analysis:ai_analyses(overall_score, strengths, weaknesses)
      ),
      health_scores:startup_health_scores(
        overall_score, team_score, market_score, product_score,
        traction_score, financials_score, calculated_at
      ),
      _count:likes(count)
    `)
    .eq("id", id)
    .single();

  if (!startup) notFound();

  // Only show published pitches to non-founders
  const pitch = startup.pitch as Record<string, unknown>[];
  const publishedPitch = pitch?.find((p) => p.status === "published") ?? null;
  const isOwner = user?.id === (startup.founder_id as string);

  if (!publishedPitch && !isOwner) notFound();

  let userProfile = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    userProfile = data;
  }

  let isLiked = false;
  let isBookmarked = false;
  if (user) {
    const [{ data: like }, { data: bookmark }] = await Promise.all([
      supabase.from("likes").select("id").eq("user_id", user.id).eq("startup_id", id).single(),
      supabase.from("bookmarks").select("id").eq("user_id", user.id).eq("startup_id", id).single(),
    ]);
    isLiked = !!like;
    isBookmarked = !!bookmark;
  }

  return (
    <StartupPublicProfile
      startup={startup}
      pitch={publishedPitch ?? (isOwner ? pitch?.[0] ?? null : null)}
      currentUserId={user?.id ?? null}
      userRole={userProfile?.role ?? null}
      isOwner={isOwner}
      isLiked={isLiked}
      isBookmarked={isBookmarked}
    />
  );
}

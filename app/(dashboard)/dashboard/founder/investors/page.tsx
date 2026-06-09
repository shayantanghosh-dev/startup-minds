import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FounderInvestorsPage } from "@/components/dashboard/founder/investors-page";

export const dynamic = "force-dynamic";

export default async function FounderInvestorsRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: startup } = await supabase
    .from("startups")
    .select("id, name")
    .eq("founder_id", user.id)
    .single();

  if (!startup) {
    return <FounderInvestorsPage startup={null} matches={[]} />;
  }

  const admin = await createAdminClient();

  // Step 1: fetch matches — filter is_dismissed in JS to avoid boolean coercion issues
  const { data: allMatches, error: matchError } = await admin
    .from("startup_matches")
    .select("id, compatibility_score, match_reasons, ai_explanation, investor_id, is_dismissed")
    .eq("startup_id", startup.id)
    .order("compatibility_score", { ascending: false });

  if (matchError) console.error("[investors] startup_matches error:", matchError);

  const rawMatches = (allMatches ?? []).filter((m) => !m.is_dismissed);

  if (!rawMatches.length) {
    return <FounderInvestorsPage startup={startup} matches={[]} />;
  }

  // Step 2: fetch investor profiles
  const invIds = [...new Set(rawMatches.map((m) => m.investor_id as string).filter(Boolean))];
  const { data: investors } = await admin
    .from("investors")
    .select("id, user_id, organization, organization_type, min_ticket_size, max_ticket_size, preferred_sectors, preferred_stages, investment_thesis, is_verified")
    .in("id", invIds);

  // Step 3: fetch user profiles
  const userIds = [...new Set((investors ?? []).map((i) => i.user_id as string).filter(Boolean))];
  const { data: userProfiles } = await admin
    .from("users")
    .select("id, full_name, avatar_url, email, location")
    .in("id", userIds);

  const investorMap = Object.fromEntries((investors ?? []).map((i) => [i.id, i]));
  const userMap = Object.fromEntries((userProfiles ?? []).map((u) => [u.id, u]));

  const matches = rawMatches
    .map((m) => {
      const inv = investorMap[m.investor_id as string];
      const usr = inv ? userMap[inv.user_id as string] : null;
      if (!inv || !usr) return null;
      return {
        id: m.id as string,
        compatibility_score: m.compatibility_score as number,
        match_reasons: m.match_reasons as string[] | null,
        ai_explanation: m.ai_explanation as string | null,
        investors: { ...inv, users: usr },
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  return <FounderInvestorsPage startup={startup} matches={matches} />;
}

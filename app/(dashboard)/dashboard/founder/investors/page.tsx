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

  // Fetch matches + investors + user profiles via explicit SQL join
  // to avoid PostgREST nested-select FK hint ambiguity
  const { data: rows } = await admin.rpc("get_founder_investor_matches", {
    p_startup_id: startup.id,
  });

  // Fallback: manual join if RPC doesn't exist
  let matches: Parameters<typeof FounderInvestorsPage>[0]["matches"] = [];

  if (rows) {
    matches = rows;
  } else {
    // Manual join: fetch each layer separately
    const { data: rawMatches } = await admin
      .from("startup_matches")
      .select("id, compatibility_score, match_reasons, ai_explanation")
      .eq("startup_id", startup.id)
      .eq("is_dismissed", false)
      .order("compatibility_score", { ascending: false });

    if (rawMatches?.length) {
      const investorIds = [...new Set(rawMatches.map((m) => m.investor_id as string).filter(Boolean))];

      // Need investor_id too
      const { data: matchesFull } = await admin
        .from("startup_matches")
        .select("id, compatibility_score, match_reasons, ai_explanation, investor_id")
        .eq("startup_id", startup.id)
        .eq("is_dismissed", false)
        .order("compatibility_score", { ascending: false });

      const invIds = [...new Set((matchesFull ?? []).map((m) => m.investor_id as string).filter(Boolean))];

      const { data: investors } = await admin
        .from("investors")
        .select("id, user_id, organization, organization_type, min_ticket_size, max_ticket_size, preferred_sectors, preferred_stages, investment_thesis, is_verified")
        .in("id", invIds);

      const userIds = [...new Set((investors ?? []).map((i) => i.user_id as string).filter(Boolean))];

      const { data: userProfiles } = await admin
        .from("users")
        .select("id, full_name, avatar_url, email, location")
        .in("id", userIds);

      const investorMap = Object.fromEntries((investors ?? []).map((i) => [i.id, i]));
      const userMap = Object.fromEntries((userProfiles ?? []).map((u) => [u.id, u]));

      matches = (matchesFull ?? []).map((m) => {
        const inv = investorMap[m.investor_id as string];
        const usr = inv ? userMap[inv.user_id as string] : null;
        return {
          id: m.id,
          compatibility_score: m.compatibility_score,
          match_reasons: m.match_reasons,
          ai_explanation: m.ai_explanation,
          investors: inv ? { ...inv, users: usr ?? null } : null,
        };
      }).filter((m) => m.investors && m.investors.users);
    }
  }

  return <FounderInvestorsPage startup={startup} matches={matches} />;
}

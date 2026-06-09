import { createClient } from "@/lib/supabase/server";
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

  const { data: matches } = startup ? await supabase
    .from("startup_matches")
    .select(`
      *,
      investors(
        id, organization, organization_type, min_ticket_size, max_ticket_size,
        preferred_sectors, preferred_stages, investment_thesis, is_verified,
        users(full_name, avatar_url, email, location)
      )
    `)
    .eq("startup_id", startup.id)
    .eq("is_dismissed", false)
    .order("compatibility_score", { ascending: false }) : { data: [] };

  return <FounderInvestorsPage startup={startup} matches={matches ?? []} />;
}

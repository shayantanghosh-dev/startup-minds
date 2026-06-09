import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StartupDiscovery } from "@/components/investor/startup-discovery";

export default async function DiscoverPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: investor } = await supabase
    .from("investors")
    .select("id, kyc_status, is_verified")
    .eq("user_id", user.id)
    .single();

  if (!investor?.is_verified) {
    redirect("/dashboard/investor/kyc");
  }

  const { data: startups } = await supabase
    .from("startups")
    .select(`
      *,
      startup_health_scores(overall_score),
      pitches(status, amount_raising, ai_quality_score)
    `)
    .in("pitches.status", ["published"])
    .order("health_score", { ascending: false })
    .limit(20);

  // Fetch existing connection requests sent by current user
  const { data: existingConnections } = await supabase
    .from("connection_requests")
    .select("receiver_id, status")
    .eq("sender_id", user.id);

  const connectionMap: Record<string, string> = {};
  for (const c of existingConnections ?? []) {
    connectionMap[c.receiver_id] = c.status;
  }

  return (
    <StartupDiscovery
      startups={startups ?? []}
      investorId={investor.id}
      currentUserId={user.id}
      connectionMap={connectionMap}
    />
  );
}

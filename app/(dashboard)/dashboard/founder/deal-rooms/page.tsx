import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DealRoomsPage } from "@/components/dashboard/deal-rooms-page";

export const dynamic = "force-dynamic";

export default async function FounderDealRoomsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: startup } = await supabase
    .from("startups")
    .select("id")
    .eq("founder_id", user.id)
    .single();

  const { data: dealRooms } = startup ? await supabase
    .from("deal_rooms")
    .select(`
      *,
      investors(id, organization, users(full_name, avatar_url)),
      deal_room_milestones(id, status),
      deal_room_activities(id, created_at)
    `)
    .eq("startup_id", startup.id)
    .order("updated_at", { ascending: false }) : { data: [] };

  return <DealRoomsPage dealRooms={dealRooms ?? []} role="founder" userId={user.id} />;
}

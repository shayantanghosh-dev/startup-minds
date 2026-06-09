import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DealRoomsPage } from "@/components/dashboard/deal-rooms-page";

export const dynamic = "force-dynamic";

export default async function InvestorDealRoomsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: investor } = await supabase
    .from("investors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: dealRooms } = investor ? await supabase
    .from("deal_rooms")
    .select(`
      *,
      startups(id, name, logo_url, industry, stage),
      deal_room_milestones(id, status),
      deal_room_activities(id, created_at)
    `)
    .eq("investor_id", investor.id)
    .order("updated_at", { ascending: false }) : { data: [] };

  return <DealRoomsPage dealRooms={dealRooms ?? []} role="investor" userId={user.id} />;
}

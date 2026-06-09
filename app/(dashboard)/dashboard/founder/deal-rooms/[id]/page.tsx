import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { DealRoomDetailPage } from "@/components/dashboard/deal-room-detail";

export const dynamic = "force-dynamic";

export default async function DealRoomDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: dealRoom } = await supabase
    .from("deal_rooms")
    .select(`
      *,
      startups(id, name, logo_url, founder_id),
      investors(id, organization, user_id, users(full_name, avatar_url)),
      deal_room_milestones(*),
      deal_room_activities(*, users(full_name, avatar_url)),
      deal_room_notes(*, users(full_name, avatar_url))
    `)
    .eq("id", id)
    .single();

  if (!dealRoom) notFound();

  return <DealRoomDetailPage dealRoom={dealRoom} currentUserId={user.id} />;
}

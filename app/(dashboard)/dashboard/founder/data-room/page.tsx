import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DataRoomPage } from "@/components/dashboard/data-room-page";

export const dynamic = "force-dynamic";

export default async function FounderDataRoomPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: startup } = await supabase
    .from("startups")
    .select("id, name")
    .eq("founder_id", user.id)
    .single();

  const { data: dataRooms } = startup ? await supabase
    .from("data_rooms")
    .select(`*, data_room_documents(id, name, file_type, file_size, category, created_at)`)
    .eq("startup_id", startup.id)
    .order("created_at", { ascending: false }) : { data: [] };

  return <DataRoomPage startup={startup} dataRooms={dataRooms ?? []} />;
}

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConnectionsPage } from "@/components/dashboard/connections-page";

export default async function FounderConnectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: connections } = await supabase
    .from("connection_requests")
    .select(`
      *,
      sender:users!sender_id(id, full_name, avatar_url, role),
      receiver:users!receiver_id(id, full_name, avatar_url, role)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .neq("status", "blocked")
    .order("created_at", { ascending: false });

  return <ConnectionsPage connections={connections ?? []} currentUserId={user.id} />;
}

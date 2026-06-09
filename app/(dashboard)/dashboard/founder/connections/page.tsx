export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ConnectionsPage } from "@/components/dashboard/connections-page";

export default async function FounderConnectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: raw } = await admin
    .from("connection_requests")
    .select("id, status, message, created_at, sender_id, receiver_id")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .neq("status", "blocked")
    .order("created_at", { ascending: false });

  if (!raw?.length) {
    return <ConnectionsPage connections={[]} currentUserId={user.id} />;
  }

  // Collect all user IDs we need profiles for
  const userIds = [...new Set([
    ...raw.map((r) => r.sender_id as string),
    ...raw.map((r) => r.receiver_id as string),
  ])];

  const { data: profiles } = await admin
    .from("users")
    .select("id, full_name, avatar_url, role")
    .in("id", userIds);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const connections = raw.map((r) => ({
    id: r.id,
    status: r.status,
    message: r.message,
    created_at: r.created_at,
    sender: profileMap[r.sender_id as string] ?? { id: r.sender_id, full_name: "Unknown", avatar_url: null, role: "founder" },
    receiver: profileMap[r.receiver_id as string] ?? { id: r.receiver_id, full_name: "Unknown", avatar_url: null, role: "founder" },
  }));

  return <ConnectionsPage connections={connections} currentUserId={user.id} />;
}

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import MessagingPage from "@/components/messaging/messaging-page";

export default async function InvestorMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, participant_ids, updated_at, created_at")
    .contains("participant_ids", [user.id])
    .order("updated_at", { ascending: false });

  if (!conversations?.length) {
    return <MessagingPage conversations={[]} currentUserId={user.id} />;
  }

  const otherUserIds = [...new Set(
    conversations.flatMap((c) =>
      ((c.participant_ids as string[]) ?? []).filter((id) => id !== user.id)
    )
  )];

  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("users")
    .select("id, full_name, avatar_url, role")
    .in("id", otherUserIds);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const convIds = conversations.map((c) => c.id as string);
  const { data: msgs } = await supabase
    .from("messages")
    .select("conversation_id, content, created_at, sender_id")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: false });

  const lastMessages: Record<string, Record<string, unknown>> = {};
  for (const m of msgs ?? []) {
    const cid = m.conversation_id as string;
    if (!lastMessages[cid]) lastMessages[cid] = m;
  }

  const hydratedConversations = conversations.map((c) => {
    const otherId = ((c.participant_ids as string[]) ?? []).find((id) => id !== user.id);
    const otherUser = otherId ? profileMap[otherId] ?? null : null;
    return {
      ...c,
      other_user: otherUser,
      last_message: lastMessages[c.id as string] ?? null,
    };
  });

  return <MessagingPage conversations={hydratedConversations} currentUserId={user.id} />;
}

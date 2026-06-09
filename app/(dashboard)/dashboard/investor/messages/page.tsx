export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MessagingPage from "@/components/messaging/messaging-page";

export default async function InvestorMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: conversations } = await supabase
    .from("conversations")
    .select(`
      *,
      participants:conversation_participants(
        user:users(id, full_name, avatar_url, role)
      )
    `)
    .contains("participant_ids", [user.id])
    .order("updated_at", { ascending: false });

  const convIds = (conversations ?? []).map(c => c.id as string);
  const lastMessages: Record<string, Record<string, unknown>> = {};
  if (convIds.length > 0) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("conversation_id, content, created_at, sender_id")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false });
    if (msgs) {
      for (const m of msgs) {
        const cid = m.conversation_id as string;
        if (!lastMessages[cid]) lastMessages[cid] = m;
      }
    }
  }

  const hydratedConversations = (conversations ?? []).map(c => ({
    ...c,
    last_message: lastMessages[c.id as string] ?? null,
  }));

  return <MessagingPage conversations={hydratedConversations} currentUserId={user.id} />;
}

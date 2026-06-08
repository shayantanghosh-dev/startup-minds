export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MessagingPage from "@/components/messaging/messaging-page";

export default async function InvestorMessagesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: conversations } = await supabase
    .from("conversations")
    .select(`
      *,
      participants:conversation_participants(
        user:users(id, full_name, avatar_url, role)
      ),
      last_message:messages(content, created_at, sender_id)
    `)
    .order("updated_at", { ascending: false });

  return <MessagingPage conversations={conversations ?? []} currentUserId={user.id} />;
}

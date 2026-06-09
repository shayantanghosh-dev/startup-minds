import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/conversations — create or find existing conversation between two users
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { other_user_id } = await req.json();
  if (!other_user_id) return NextResponse.json({ error: "other_user_id required" }, { status: 400 });
  if (other_user_id === user.id) return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });

  // Check if conversation already exists (both users in participant_ids)
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .contains("participant_ids", [user.id, other_user_id])
    .limit(1)
    .single();

  if (existing) return NextResponse.json({ conversation_id: existing.id });

  // Create new conversation
  const { data: conv, error } = await supabase
    .from("conversations")
    .insert({ participant_ids: [user.id, other_user_id] })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Add participant rows
  await supabase.from("conversation_participants").insert([
    { conversation_id: conv.id, user_id: user.id, unread_count: 0 },
    { conversation_id: conv.id, user_id: other_user_id, unread_count: 0 },
  ]);

  return NextResponse.json({ conversation_id: conv.id });
}

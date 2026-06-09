import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { sendConnectionRequestEmail, sendConnectionAcceptedEmail } from "@/lib/email/resend";

// POST /api/connections — send a connection request
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiver_id, message } = await req.json();
  if (!receiver_id) return NextResponse.json({ error: "receiver_id required" }, { status: 400 });
  if (receiver_id === user.id) return NextResponse.json({ error: "Cannot connect to yourself" }, { status: 400 });

  // Check for existing request
  const { data: existing } = await supabase
    .from("connection_requests")
    .select("id, status")
    .eq("sender_id", user.id)
    .eq("receiver_id", receiver_id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Connection request already exists", status: existing.status }, { status: 409 });
  }

  const { data: request, error } = await supabase
    .from("connection_requests")
    .insert({ sender_id: user.id, receiver_id, message: message ?? null, status: "pending" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send email notification (non-blocking)
  try {
    const [{ data: sender }, { data: receiver }] = await Promise.all([
      supabase.from("users").select("full_name, email").eq("id", user.id).single(),
      supabase.from("users").select("full_name, email").eq("id", receiver_id).single(),
    ]);
    if (sender && receiver) {
      await sendConnectionRequestEmail(
        receiver.email,
        receiver.full_name,
        sender.full_name,
        message ?? "I'd like to connect with you on StartupMinds."
      );
    }
  } catch (_) {}

  // Audit log
  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "connection_requested",
    entity_type: "connection_request",
    entity_id: request.id,
    new_data: { receiver_id, status: "pending" },
  });

  return NextResponse.json({ success: true, request });
}

// PATCH /api/connections — accept or reject a request
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { request_id, action } = await req.json();
  if (!request_id || !["accept", "reject", "block"].includes(action)) {
    return NextResponse.json({ error: "request_id and action (accept|reject|block) required" }, { status: 400 });
  }

  // Verify the current user is the receiver
  const { data: connReq } = await supabase
    .from("connection_requests")
    .select("*, sender:users!sender_id(full_name, email), receiver:users!receiver_id(full_name, email)")
    .eq("id", request_id)
    .eq("receiver_id", user.id)
    .single();

  if (!connReq) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  const statusMap: Record<string, string> = { accept: "accepted", reject: "rejected", block: "blocked" };
  const newStatus = statusMap[action];

  const { error } = await supabase
    .from("connection_requests")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", request_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send acceptance email (non-blocking)
  if (action === "accept") {
    try {
      const sender = connReq.sender as { full_name: string; email: string };
      const receiver = connReq.receiver as { full_name: string; email: string };
      await sendConnectionAcceptedEmail(sender.email, sender.full_name, receiver.full_name);
    } catch (_) {}
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: `connection_${action}ed`,
    entity_type: "connection_request",
    entity_id: request_id,
    new_data: { status: newStatus },
  });

  return NextResponse.json({ success: true, status: newStatus });
}

// GET /api/connections — list my connections and pending requests
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") ?? "all"; // all | pending | accepted

  let query = supabase
    .from("connection_requests")
    .select(`
      *,
      sender:users!sender_id(id, full_name, avatar_url, role),
      receiver:users!receiver_id(id, full_name, avatar_url, role)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (filter === "pending") query = query.eq("status", "pending");
  if (filter === "accepted") query = query.eq("status", "accepted");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ connections: data ?? [] });
}

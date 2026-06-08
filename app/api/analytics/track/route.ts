import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { event_name, entity_type, entity_id, properties } = body;

    await supabase.from("analytics_events").insert({
      user_id: user?.id,
      event_name,
      entity_type,
      entity_id,
      properties: properties ?? {},
      ip_address: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
  }
}

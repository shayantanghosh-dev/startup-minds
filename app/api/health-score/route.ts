import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { startup_id } = await req.json();
    if (!startup_id) return NextResponse.json({ error: "startup_id required" }, { status: 400 });

    // Verify ownership
    const { data: startup } = await supabase.from("startups").select("founder_id").eq("id", startup_id).single();
    if (!startup || startup.founder_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: score, error } = await supabase.rpc("compute_startup_health_score", { p_startup_id: startup_id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update the startup's health_score column
    await supabase.from("startups").update({ health_score: score }).eq("id", startup_id);

    return NextResponse.json({ score });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

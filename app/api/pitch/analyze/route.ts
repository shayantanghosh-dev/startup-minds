import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { analyzePitch, generateStartupHealthScore } from "@/lib/ai/gemini";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { pitchId } = await request.json();

    if (!pitchId) {
      return NextResponse.json({ error: "pitchId required" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Get pitch data
    const { data: pitch, error: pitchError } = await supabase
      .from("pitches")
      .select("*, startups(*)")
      .eq("id", pitchId)
      .single();

    if (pitchError || !pitch) {
      return NextResponse.json({ error: "Pitch not found" }, { status: 404 });
    }

    // Run AI analysis
    const [aiAnalysis, healthScoreData] = await Promise.all([
      analyzePitch(pitch),
      generateStartupHealthScore({
        startup: pitch.startups,
        pitch,
      }),
    ]);

    // Update pitch with AI analysis
    await supabase
      .from("pitches")
      .update({
        ai_quality_score: aiAnalysis.quality_score,
        ai_analysis: aiAnalysis,
      })
      .eq("id", pitchId);

    // Upsert health score
    await supabase.from("startup_health_scores").upsert({
      startup_id: pitch.startup_id,
      ...healthScoreData,
      computed_at: new Date().toISOString(),
    });

    // Update startup health score denormalized column
    await supabase
      .from("startups")
      .update({ health_score: healthScoreData.overall_score })
      .eq("id", pitch.startup_id);

    // Log audit
    await supabase.from("audit_logs").insert({
      action: "pitch_ai_analyzed",
      entity_type: "pitch",
      entity_id: pitchId,
      new_data: { quality_score: aiAnalysis.quality_score },
    });

    return NextResponse.json({ success: true, quality_score: aiAnalysis.quality_score });
  } catch (error) {
    console.error("AI analysis error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}

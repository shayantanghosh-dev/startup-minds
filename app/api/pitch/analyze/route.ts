import { createAdminClient } from "@/lib/supabase/server";
import { analyzePitch, generateStartupHealthScore } from "@/lib/ai/gemini";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pitchId = body.pitchId ?? body.pitch_id;

    if (!pitchId) {
      return NextResponse.json({ error: "pitchId required" }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured on the server" },
        { status: 500 }
      );
    }

    const supabase = createAdminClient();

    // Get pitch data
    const { data: pitch, error: pitchError } = await supabase
      .from("pitches")
      .select("*, startups(*)")
      .eq("id", pitchId)
      .single();

    if (pitchError || !pitch) {
      return NextResponse.json(
        { error: `Pitch not found: ${pitchError?.message ?? "no data"}` },
        { status: 404 }
      );
    }

    // Run AI pitch analysis (required — fail fast if this errors)
    let aiAnalysis;
    try {
      aiAnalysis = await analyzePitch(pitch);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("analyzePitch failed:", msg);
      return NextResponse.json(
        { error: `AI analysis failed: ${msg}` },
        { status: 500 }
      );
    }

    // Save AI analysis to pitch
    const { error: updateError } = await supabase
      .from("pitches")
      .update({
        ai_quality_score: aiAnalysis.quality_score,
        ai_analysis: aiAnalysis,
      })
      .eq("id", pitchId);

    if (updateError) {
      console.error("Failed to save AI analysis:", updateError.message);
      // Still return success — analysis ran, just didn't save
    }

    // Health score generation is non-fatal — don't let it crash the whole request
    try {
      const healthScoreData = await generateStartupHealthScore({
        startup: pitch.startups,
        pitch,
      });

      await supabase.from("startup_health_scores").upsert({
        startup_id: pitch.startup_id,
        ...healthScoreData,
        computed_at: new Date().toISOString(),
      });

      await supabase
        .from("startups")
        .update({ health_score: healthScoreData.overall_score })
        .eq("id", pitch.startup_id);
    } catch (healthErr) {
      console.error(
        "Health score generation failed (non-fatal):",
        healthErr instanceof Error ? healthErr.message : healthErr
      );
    }

    // Audit log (non-fatal)
    try {
      await supabase.from("audit_logs").insert({
        action: "pitch_ai_analyzed",
        entity_type: "pitch",
        entity_id: pitchId,
        new_data: { quality_score: aiAnalysis.quality_score },
      });
    } catch {
      // ignore audit log failures
    }

    return NextResponse.json({
      success: true,
      quality_score: aiAnalysis.quality_score,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("AI analysis error:", msg);
    return NextResponse.json({ error: `Analysis failed: ${msg}` }, { status: 500 });
  }
}

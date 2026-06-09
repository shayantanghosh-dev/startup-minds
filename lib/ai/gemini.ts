import Groq from "groq-sdk";
import type { Pitch, AIAnalysis, StartupHealthScore } from "@/types";

// Groq is used for AI inference — free tier, no quota issues
// Model: llama-3.3-70b-versatile is fast, capable, and free on Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateJSON<T>(prompt: string): Promise<T> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are a helpful AI assistant. Always respond with valid JSON only — no markdown, no code fences, no extra text.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 2048,
    response_format: { type: "json_object" },
  });

  const text = completion.choices[0]?.message?.content ?? "";

  try {
    return JSON.parse(text) as T;
  } catch {
    // Strip any accidental fences and retry
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    return JSON.parse(cleaned) as T;
  }
}

export async function analyzePitch(pitch: Partial<Pitch>): Promise<AIAnalysis> {
  const prompt = `You are an expert startup analyst and venture capital advisor. Analyze this startup pitch and provide a comprehensive evaluation.

STARTUP PITCH DATA:
${JSON.stringify(pitch, null, 2)}

Provide a detailed analysis in the following JSON format:
{
  "quality_score": <0-100 integer>,
  "strengths": ["<strength1>", "<strength2>"],
  "weaknesses": ["<weakness1>", "<weakness2>"],
  "improvements": ["<improvement1>", "<improvement2>"],
  "risk_assessment": "<detailed risk analysis>",
  "funding_readiness": <0-100 integer>,
  "market_opportunity_score": <0-100 integer>,
  "team_strength_score": <0-100 integer>,
  "business_viability_score": <0-100 integer>,
  "competitive_positioning": "<competitive analysis>",
  "missing_information": ["<missing1>", "<missing2>"],
  "executive_summary": "<concise 2-3 sentence executive summary>",
  "investment_insights": ["<insight1>", "<insight2>"],
  "overall_recommendation": "<strong_buy|buy|hold|pass>"
}`;

  return generateJSON<AIAnalysis>(prompt);
}

export async function generateStartupHealthScore(
  startupData: Record<string, unknown>
): Promise<Omit<StartupHealthScore, "id" | "startup_id" | "computed_at">> {
  const prompt = `You are a startup health scoring expert. Evaluate this startup's overall health and readiness.

STARTUP DATA:
${JSON.stringify(startupData, null, 2)}

Respond with this JSON:
{
  "overall_score": <0-100>,
  "traction_score": <0-100>,
  "growth_score": <0-100>,
  "engagement_score": <0-100>,
  "team_quality_score": <0-100>,
  "fundraising_readiness_score": <0-100>,
  "investor_activity_score": <0-100>,
  "business_model_score": <0-100>,
  "market_opportunity_score": <0-100>,
  "score_breakdown": {
    "traction_reasoning": "<brief explanation>",
    "growth_reasoning": "<brief explanation>",
    "team_reasoning": "<brief explanation>",
    "business_model_reasoning": "<brief explanation>"
  }
}`;

  return generateJSON(prompt);
}

export async function generateMatchExplanation(
  startupData: Record<string, unknown>,
  investorPreferences: Record<string, unknown>
): Promise<{ score: number; reasons: string[]; explanation: string }> {
  const prompt = `You are an expert investment matchmaker. Evaluate the compatibility between this startup and investor.

STARTUP:
${JSON.stringify(startupData, null, 2)}

INVESTOR PREFERENCES:
${JSON.stringify(investorPreferences, null, 2)}

Respond with this JSON:
{
  "score": <0-100 compatibility score>,
  "reasons": ["<reason1>", "<reason2>", "<reason3>"],
  "explanation": "<2-3 sentence explanation of the match quality>"
}`;

  return generateJSON(prompt);
}

export async function generateInvestorSummary(
  pitch: Partial<Pitch>,
  startup: Record<string, unknown>
): Promise<{
  executive_summary: string;
  opportunity_analysis: string;
  risk_assessment: string;
  business_model_summary: string;
  key_insights: string[];
}> {
  const prompt = `You are a venture capital analyst. Generate a concise investor-focused summary for this startup pitch.

STARTUP: ${JSON.stringify(startup, null, 2)}
PITCH: ${JSON.stringify(pitch, null, 2)}

Respond with this JSON:
{
  "executive_summary": "<2-3 sentence high-level summary>",
  "opportunity_analysis": "<market opportunity assessment>",
  "risk_assessment": "<key risks and mitigants>",
  "business_model_summary": "<how the company makes money>",
  "key_insights": ["<insight1>", "<insight2>", "<insight3>"]
}`;

  return generateJSON(prompt);
}

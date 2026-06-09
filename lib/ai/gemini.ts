import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Pitch, AIAnalysis, StartupHealthScore } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// gemini-2.0-flash-lite has free-tier quota; 1.5-flash is deprecated, 2.0-flash needs billing
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

async function generateJSON<T>(prompt: string): Promise<T> {
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }
}

export async function analyzePitch(pitch: Partial<Pitch>): Promise<AIAnalysis> {
  const prompt = `You are an expert startup analyst and venture capital advisor. Analyze this startup pitch and provide a comprehensive evaluation.

STARTUP PITCH DATA:
${JSON.stringify(pitch, null, 2)}

Provide a detailed analysis in the following JSON format (respond ONLY with valid JSON, no markdown):
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
  const prompt = `You are a startup health scoring expert. Evaluate this startup's overall health and readiness based on the provided data.

STARTUP DATA:
${JSON.stringify(startupData, null, 2)}

Score each dimension from 0-100 and provide the result in this JSON format (respond ONLY with valid JSON, no markdown):
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

Respond ONLY with valid JSON (no markdown):
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

Respond ONLY with valid JSON (no markdown):
{
  "executive_summary": "<2-3 sentence high-level summary>",
  "opportunity_analysis": "<market opportunity assessment>",
  "risk_assessment": "<key risks and mitigants>",
  "business_model_summary": "<how the company makes money>",
  "key_insights": ["<insight1>", "<insight2>", "<insight3>"]
}`;

  return generateJSON(prompt);
}

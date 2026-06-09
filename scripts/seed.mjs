/**
 * StartupMinds — Comprehensive Seed Script
 * Usage: npm run seed
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Creates 16 users + all related platform data for realistic QA testing.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ──────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const envPath = resolve(__dirname, "../.env.local");
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const [k, ...v] = line.trim().split("=");
      if (k && !k.startsWith("#")) process.env[k] = v.join("=");
    }
  } catch {}
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.includes("PASTE_")) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY not set in .env.local");
  console.error("   Get it from: Supabase Dashboard → Project Settings → API → service_role key");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function log(msg) { console.log(`  ${msg}`); }
function section(msg) { console.log(`\n▶ ${msg}`); }

async function upsertAuthUser(email, password, meta) {
  // Try to get existing user first
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list?.users?.find(u => u.email === email);
  if (existing) return existing.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: meta,
  });
  if (error) throw new Error(`createUser(${email}): ${error.message}`);
  return data.user.id;
}

async function insert(table, rows, conflict = null) {
  const opts = conflict ? { onConflict: conflict, ignoreDuplicates: true } : {};
  const { error } = await supabase.from(table).upsert(rows, opts);
  if (error) {
    // Ignore unique violation — means data already seeded
    if (error.code === "23505" || error.message?.includes("duplicate") || error.message?.includes("already exists")) return;
    throw new Error(`insert(${table}): ${error.message}`);
  }
}

// ── Seed Data Definitions ────────────────────────────────────────────────────

const FOUNDERS = [
  { email: "arjun.sharma@startupminds.dev", name: "Arjun Sharma",    location: "Bangalore, India", linkedin: "https://linkedin.com/in/arjun-sharma" },
  { email: "priya.patel@startupminds.dev",  name: "Priya Patel",     location: "Mumbai, India",    linkedin: "https://linkedin.com/in/priya-patel" },
  { email: "rahul.gupta@startupminds.dev",  name: "Rahul Gupta",     location: "Delhi, India",     linkedin: "https://linkedin.com/in/rahul-gupta" },
  { email: "kavya.nair@startupminds.dev",   name: "Kavya Nair",      location: "Hyderabad, India", linkedin: "https://linkedin.com/in/kavya-nair" },
  { email: "vikram.das@startupminds.dev",   name: "Vikram Das",      location: "Chennai, India",   linkedin: "https://linkedin.com/in/vikram-das" },
];

const INVESTORS = [
  { email: "anand.mehta@startupminds.dev",   name: "Anand Mehta",   org: "Sequoia Capital India",  type: "vc_firm",  sectors: ["fintech","edtech","healthtech"],     stages: ["seed","series_a","series_b"],  min: 5000000,  max: 50000000 },
  { email: "sunita.rao@startupminds.dev",    name: "Sunita Rao",    org: "Nexus Venture Partners", type: "vc_firm",  sectors: ["saas","ai_ml","deeptech"],           stages: ["pre_seed","seed","series_a"],  min: 2000000,  max: 20000000 },
  { email: "deepak.jain@startupminds.dev",   name: "Deepak Jain",   org: "Kalaari Capital",        type: "vc_firm",  sectors: ["consumer","d2c","ecommerce"],        stages: ["seed","series_a"],             min: 5000000,  max: 30000000 },
  { email: "meera.krishna@startupminds.dev", name: "Meera Krishna", org: "IndependentAngel",       type: "angel",    sectors: ["fintech","insurtech","regtech"],     stages: ["idea","pre_seed","seed"],      min: 500000,   max: 5000000  },
  { email: "rajan.sinha@startupminds.dev",   name: "Rajan Sinha",   org: "Blume Ventures",         type: "vc_firm",  sectors: ["b2b_saas","logistics","agritech"],   stages: ["seed","series_a","series_b"],  min: 3000000,  max: 25000000 },
];

const REVIEWERS = [
  { email: "reviewer1@startupminds.dev", name: "Aisha Khan",     location: "Pune, India"     },
  { email: "reviewer2@startupminds.dev", name: "Kiran Reddy",    location: "Bangalore, India"},
  { email: "reviewer3@startupminds.dev", name: "Sanjay Bose",    location: "Kolkata, India"  },
];

const ADMIN     = { email: "admin@startupminds.dev",       name: "Platform Admin",  location: "Bangalore, India" };
const SUPERADMIN= { email: "superadmin@startupminds.dev",  name: "Super Admin",     location: "Bangalore, India" };

const STARTUPS = [
  {
    idx: 0,
    name: "FinEdge",
    slogan: "AI-powered personal finance for Bharat",
    description: "FinEdge democratizes financial planning for 500M underserved Indians using conversational AI. Our platform provides personalised investment advice, budgeting tools, and micro-insurance products through WhatsApp.",
    stage: "seed",
    industry: "fintech",
    city: "Bangalore",
    country: "India",
    website: "https://finedge.in",
    dpiit: "DPIIT-2023-FB-001",
    health_score: 78,
    monthly_revenue: 4200000,
    monthly_growth: 18.5,
    total_customers: 12400,
    mrr: 4200000,
    arr: 50400000,
    amount_raising: 30000000,
    valuation: 150000000,
    equity: 20,
  },
  {
    idx: 1,
    name: "LearnSphere",
    slogan: "Personalised K-12 learning powered by adaptive AI",
    description: "LearnSphere uses generative AI to create hyper-personalised study plans for K-12 students. Adaptive assessments, gamified content, and real-time progress tracking for parents.",
    stage: "series_a",
    industry: "edtech",
    city: "Mumbai",
    country: "India",
    website: "https://learnsphere.in",
    dpiit: "DPIIT-2023-LS-002",
    health_score: 85,
    monthly_revenue: 8500000,
    monthly_growth: 22.3,
    total_customers: 35000,
    mrr: 8500000,
    arr: 102000000,
    amount_raising: 80000000,
    valuation: 400000000,
    equity: 20,
  },
  {
    idx: 2,
    name: "MediChain",
    slogan: "Blockchain-secured health records for India",
    description: "MediChain provides a patient-controlled, blockchain-backed health record platform. Doctors, labs, and hospitals interoperate seamlessly while patients own their data.",
    stage: "pre_seed",
    industry: "healthtech",
    city: "Delhi",
    country: "India",
    website: "https://medichain.health",
    dpiit: null,
    health_score: 62,
    monthly_revenue: 850000,
    monthly_growth: 11.2,
    total_customers: 2100,
    mrr: 850000,
    arr: 10200000,
    amount_raising: 10000000,
    valuation: 50000000,
    equity: 20,
  },
  {
    idx: 3,
    name: "AgriVision",
    slogan: "Satellite + AI crop analytics for Indian farmers",
    description: "AgriVision combines satellite imagery, IoT soil sensors, and ML models to give farmers precision recommendations on irrigation, fertiliser, and pest control — increasing yield by up to 30%.",
    stage: "seed",
    industry: "agritech",
    city: "Hyderabad",
    country: "India",
    website: "https://agrivision.farm",
    dpiit: "DPIIT-2024-AV-003",
    health_score: 71,
    monthly_revenue: 2100000,
    monthly_growth: 14.8,
    total_customers: 8700,
    mrr: 2100000,
    arr: 25200000,
    amount_raising: 20000000,
    valuation: 100000000,
    equity: 20,
  },
  {
    idx: 4,
    name: "LogiFlow",
    slogan: "Real-time B2B logistics visibility platform",
    description: "LogiFlow gives mid-market manufacturers a single control tower for tracking shipments across 50+ carriers. AI-powered ETAs, exception alerts, and carbon footprint reporting.",
    stage: "series_a",
    industry: "logistics",
    city: "Chennai",
    country: "India",
    website: "https://logiflow.io",
    dpiit: "DPIIT-2023-LF-004",
    health_score: 80,
    monthly_revenue: 6300000,
    monthly_growth: 19.7,
    total_customers: 420,
    mrr: 6300000,
    arr: 75600000,
    amount_raising: 60000000,
    valuation: 300000000,
    equity: 20,
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 StartupMinds Seed Script");
  console.log("════════════════════════════════════════");

  // ── 1. Create Auth Users ────────────────────────────────────────────────
  section("Creating auth users");

  const founderIds = [];
  for (const f of FOUNDERS) {
    const id = await upsertAuthUser(f.email, "Password123!", { role: "founder", full_name: f.name });
    founderIds.push(id);
    log(`✓ Founder: ${f.name} (${id.slice(0,8)}…)`);
  }

  const investorIds = [];
  for (const inv of INVESTORS) {
    const id = await upsertAuthUser(inv.email, "Password123!", { role: "investor", full_name: inv.name });
    investorIds.push(id);
    log(`✓ Investor: ${inv.name} (${id.slice(0,8)}…)`);
  }

  const reviewerIds = [];
  for (const r of REVIEWERS) {
    const id = await upsertAuthUser(r.email, "Password123!", { role: "reviewer", full_name: r.name });
    reviewerIds.push(id);
    log(`✓ Reviewer: ${r.name} (${id.slice(0,8)}…)`);
  }

  const adminId    = await upsertAuthUser(ADMIN.email, "Password123!", { role: "sub_admin", full_name: ADMIN.name });
  const superAdminId = await upsertAuthUser(SUPERADMIN.email, "Password123!", { role: "super_admin", full_name: SUPERADMIN.name });
  log(`✓ Admin:      ${ADMIN.name} (${adminId.slice(0,8)}…)`);
  log(`✓ Super Admin:${SUPERADMIN.name} (${superAdminId.slice(0,8)}…)`);

  // Brief pause to let trigger fire
  await new Promise(r => setTimeout(r, 2000));

  // ── 2. Update user profiles (trigger creates the row, we enrich it) ──────
  section("Enriching user profiles");

  for (let i = 0; i < FOUNDERS.length; i++) {
    await supabase.from("users").update({
      full_name: FOUNDERS[i].name,
      location: FOUNDERS[i].location,
      linkedin_url: FOUNDERS[i].linkedin,
      bio: `Founder & CEO at ${STARTUPS[i].name}. Building the future of ${STARTUPS[i].industry} in India.`,
      is_verified: true,
      role: "founder",
    }).eq("id", founderIds[i]);
  }

  for (let i = 0; i < INVESTORS.length; i++) {
    await supabase.from("users").update({
      full_name: INVESTORS[i].name,
      bio: `Partner at ${INVESTORS[i].org}. Investing in early-stage Indian startups.`,
      is_verified: true,
      role: "investor",
    }).eq("id", investorIds[i]);
  }

  for (let i = 0; i < REVIEWERS.length; i++) {
    await supabase.from("users").update({
      full_name: REVIEWERS[i].name,
      location: REVIEWERS[i].location,
      role: "reviewer",
      is_verified: true,
    }).eq("id", reviewerIds[i]);
  }

  await supabase.from("users").update({ full_name: ADMIN.name, role: "sub_admin",   is_verified: true }).eq("id", adminId);
  await supabase.from("users").update({ full_name: SUPERADMIN.name, role: "super_admin", is_verified: true }).eq("id", superAdminId);
  log("✓ All user profiles enriched");

  // ── 3. Create Startups ───────────────────────────────────────────────────
  section("Creating startups");

  const startupIds = [];
  for (let i = 0; i < STARTUPS.length; i++) {
    const s = STARTUPS[i];
    const { data, error } = await supabase.from("startups").upsert({
      founder_id: founderIds[i],
      name: s.name,
      slogan: s.slogan,
      description: s.description,
      stage: s.stage,
      industry: s.industry,
      city: s.city,
      country: s.country,
      website: s.website,
      dpiit_number: s.dpiit,
      is_dpiit_verified: !!s.dpiit,
      is_featured: i < 3,
      health_score: s.health_score,
      total_likes: 10 + i * 7,
      total_bookmarks: 5 + i * 4,
      total_views: 200 + i * 150,
    }, { onConflict: "founder_id", ignoreDuplicates: false }).select("id").single();

    if (error) throw new Error(`startup(${s.name}): ${error.message}`);
    startupIds.push(data.id);
    log(`✓ Startup: ${s.name} → ${data.id.slice(0,8)}…`);
  }

  // ── 4. Startup Members ───────────────────────────────────────────────────
  section("Adding startup members");
  const memberData = [
    { startup: 0, name: "Priya Iyer",    designation: "CTO",    equity: 15, role: "technical" },
    { startup: 0, name: "Manish Verma",  designation: "CMO",    equity: 8,  role: "marketing" },
    { startup: 1, name: "Amit Shah",     designation: "CTO",    equity: 20, role: "technical" },
    { startup: 1, name: "Rina Bose",     designation: "Head of Product", equity: 10, role: "product" },
    { startup: 2, name: "Dr. Anita Menon", designation: "Medical Director", equity: 15, role: "domain_expert" },
    { startup: 3, name: "Suresh Pillai", designation: "CTO",    equity: 20, role: "technical" },
    { startup: 4, name: "Pooja Thakur",  designation: "COO",    equity: 15, role: "operations" },
    { startup: 4, name: "Rajesh Kumar",  designation: "VP Engineering", equity: 8, role: "technical" },
  ];
  for (const m of memberData) {
    const { error } = await supabase.from("startup_members").insert({
      startup_id: startupIds[m.startup],
      name: m.name,
      designation: m.designation,
      equity_percentage: m.equity,
      role_in_startup: m.role,
      is_founder: false,
    });
    if (error && !error.message.includes("duplicate")) throw new Error(`member: ${error.message}`);
  }
  log("✓ Startup members added");

  // ── 5. Pitches ───────────────────────────────────────────────────────────
  section("Creating pitches");

  const pitchStatuses = ["published", "approved", "under_review", "approved", "published"];
  const pitchIds = [];

  for (let i = 0; i < STARTUPS.length; i++) {
    const s = STARTUPS[i];
    const status = pitchStatuses[i];
    const { data, error } = await supabase.from("pitches").upsert({
      startup_id: startupIds[i],
      version: 1,
      status,
      submitted_at: new Date(Date.now() - i * 7 * 86400000).toISOString(),
      // Overview
      company_overview: `${s.name} is a ${s.stage}-stage ${s.industry} company based in ${s.city}, India. ${s.description}`,
      problem_statement: `The ${s.industry} sector in India faces significant inefficiencies costing billions annually. Traditional solutions are fragmented, expensive, and inaccessible to the masses.`,
      pain_points: [
        "High cost and complexity of existing solutions",
        "Poor user experience in legacy systems",
        "Lack of real-time data and actionable insights",
        "Underserved tier-2 and tier-3 markets",
      ],
      real_world_examples: `A typical ${s.industry} user loses 15-20 hours/week navigating fragmented tools. ${s.name} consolidates this into a single intelligent platform.`,
      // Solution
      solution_description: `${s.name} leverages AI and modern cloud infrastructure to deliver a seamless, affordable, and scalable solution that addresses the core pain points.`,
      unique_value_proposition: `${s.slogan}. We're 10x cheaper, 5x faster, and built specifically for the Indian market.`,
      technology_stack: ["React", "Node.js", "Python", "PostgreSQL", "AWS", "TensorFlow"],
      competitive_advantages: [
        "First-mover advantage in tier-2/3 markets",
        "Proprietary AI models trained on Indian data",
        "Strong network effects",
        "Regulatory compliance built-in",
      ],
      // Market
      tam: 500000000000,
      sam: 50000000000,
      som: 5000000000,
      market_trends: "Growing smartphone penetration, digital payments adoption, and government push for digitisation create a perfect storm for ${s.name}'s growth.",
      // Business Model
      revenue_model: "SaaS subscription with usage-based pricing tiers. Enterprise contracts for large clients.",
      pricing_strategy: "Freemium to paid conversion. Starter at ₹999/month, Professional at ₹4,999/month, Enterprise custom pricing.",
      scalability_plan: "Asset-light SaaS model with 80%+ gross margins. Expand to SEA markets by 2026.",
      // Traction
      monthly_revenue: s.monthly_revenue,
      monthly_growth_rate: s.monthly_growth,
      total_customers: s.total_customers,
      mrr: s.mrr,
      arr: s.arr,
      partnerships: ["Google for Startups", "AWS Activate", i < 2 ? "NASSCOM" : null].filter(Boolean),
      // Fundraising
      amount_raising: s.amount_raising,
      valuation_expectation: s.valuation,
      equity_offered: s.equity,
      use_of_funds: {
        product: 35,
        marketing: 30,
        team: 25,
        operations: 10,
      },
      milestones_achieved: [
        "Launched MVP",
        "First 100 paying customers",
        "₹1Cr ARR milestone",
        i > 1 ? "Series A term sheet" : null,
      ].filter(Boolean),
      // AI Analysis
      ai_quality_score: 60 + i * 5 + Math.floor(Math.random() * 10),
      ai_analysis: {
        strengths: ["Strong traction", "Large addressable market", "Experienced team"],
        weaknesses: ["Competitive landscape", "Customer acquisition cost"],
        overall_recommendation: "Recommended for investment consideration",
        funding_readiness: 70 + i * 4,
      },
    }, { onConflict: "startup_id,version", ignoreDuplicates: false }).select("id").single();

    if (error) throw new Error(`pitch(${s.name}): ${error.message}`);
    pitchIds.push(data.id);
    log(`✓ Pitch: ${s.name} [${status}] → ${data.id.slice(0,8)}…`);
  }

  // ── 6. Pitch Reviews ─────────────────────────────────────────────────────
  section("Creating pitch reviews");

  const reviewedPitches = [0, 1, 3, 4]; // indices of pitches that have been reviewed
  for (const idx of reviewedPitches) {
    const reviewerId = reviewerIds[idx % reviewerIds.length];
    const scores = {
      problem_validation: 7 + (idx % 3),
      solution_quality: 7 + (idx % 2),
      team_strength: 8,
      market_potential: 8 + (idx % 2),
      competitive_advantage: 7,
      scalability: 8,
      business_model: 7 + (idx % 2),
      traction: 7 + (idx % 3),
      investment_readiness: 7 + (idx % 2),
    };
    const overall = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;

    const { error } = await supabase.from("pitch_reviews").upsert({
      pitch_id: pitchIds[idx],
      reviewer_id: reviewerId,
      ...scores,
      overall_score: Math.round(overall * 100) / 100,
      feedback: `This is a well-constructed pitch with strong market validation. The founding team demonstrates deep domain expertise. Traction metrics are impressive for this stage. Key areas for improvement include competitive moat articulation and clearer path to profitability.`,
      recommendation: idx === 2 ? "request_changes" : "approve",
      internal_notes: "Strong candidate. Recommend scheduling a call with the founding team.",
    }, { onConflict: "pitch_id,reviewer_id", ignoreDuplicates: true });
    if (error && !error.message.includes("duplicate")) throw new Error(`review: ${error.message}`);
  }
  log("✓ Pitch reviews created");

  // ── 7. Assign Reviewers to Pitches ───────────────────────────────────────
  section("Assigning reviewers to pitches");
  for (let i = 0; i < pitchIds.length; i++) {
    await supabase.from("pitches").update({
      reviewer_id: reviewerIds[i % reviewerIds.length],
    }).eq("id", pitchIds[i]);
  }
  log("✓ Reviewers assigned");

  // ── 8. Investor Profiles ─────────────────────────────────────────────────
  section("Creating investor profiles");

  const investorProfileIds = [];
  for (let i = 0; i < INVESTORS.length; i++) {
    const inv = INVESTORS[i];
    const { data, error } = await supabase.from("investors").upsert({
      user_id: investorIds[i],
      organization: inv.org,
      organization_type: inv.type,
      investment_thesis: `We invest in early-stage Indian startups transforming ${inv.sectors.join(", ")} through technology. We look for exceptional founders with deep domain expertise and a clear path to ₹100Cr+ revenue.`,
      preferred_sectors: inv.sectors,
      preferred_stages: inv.stages,
      preferred_geographies: ["India", "Southeast Asia"],
      min_ticket_size: inv.min,
      max_ticket_size: inv.max,
      total_investments: 5 + i * 3,
      portfolio_count: 8 + i * 4,
      kyc_status: "approved",
      is_verified: true,
    }, { onConflict: "user_id", ignoreDuplicates: false }).select("id").single();

    if (error) throw new Error(`investor(${inv.name}): ${error.message}`);
    investorProfileIds.push(data.id);
    log(`✓ Investor profile: ${inv.name} → ${data.id.slice(0,8)}…`);
  }

  // ── 9. KYC Documents ────────────────────────────────────────────────────
  section("Creating KYC documents");
  for (let i = 0; i < investorProfileIds.length; i++) {
    const { error } = await supabase.from("kyc_documents").insert({
      investor_id: investorProfileIds[i],
      document_type: "pan_card",
      document_url: `https://storage.example.com/kyc/investor-${i}-pan.pdf`,
      status: "approved",
      reviewer_id: adminId,
      reviewer_notes: "Document verified and approved.",
      reviewed_at: new Date(Date.now() - i * 86400000).toISOString(),
    });
    if (error && !error.message.includes("duplicate")) throw new Error(`kyc: ${error.message}`);
  }
  log("✓ KYC documents created");

  // ── 10. Startup Matches ──────────────────────────────────────────────────
  section("Creating startup matches (matchmaking)");
  const matchPairs = [
    { si: 0, ii: 0, score: 92, reasons: ["Sector match: fintech", "Stage match: seed", "Geography match: India"] },
    { si: 0, ii: 3, score: 85, reasons: ["Sector match: fintech", "Stage match: seed"] },
    { si: 1, ii: 1, score: 88, reasons: ["Sector match: edtech", "Stage match: series_a", "Geography match"] },
    { si: 1, ii: 0, score: 78, reasons: ["Sector match: edtech", "Stage match: series_a"] },
    { si: 2, ii: 0, score: 80, reasons: ["Sector match: healthtech", "Geography match: India"] },
    { si: 2, ii: 3, score: 75, reasons: ["Sector match: healthtech", "Stage: pre_seed angel range"] },
    { si: 3, ii: 4, score: 90, reasons: ["Sector match: agritech", "Stage match: seed", "Geography match"] },
    { si: 4, ii: 4, score: 87, reasons: ["Sector match: logistics", "Stage match: series_a", "Geography match"] },
    { si: 4, ii: 2, score: 72, reasons: ["Stage match: series_a", "Geography match: India"] },
  ];
  for (const m of matchPairs) {
    const { error } = await supabase.from("startup_matches").upsert({
      startup_id: startupIds[m.si],
      investor_id: investorProfileIds[m.ii],
      compatibility_score: m.score,
      match_reasons: m.reasons,
      ai_explanation: `${STARTUPS[m.si].name} is a strong match for ${INVESTORS[m.ii].name} based on sector alignment, stage fit, and geographic focus. ${m.reasons.join(". ")}.`,
      is_dismissed: false,
    }, { onConflict: "startup_id,investor_id", ignoreDuplicates: true });
    if (error && !error.message.includes("duplicate")) throw new Error(`match: ${error.message}`);
  }
  log("✓ Startup matches created");

  // ── 11. Health Scores ────────────────────────────────────────────────────
  section("Creating health scores");
  for (let i = 0; i < startupIds.length; i++) {
    const s = STARTUPS[i];
    const { error } = await supabase.from("startup_health_scores").upsert({
      startup_id: startupIds[i],
      overall_score: s.health_score,
      traction_score: 60 + i * 6,
      growth_score: 55 + i * 7,
      engagement_score: 65 + i * 4,
      team_quality_score: 70 + i * 3,
      fundraising_readiness_score: 55 + i * 8,
      investor_activity_score: 50 + i * 7,
      business_model_score: 65 + i * 5,
      market_opportunity_score: 72 + i * 3,
      score_breakdown: {
        traction: { mrr: s.mrr, growth_rate: s.monthly_growth, customers: s.total_customers },
        market: { tam: 500000000000, penetration: 0.01 * (i + 1) },
      },
      computed_at: new Date().toISOString(),
    }, { onConflict: "startup_id", ignoreDuplicates: false });
    if (error) throw new Error(`health_score: ${error.message}`);
  }
  log("✓ Health scores created");

  // ── 12. CRM Records ──────────────────────────────────────────────────────
  section("Creating CRM records");
  const crmStages = ["interested", "contacted", "meeting_scheduled", "due_diligence", "negotiation"];
  const crmPairs = [
    { ii: 0, si: 0, stage: "due_diligence", rating: 5 },
    { ii: 0, si: 1, stage: "meeting_scheduled", rating: 4 },
    { ii: 1, si: 1, stage: "negotiation", rating: 5 },
    { ii: 1, si: 2, stage: "interested", rating: 3 },
    { ii: 2, si: 3, stage: "contacted", rating: 4 },
    { ii: 3, si: 0, stage: "meeting_scheduled", rating: 4 },
    { ii: 4, si: 3, stage: "due_diligence", rating: 5 },
    { ii: 4, si: 4, stage: "negotiation", rating: 5 },
  ];
  const crmIds = [];
  for (const c of crmPairs) {
    const { data, error } = await supabase.from("crm_records").upsert({
      investor_id: investorProfileIds[c.ii],
      startup_id: startupIds[c.si],
      stage: c.stage,
      rating: c.rating,
      notes: `${INVESTORS[c.ii].name} is tracking ${STARTUPS[c.si].name}. Strong interest in their ${STARTUPS[c.si].industry} play. Follow-up scheduled.`,
      tags: [STARTUPS[c.si].industry, STARTUPS[c.si].stage, "high-priority"],
      next_follow_up: new Date(Date.now() + 7 * 86400000).toISOString(),
    }, { onConflict: "investor_id,startup_id", ignoreDuplicates: false }).select("id").single();
    if (error) throw new Error(`crm: ${error.message}`);
    crmIds.push(data.id);
  }
  log("✓ CRM records created");

  // CRM Tasks
  for (let i = 0; i < Math.min(crmIds.length, 4); i++) {
    await supabase.from("crm_tasks").insert({
      crm_record_id: crmIds[i],
      title: ["Send NDA", "Schedule pitch call", "Request financial model", "Due diligence checklist"][i],
      description: "Follow up required",
      due_date: new Date(Date.now() + (i + 1) * 3 * 86400000).toISOString(),
      is_completed: i === 0,
    });
  }
  log("✓ CRM tasks created");

  // ── 13. Deal Rooms ───────────────────────────────────────────────────────
  section("Creating deal rooms");
  const dealRoomPairs = [
    { si: 0, ii: 0 },
    { si: 1, ii: 1 },
    { si: 3, ii: 4 },
  ];
  const dealRoomIds = [];
  for (const d of dealRoomPairs) {
    const { data, error } = await supabase.from("deal_rooms").insert({
      startup_id: startupIds[d.si],
      investor_id: investorProfileIds[d.ii],
      title: `${STARTUPS[d.si].name} × ${INVESTORS[d.ii].name} — Deal Room`,
      description: `Structured deal room for Series A investment discussion between ${STARTUPS[d.si].name} and ${INVESTORS[d.ii].org}.`,
      status: "active",
    }).select("id").single();
    if (error) throw new Error(`deal_room: ${error.message}`);
    dealRoomIds.push(data.id);
  }

  // Deal Room Milestones
  const milestoneTemplates = [
    { title: "NDA Signed", status: "completed" },
    { title: "Financial Model Shared", status: "completed" },
    { title: "Due Diligence Kickoff", status: "pending" },
    { title: "Term Sheet Negotiation", status: "pending" },
    { title: "Legal Review", status: "pending" },
    { title: "Closing", status: "pending" },
  ];
  for (const drId of dealRoomIds) {
    for (const m of milestoneTemplates.slice(0, 4)) {
      await supabase.from("deal_room_milestones").insert({
        deal_room_id: drId,
        title: m.title,
        status: m.status,
        due_date: new Date(Date.now() + 14 * 86400000).toISOString(),
        completed_at: m.status === "completed" ? new Date().toISOString() : null,
      });
    }
  }

  // Deal Room Activities
  for (const drId of dealRoomIds) {
    await supabase.from("deal_room_activities").insert([
      { deal_room_id: drId, actor_id: adminId, activity_type: "room_created", description: "Deal room created by admin" },
      { deal_room_id: drId, actor_id: founderIds[0], activity_type: "document_shared", description: "Financial model shared" },
      { deal_room_id: drId, actor_id: investorIds[0], activity_type: "comment", description: "Reviewed Q3 financials, looks strong" },
    ]);
  }

  // Deal Room Notes
  for (const drId of dealRoomIds) {
    await supabase.from("deal_room_notes").insert({
      deal_room_id: drId,
      author_id: investorIds[0],
      content: "Strong unit economics. MRR growth trajectory is impressive. Want to dig deeper into CAC/LTV ratios and churn assumptions.",
    });
  }
  log(`✓ ${dealRoomIds.length} deal rooms with milestones, activities, notes`);

  // ── 14. Data Rooms ───────────────────────────────────────────────────────
  section("Creating data rooms");
  for (let i = 0; i < 3; i++) {
    const { data: dr, error } = await supabase.from("data_rooms").insert({
      startup_id: startupIds[i],
      name: `${STARTUPS[i].name} — Due Diligence Room`,
      description: "Confidential documents for investor due diligence",
      is_active: true,
    }).select("id").single();
    if (error) throw new Error(`data_room: ${error.message}`);

    // Documents
    const docs = [
      { name: "Pitch Deck v3.pdf", category: "legal", access: "investors" },
      { name: "Financial Model FY24.xlsx", category: "financial", access: "investors" },
      { name: "Cap Table.pdf", category: "cap_table", access: "specific_investors" },
      { name: "Terms of Service.pdf", category: "legal", access: "investors" },
    ];
    for (const doc of docs) {
      await supabase.from("data_room_documents").insert({
        data_room_id: dr.id,
        uploaded_by: founderIds[i],
        name: doc.name,
        file_url: `https://storage.example.com/data-room/${startupIds[i]}/${doc.name.replace(/ /g, "_")}`,
        file_type: doc.name.endsWith(".pdf") ? "application/pdf" : "application/vnd.openxmlformats",
        file_size: 1024000 + Math.floor(Math.random() * 5000000),
        category: doc.category,
        access_level: doc.access,
        allowed_investor_ids: doc.access === "specific_investors" ? [investorProfileIds[0]] : [],
      });
    }
  }
  log("✓ Data rooms with documents created");

  // ── 15. Conversations & Messages ─────────────────────────────────────────
  section("Creating conversations and messages");
  const convPairs = [
    { users: [founderIds[0], investorIds[0]], msgs: [
      { from: 0, body: "Hi Anand! I saw your fund's portfolio — very aligned with what we're building at FinEdge." },
      { from: 1, body: "Hi Arjun! Yes, fintech for the underserved is exactly our thesis. Tell me more about your go-to-market in tier-2 cities." },
      { from: 0, body: "We're currently live in 8 cities with 12,400 active users. WhatsApp is our primary acquisition channel — CAC under ₹200." },
      { from: 1, body: "Impressive. Can you share your latest MIS and financial model? Happy to set up a call this week." },
      { from: 0, body: "Absolutely! Sending over the data room access now. Available for a call Thursday 3pm IST?" },
    ]},
    { users: [founderIds[1], investorIds[1]], msgs: [
      { from: 0, body: "Hi Sunita! LearnSphere just hit 35,000 active students. Would love to share our AI pedagogy model with you." },
      { from: 1, body: "Congratulations on the traction! What's your D30 retention looking like?" },
      { from: 0, body: "D30 retention is 68% — significantly above industry average of 35-40%. Adaptive AI keeps students engaged." },
    ]},
    { users: [founderIds[2], investorIds[3]], msgs: [
      { from: 0, body: "Hi Meera! Reaching out because of your healthcare investment thesis. MediChain is building the ONDC of health records." },
      { from: 1, body: "Interesting positioning! Are you working with ABDM integration? That would be a huge moat." },
      { from: 0, body: "Yes, we're fully ABDM-compliant and currently integrating with 3 major hospital chains in Delhi NCR." },
    ]},
  ];

  for (const cp of convPairs) {
    const { data: conv, error } = await supabase.from("conversations").insert({
      participant_ids: cp.users,
      last_message: cp.msgs[cp.msgs.length - 1].body.slice(0, 100),
      last_message_at: new Date().toISOString(),
    }).select("id").single();
    if (error) throw new Error(`conversation: ${error.message}`);

    // Participants
    for (const uid of cp.users) {
      await supabase.from("conversation_participants").insert({
        conversation_id: conv.id,
        user_id: uid,
        unread_count: 0,
      });
    }

    // Messages
    for (let m = 0; m < cp.msgs.length; m++) {
      await supabase.from("messages").insert({
        conversation_id: conv.id,
        sender_id: cp.users[cp.msgs[m].from],
        content: cp.msgs[m].body,
        message_type: "text",
      });
    }
  }
  log("✓ Conversations and messages created");

  // ── 16. Events ───────────────────────────────────────────────────────────
  section("Creating events");
  const events = [
    {
      title: "StartupMinds Demo Day — Q1 2025",
      description: "Showcase your startup to 50+ top-tier VCs and angels. Selected startups get 8-minute pitch slots followed by investor Q&A. Top 3 startups win cash prizes and mentorship.",
      type: "demo_day",
      status: "published",
      start: new Date(Date.now() + 30 * 86400000).toISOString(),
      end: new Date(Date.now() + 30 * 86400000 + 8 * 3600000).toISOString(),
      location: "NSRCEL, IIM Bangalore",
      virtual: false,
      max: 200,
    },
    {
      title: "Investor-Founder Networking Night",
      description: "Monthly networking event bringing together 30+ investors and 100+ founders. Structured 1:1 sessions followed by open networking dinner.",
      type: "networking",
      status: "published",
      start: new Date(Date.now() + 14 * 86400000).toISOString(),
      end: new Date(Date.now() + 14 * 86400000 + 3 * 3600000).toISOString(),
      location: "WeWork Galaxy, Bangalore",
      virtual: false,
      max: 150,
    },
    {
      title: "AI for Startups: Building with Claude",
      description: "Hands-on workshop on integrating Claude AI into your startup's product. Live demos, code labs, and office hours with Anthropic engineers.",
      type: "workshop",
      status: "published",
      start: new Date(Date.now() + 7 * 86400000).toISOString(),
      end: new Date(Date.now() + 7 * 86400000 + 4 * 3600000).toISOString(),
      virtual_link: "https://zoom.us/j/startupminds-workshop",
      virtual: true,
      max: 500,
    },
  ];

  const eventIds = [];
  for (const e of events) {
    const { data, error } = await supabase.from("events").insert({
      organizer_id: adminId,
      title: e.title,
      description: e.description,
      event_type: e.type,
      status: e.status,
      start_date: e.start,
      end_date: e.end,
      location: e.location ?? null,
      is_virtual: e.virtual,
      virtual_link: e.virtual_link ?? null,
      max_participants: e.max,
      registration_deadline: new Date(Date.now() + (e.virtual ? 6 : 25) * 86400000).toISOString(),
    }).select("id").single();
    if (error) throw new Error(`event: ${error.message}`);
    eventIds.push(data.id);
  }

  // Event Registrations
  const registrants = [...founderIds.slice(0, 3), ...investorIds.slice(0, 3)];
  for (const uid of registrants) {
    for (const evId of eventIds.slice(0, 2)) {
      await supabase.from("event_registrations").upsert({
        event_id: evId,
        user_id: uid,
        registration_type: founderIds.includes(uid) ? "pitcher" : "attendee",
        status: "confirmed",
      }, { onConflict: "event_id,user_id", ignoreDuplicates: true });
    }
  }
  log(`✓ ${events.length} events with registrations created`);

  // ── 17. Likes, Bookmarks, Comments ───────────────────────────────────────
  section("Creating engagement data");
  for (let i = 0; i < startupIds.length; i++) {
    // Likes from investors
    for (let j = 0; j < investorIds.length; j++) {
      if ((i + j) % 2 === 0) {
        await supabase.from("likes").upsert({
          user_id: investorIds[j],
          entity_type: "startup",
          entity_id: startupIds[i],
        }, { onConflict: "user_id,entity_type,entity_id", ignoreDuplicates: true });
      }
    }
    // Bookmarks from investors
    for (let j = 0; j < 3; j++) {
      await supabase.from("bookmarks").upsert({
        user_id: investorIds[j % investorIds.length],
        startup_id: startupIds[i],
        collection_name: "Watchlist",
      }, { onConflict: "user_id,startup_id", ignoreDuplicates: true });
    }
    // Comments
    await supabase.from("comments").insert({
      user_id: investorIds[i % investorIds.length],
      entity_type: "startup",
      entity_id: startupIds[i],
      content: `Impressive work by the ${STARTUPS[i].name} team! The ${STARTUPS[i].industry} space needs exactly this kind of innovation. Following closely.`,
    });
  }
  log("✓ Likes, bookmarks, comments created");

  // ── 18. Connection Requests ───────────────────────────────────────────────
  section("Creating connection requests");
  const connPairs = [
    { from: investorIds[0], to: founderIds[0], status: "accepted" },
    { from: investorIds[1], to: founderIds[1], status: "accepted" },
    { from: investorIds[2], to: founderIds[2], status: "pending" },
    { from: investorIds[3], to: founderIds[0], status: "accepted" },
    { from: investorIds[4], to: founderIds[3], status: "accepted" },
  ];
  for (const c of connPairs) {
    await supabase.from("connection_requests").upsert({
      sender_id: c.from,
      receiver_id: c.to,
      status: c.status,
      message: "I've reviewed your pitch and am very interested in learning more about your vision and growth trajectory.",
    }, { onConflict: "sender_id,receiver_id", ignoreDuplicates: true });
  }
  log("✓ Connection requests created");

  // ── 19. Notifications ────────────────────────────────────────────────────
  section("Creating notifications");
  const notifData = [
    // Founders
    { uid: founderIds[0], type: "pitch_approved",   title: "Pitch Approved! 🎉",       body: "Your FinEdge pitch has been approved and is now visible to investors." },
    { uid: founderIds[0], type: "investor_interest", title: "Investor Interest",        body: "Anand Mehta from Sequoia Capital India has shown interest in FinEdge." },
    { uid: founderIds[0], type: "connection_accepted", title: "Connection Accepted",   body: "Anand Mehta accepted your connection request." },
    { uid: founderIds[1], type: "pitch_approved",   title: "Pitch Approved! 🎉",       body: "Your LearnSphere pitch has been approved." },
    { uid: founderIds[1], type: "review_feedback",  title: "Review Feedback Received", body: "A reviewer has submitted feedback on your pitch. Score: 8.2/10." },
    { uid: founderIds[2], type: "review_feedback",  title: "Changes Requested",        body: "Reviewer has requested changes to your MediChain pitch." },
    // Investors
    { uid: investorIds[0], type: "ai_recommendation", title: "New AI Match",           body: "FinEdge is a 92% match for your portfolio. Strong fintech traction in tier-2 India." },
    { uid: investorIds[0], type: "message",           title: "New Message",            body: "Arjun Sharma sent you a message about FinEdge." },
    { uid: investorIds[1], type: "ai_recommendation", title: "New AI Match",           body: "LearnSphere scores 88% match. Series A edtech with strong retention metrics." },
    // Reviewers
    { uid: reviewerIds[0], type: "pitch_submitted",  title: "New Pitch Assigned",      body: "MediChain pitch has been assigned to you for review." },
    { uid: reviewerIds[1], type: "pitch_submitted",  title: "New Pitch Assigned",      body: "AgriVision pitch is awaiting your review." },
    // Admin
    { uid: adminId,        type: "pitch_submitted",  title: "Pitch Submitted",         body: "New pitch submission from LogiFlow awaits admin review." },
  ];

  for (const n of notifData) {
    await supabase.from("notifications").insert({
      user_id: n.uid,
      type: n.type,
      title: n.title,
      body: n.body,
      is_read: false,
    });
  }
  log(`✓ ${notifData.length} notifications created`);

  // ── 20. Analytics Events ─────────────────────────────────────────────────
  section("Creating analytics events");
  const analyticsData = [];
  for (let i = 0; i < startupIds.length; i++) {
    // Startup views (by investors)
    for (let j = 0; j < 5 + i * 2; j++) {
      analyticsData.push({
        event_name: "startup_view",
        entity_type: "startup",
        entity_id: startupIds[i],
        user_id: investorIds[j % investorIds.length],
        properties: { source: ["discover", "leaderboard", "search"][j % 3], duration_seconds: 30 + j * 15 },
        session_id: `session_${i}_${j}`,
        created_at: new Date(Date.now() - (j + 1) * 3600000).toISOString(),
      });
    }
    // Pitch views
    for (let j = 0; j < 3 + i; j++) {
      analyticsData.push({
        event_name: "pitch_view",
        entity_type: "pitch",
        entity_id: pitchIds[i],
        user_id: investorIds[j % investorIds.length],
        properties: { section: ["overview", "financials", "team"][j % 3] },
        session_id: `session_pitch_${i}_${j}`,
        created_at: new Date(Date.now() - (j + 2) * 3600000).toISOString(),
      });
    }
  }
  // Page views
  for (let i = 0; i < 20; i++) {
    analyticsData.push({
      event_name: "page_view",
      entity_type: "page",
      entity_id: null,
      user_id: [...founderIds, ...investorIds][i % 10],
      properties: { path: ["/dashboard/founder", "/dashboard/investor/discover", "/dashboard/investor/crm"][i % 3] },
      session_id: `session_page_${i}`,
      created_at: new Date(Date.now() - i * 900000).toISOString(),
    });
  }
  for (const a of analyticsData) {
    await supabase.from("analytics_events").insert(a);
  }
  log(`✓ ${analyticsData.length} analytics events created`);

  // ── 21. Follows ──────────────────────────────────────────────────────────
  section("Creating follows");
  for (let i = 0; i < investorIds.length; i++) {
    await supabase.from("follows").upsert({
      follower_id: investorIds[i],
      following_id: founderIds[i % founderIds.length],
    }, { onConflict: "follower_id,following_id", ignoreDuplicates: true });
  }
  log("✓ Follows created");

  // ── 22. Badges ───────────────────────────────────────────────────────────
  section("Awarding badges");
  // Get badge IDs
  const { data: badges } = await supabase.from("badges").select("id, name").eq("is_active", true);
  if (badges && badges.length > 0) {
    const getBadge = (name) => badges.find(b => b.name === name)?.id;

    const badgeAwards = [
      { uid: founderIds[0], badge: "Verified Startup",    sid: startupIds[0] },
      { uid: founderIds[0], badge: "DPIIT Verified",      sid: startupIds[0] },
      { uid: founderIds[0], badge: "Featured Startup",    sid: startupIds[0] },
      { uid: founderIds[1], badge: "Verified Startup",    sid: startupIds[1] },
      { uid: founderIds[1], badge: "Top Rated",           sid: startupIds[1] },
      { uid: founderIds[3], badge: "DPIIT Verified",      sid: startupIds[3] },
      { uid: investorIds[0], badge: "Verified Investor",  sid: null },
      { uid: investorIds[0], badge: "Active Investor",    sid: null },
      { uid: investorIds[1], badge: "Verified Investor",  sid: null },
    ];

    for (const a of badgeAwards) {
      const badgeId = getBadge(a.badge);
      if (!badgeId) continue;
      await supabase.from("user_badges").upsert({
        user_id: a.uid,
        badge_id: badgeId,
        startup_id: a.sid,
        awarded_by: adminId,
      }, { onConflict: "user_id,badge_id", ignoreDuplicates: true });
    }
    log(`✓ Badges awarded to founders and investors`);
  } else {
    log("⚠ No badges found — run migrations first");
  }

  // ── 23. Reputation Scores ─────────────────────────────────────────────────
  section("Setting reputation scores");
  const repScores = [
    { uid: founderIds[0], total: 850, engagement: 200, verification: 150, responsiveness: 180, activity: 160, contribution: 160 },
    { uid: founderIds[1], total: 920, engagement: 220, verification: 180, responsiveness: 190, activity: 175, contribution: 155 },
    { uid: founderIds[2], total: 620, engagement: 140, verification: 100, responsiveness: 130, activity: 125, contribution: 125 },
    { uid: investorIds[0], total: 780, engagement: 170, verification: 200, responsiveness: 150, activity: 130, contribution: 130 },
    { uid: investorIds[1], total: 710, engagement: 160, verification: 180, responsiveness: 140, activity: 115, contribution: 115 },
  ];
  for (const r of repScores) {
    await supabase.from("reputation_scores").upsert({
      user_id: r.uid,
      total_score: r.total,
      engagement_score: r.engagement,
      verification_score: r.verification,
      responsiveness_score: r.responsiveness,
      activity_score: r.activity,
      contribution_score: r.contribution,
    }, { onConflict: "user_id", ignoreDuplicates: false });
  }
  log("✓ Reputation scores set");

  // ── 24. Reports ──────────────────────────────────────────────────────────
  section("Creating sample reports");
  await supabase.from("reports").insert({
    reporter_id: investorIds[2],
    entity_type: "startup",
    entity_id: startupIds[2],
    category: "misinformation",
    description: "Claim of '3 major hospital chains' partnership cannot be verified. Concerned this may be misleading.",
    status: "pending",
  });
  log("✓ Sample report created");

  // ── 25. Audit Logs ───────────────────────────────────────────────────────
  section("Creating audit log entries");
  const auditEntries = [
    { actor: adminId,    action: "pitch_status_changed", entity_type: "pitch",    eid: pitchIds[0], new_data: { status: "approved" } },
    { actor: adminId,    action: "pitch_status_changed", entity_type: "pitch",    eid: pitchIds[1], new_data: { status: "approved" } },
    { actor: adminId,    action: "investor_verified",    entity_type: "investor", eid: investorProfileIds[0], new_data: { is_verified: true } },
    { actor: superAdminId, action: "role_assigned",     entity_type: "user",     eid: reviewerIds[0], new_data: { role: "reviewer" } },
    { actor: superAdminId, action: "platform_setting_updated", entity_type: "platform_settings", eid: null, new_data: { key: "ai_analysis_enabled", value: true } },
  ];
  for (const a of auditEntries) {
    await supabase.from("audit_logs").insert({
      actor_id: a.actor,
      action: a.action,
      entity_type: a.entity_type,
      entity_id: a.eid,
      new_data: a.new_data,
    });
  }
  log(`✓ ${auditEntries.length} audit log entries created`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════");
  console.log("✅ Seeding complete!\n");
  console.log("Test Accounts (password: Password123! for all):");
  console.log("─────────────────────────────────────────");
  const allAccounts = [
    ...FOUNDERS.map((f, i) => `  Founder ${i+1}:    ${f.email}`),
    ...INVESTORS.map((inv, i) => `  Investor ${i+1}:   ${inv.email}`),
    ...REVIEWERS.map((r, i) => `  Reviewer ${i+1}:   ${r.email}`),
    `  Admin:         ${ADMIN.email}`,
    `  Super Admin:   ${SUPERADMIN.email}`,
  ];
  allAccounts.forEach(a => console.log(a));
  console.log("─────────────────────────────────────────");
  console.log(`\n  Startups:     ${startupIds.length}`);
  console.log(`  Pitches:      ${pitchIds.length}`);
  console.log(`  Deal Rooms:   ${dealRoomIds.length}`);
  console.log(`  Events:       ${eventIds.length}`);
  console.log(`  Messages:     ${convPairs.reduce((s, c) => s + c.msgs.length, 0)}`);
  console.log(`  Notifications:${notifData.length}`);
  console.log(`  Analytics:    ${analyticsData.length}`);
}

main().catch(err => {
  console.error("\n❌ Seed failed:", err.message);
  process.exit(1);
});

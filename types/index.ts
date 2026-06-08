export type UserRole = "founder" | "investor" | "reviewer" | "sub_admin" | "super_admin";

export type StartupStage =
  | "idea"
  | "pre_seed"
  | "seed"
  | "series_a"
  | "series_b"
  | "series_c"
  | "growth"
  | "ipo_ready";

export type PitchStatus =
  | "draft"
  | "submitted"
  | "assigned"
  | "under_review"
  | "changes_requested"
  | "resubmitted"
  | "approved"
  | "rejected"
  | "published"
  | "archived"
  | "closed";

export type KYCStatus = "pending" | "under_review" | "approved" | "rejected";

export type CRMStage =
  | "interested"
  | "contacted"
  | "meeting_scheduled"
  | "due_diligence"
  | "negotiation"
  | "invested"
  | "passed"
  | "closed";

export type NotificationType =
  | "pitch_submitted"
  | "review_feedback"
  | "pitch_approved"
  | "pitch_rejected"
  | "comment"
  | "like"
  | "bookmark"
  | "connection_request"
  | "connection_accepted"
  | "message"
  | "investor_interest"
  | "due_diligence_request"
  | "event_reminder"
  | "ai_recommendation"
  | "admin_announcement"
  | "pitch_status_changed";

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  is_verified: boolean;
  is_active: boolean;
  phone?: string;
  bio?: string;
  linkedin_url?: string;
  twitter_url?: string;
  website_url?: string;
  location?: string;
  timezone?: string;
  two_factor_enabled: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface Startup {
  id: string;
  founder_id: string;
  name: string;
  slogan?: string;
  logo_url?: string;
  website?: string;
  description: string;
  dpiit_number?: string;
  incorporation_date?: string;
  registered_address?: string;
  stage: StartupStage;
  industry: string;
  sub_industry?: string;
  country: string;
  city?: string;
  social_links: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
  };
  accelerator_name?: string;
  incubator_name?: string;
  supporting_organizations?: string[];
  is_dpiit_verified: boolean;
  is_featured: boolean;
  health_score?: number;
  reputation_score: number;
  total_views: number;
  total_likes: number;
  total_bookmarks: number;
  created_at: string;
  updated_at: string;
}

export interface StartupMember {
  id: string;
  startup_id: string;
  name: string;
  designation: string;
  email: string;
  phone?: string;
  linkedin_url?: string;
  background?: string;
  equity_percentage?: number;
  role_in_startup: string;
  avatar_url?: string;
  is_founder: boolean;
}

export interface Pitch {
  id: string;
  startup_id: string;
  version: number;
  status: PitchStatus;
  // Company Overview
  company_overview: string;
  problem_statement: string;
  pain_points: string[];
  real_world_examples: string;
  // Solution
  solution_description: string;
  technology_stack: string[];
  proprietary_innovations?: string;
  unique_value_proposition: string;
  competitive_advantages: string[];
  // Product
  product_features: string[];
  customer_segments: string[];
  // Market
  tam?: number;
  sam?: number;
  som?: number;
  market_trends?: string;
  // Business Model
  revenue_model: string;
  pricing_strategy?: string;
  scalability_plan?: string;
  // Traction
  monthly_revenue?: number;
  monthly_growth_rate?: number;
  total_customers?: number;
  mrr?: number;
  arr?: number;
  partnerships?: string[];
  awards?: string[];
  // Fundraising
  amount_raising: number;
  valuation_expectation?: number;
  equity_offered?: number;
  use_of_funds: Record<string, number>;
  milestones_achieved: string[];
  future_roadmap: string[];
  // Files
  pitch_deck_url?: string;
  product_screenshots: string[];
  supporting_docs: string[];
  demo_video_url?: string;
  // AI Analysis
  ai_quality_score?: number;
  ai_analysis?: AIAnalysis;
  // Metadata
  submitted_at?: string;
  reviewer_id?: string;
  admin_notes?: string;
  rejection_reason?: string;
  changes_requested?: string;
  created_at: string;
  updated_at: string;
}

export interface AIAnalysis {
  quality_score: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  risk_assessment: string;
  funding_readiness: number;
  market_opportunity_score: number;
  team_strength_score: number;
  business_viability_score: number;
  competitive_positioning: string;
  missing_information: string[];
  executive_summary: string;
  investment_insights: string[];
  overall_recommendation: "strong_buy" | "buy" | "hold" | "pass";
}

export interface StartupHealthScore {
  id: string;
  startup_id: string;
  overall_score: number;
  traction_score: number;
  growth_score: number;
  engagement_score: number;
  team_quality_score: number;
  fundraising_readiness_score: number;
  investor_activity_score: number;
  business_model_score: number;
  market_opportunity_score: number;
  score_breakdown: Record<string, number>;
  computed_at: string;
}

export interface Investor {
  id: string;
  user_id: string;
  organization?: string;
  organization_type?: string;
  website?: string;
  linkedin_url?: string;
  investment_thesis?: string;
  preferred_sectors: string[];
  preferred_stages: StartupStage[];
  min_ticket_size?: number;
  max_ticket_size?: number;
  preferred_geographies: string[];
  total_investments?: number;
  portfolio_count?: number;
  kyc_status: KYCStatus;
  is_verified: boolean;
  reputation_score: number;
  created_at: string;
  updated_at: string;
}

export interface KYCDocument {
  id: string;
  investor_id: string;
  document_type: string;
  document_url: string;
  status: KYCStatus;
  reviewer_id?: string;
  reviewer_notes?: string;
  reviewed_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface CRMRecord {
  id: string;
  investor_id: string;
  startup_id: string;
  stage: CRMStage;
  notes?: string;
  rating?: number;
  tags: string[];
  next_follow_up?: string;
  invested_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface ConnectionRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected";
  message?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "file" | "image";
  file_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface DealRoom {
  id: string;
  startup_id: string;
  investor_id: string;
  title: string;
  status: "active" | "completed" | "cancelled";
  milestones: DealMilestone[];
  created_at: string;
  updated_at: string;
}

export interface DealMilestone {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: "pending" | "completed" | "overdue";
  completed_at?: string;
}

export interface DataRoom {
  id: string;
  startup_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface DataRoomDocument {
  id: string;
  data_room_id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: string;
  access_level: "founders_only" | "investors" | "specific_investors";
  download_count: number;
  expires_at?: string;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  event_type: "demo_day" | "networking" | "workshop" | "webinar" | "pitch_competition";
  status: "draft" | "published" | "ongoing" | "completed" | "cancelled";
  start_date: string;
  end_date: string;
  location?: string;
  is_virtual: boolean;
  virtual_link?: string;
  max_participants?: number;
  registration_deadline?: string;
  banner_url?: string;
  organizer_id: string;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "startup" | "investor" | "founder";
  criteria: string;
  color: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface ReviewCriteria {
  problem_validation: number;
  solution_quality: number;
  team_strength: number;
  market_potential: number;
  competitive_advantage: number;
  scalability: number;
  business_model: number;
  traction: number;
  investment_readiness: number;
}

export interface PitchReview {
  id: string;
  pitch_id: string;
  reviewer_id: string;
  scores: ReviewCriteria;
  overall_score: number;
  feedback: string;
  recommendation: "approve" | "reject" | "request_changes";
  internal_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface PlatformSettings {
  id: string;
  key: string;
  value: unknown;
  description?: string;
  updated_by?: string;
  updated_at: string;
}

export interface StartupMatch {
  id: string;
  startup_id: string;
  investor_id: string;
  compatibility_score: number;
  match_reasons: string[];
  ai_explanation: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  entity_type: "startup" | "user" | "comment" | "message" | "content";
  entity_id: string;
  category: string;
  description: string;
  status: "pending" | "under_review" | "resolved" | "dismissed";
  moderator_id?: string;
  resolution?: string;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id?: string;
  event_name: string;
  entity_type?: string;
  entity_id?: string;
  properties: Record<string, unknown>;
  session_id?: string;
  ip_address?: string;
  created_at: string;
}

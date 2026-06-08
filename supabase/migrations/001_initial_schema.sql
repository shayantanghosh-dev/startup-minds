-- ============================================================
-- StartupMinds Complete Database Schema
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('founder', 'investor', 'reviewer', 'sub_admin', 'super_admin');
CREATE TYPE startup_stage AS ENUM ('idea', 'pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'growth', 'ipo_ready');
CREATE TYPE pitch_status AS ENUM ('draft', 'submitted', 'assigned', 'under_review', 'changes_requested', 'resubmitted', 'approved', 'rejected', 'published', 'archived', 'closed');
CREATE TYPE kyc_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');
CREATE TYPE crm_stage AS ENUM ('interested', 'contacted', 'meeting_scheduled', 'due_diligence', 'negotiation', 'invested', 'passed', 'closed');
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'rejected', 'blocked');
CREATE TYPE event_type AS ENUM ('demo_day', 'networking', 'workshop', 'webinar', 'pitch_competition');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'ongoing', 'completed', 'cancelled');
CREATE TYPE notification_type AS ENUM (
  'pitch_submitted', 'review_feedback', 'pitch_approved', 'pitch_rejected',
  'comment', 'like', 'bookmark', 'connection_request', 'connection_accepted',
  'message', 'investor_interest', 'due_diligence_request', 'event_reminder',
  'ai_recommendation', 'admin_announcement', 'pitch_status_changed'
);
CREATE TYPE report_category AS ENUM ('fraud', 'spam', 'misinformation', 'harassment', 'inappropriate_content', 'ip_violation', 'suspicious_investment');
CREATE TYPE badge_category AS ENUM ('startup', 'investor', 'founder');
CREATE TYPE document_category AS ENUM ('financial', 'legal', 'technical', 'compliance', 'ip', 'contracts', 'cap_table', 'other');
CREATE TYPE message_type AS ENUM ('text', 'file', 'image', 'system');

-- ============================================================
-- USERS & AUTH
-- ============================================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'founder',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  phone TEXT,
  bio TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  location TEXT,
  timezone TEXT DEFAULT 'UTC',
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_secret TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  location_info JSONB DEFAULT '{}',
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RBAC - Roles & Permissions
-- ============================================================

CREATE TABLE custom_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]',
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_role_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  custom_role_id UUID NOT NULL REFERENCES custom_roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, custom_role_id)
);

-- ============================================================
-- STARTUPS
-- ============================================================

CREATE TABLE startups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slogan TEXT,
  logo_url TEXT,
  website TEXT,
  description TEXT NOT NULL,
  dpiit_number TEXT UNIQUE,
  incorporation_date DATE,
  registered_address TEXT,
  stage startup_stage NOT NULL DEFAULT 'idea',
  industry TEXT NOT NULL,
  sub_industry TEXT,
  country TEXT NOT NULL DEFAULT 'India',
  city TEXT,
  social_links JSONB NOT NULL DEFAULT '{}',
  accelerator_name TEXT,
  incubator_name TEXT,
  supporting_organizations TEXT[] DEFAULT '{}',
  is_dpiit_verified BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  health_score INTEGER CHECK (health_score BETWEEN 0 AND 100),
  reputation_score INTEGER NOT NULL DEFAULT 0,
  total_views INTEGER NOT NULL DEFAULT 0,
  total_likes INTEGER NOT NULL DEFAULT 0,
  total_bookmarks INTEGER NOT NULL DEFAULT 0,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE startup_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  linkedin_url TEXT,
  background TEXT,
  equity_percentage DECIMAL(5,2) CHECK (equity_percentage BETWEEN 0 AND 100),
  role_in_startup TEXT NOT NULL,
  avatar_url TEXT,
  is_founder BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PITCHES
-- ============================================================

CREATE TABLE pitches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  status pitch_status NOT NULL DEFAULT 'draft',
  -- Company Overview
  company_overview TEXT,
  problem_statement TEXT,
  pain_points TEXT[] DEFAULT '{}',
  real_world_examples TEXT,
  -- Solution
  solution_description TEXT,
  technology_stack TEXT[] DEFAULT '{}',
  proprietary_innovations TEXT,
  unique_value_proposition TEXT,
  competitive_advantages TEXT[] DEFAULT '{}',
  -- Product
  product_features TEXT[] DEFAULT '{}',
  customer_segments TEXT[] DEFAULT '{}',
  -- Market
  tam BIGINT,
  sam BIGINT,
  som BIGINT,
  market_trends TEXT,
  -- Business Model
  revenue_model TEXT,
  pricing_strategy TEXT,
  scalability_plan TEXT,
  -- Traction
  monthly_revenue DECIMAL(15,2),
  monthly_growth_rate DECIMAL(5,2),
  total_customers INTEGER,
  mrr DECIMAL(15,2),
  arr DECIMAL(15,2),
  partnerships TEXT[] DEFAULT '{}',
  awards TEXT[] DEFAULT '{}',
  accelerator_participations TEXT[] DEFAULT '{}',
  -- Fundraising History
  funding_history JSONB DEFAULT '[]',
  -- Current Fundraise
  amount_raising BIGINT NOT NULL DEFAULT 0,
  valuation_expectation BIGINT,
  equity_offered DECIMAL(5,2),
  use_of_funds JSONB DEFAULT '{}',
  milestones_achieved TEXT[] DEFAULT '{}',
  future_roadmap TEXT[] DEFAULT '{}',
  -- Files
  pitch_deck_url TEXT,
  product_screenshots TEXT[] DEFAULT '{}',
  supporting_docs TEXT[] DEFAULT '{}',
  demo_video_url TEXT,
  demo_video_duration INTEGER,
  -- AI Analysis
  ai_quality_score INTEGER CHECK (ai_quality_score BETWEEN 0 AND 100),
  ai_analysis JSONB,
  -- Metadata
  submitted_at TIMESTAMPTZ,
  reviewer_id UUID REFERENCES users(id),
  admin_notes TEXT,
  rejection_reason TEXT,
  changes_requested TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pitch_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pitch_id UUID NOT NULL REFERENCES pitches(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  change_summary TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pitch_status_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pitch_id UUID NOT NULL REFERENCES pitches(id) ON DELETE CASCADE,
  from_status pitch_status,
  to_status pitch_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- REVIEWS
-- ============================================================

CREATE TABLE pitch_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pitch_id UUID NOT NULL REFERENCES pitches(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  problem_validation INTEGER CHECK (problem_validation BETWEEN 1 AND 10),
  solution_quality INTEGER CHECK (solution_quality BETWEEN 1 AND 10),
  team_strength INTEGER CHECK (team_strength BETWEEN 1 AND 10),
  market_potential INTEGER CHECK (market_potential BETWEEN 1 AND 10),
  competitive_advantage INTEGER CHECK (competitive_advantage BETWEEN 1 AND 10),
  scalability INTEGER CHECK (scalability BETWEEN 1 AND 10),
  business_model INTEGER CHECK (business_model BETWEEN 1 AND 10),
  traction INTEGER CHECK (traction BETWEEN 1 AND 10),
  investment_readiness INTEGER CHECK (investment_readiness BETWEEN 1 AND 10),
  overall_score DECIMAL(4,2),
  feedback TEXT NOT NULL,
  recommendation TEXT CHECK (recommendation IN ('approve', 'reject', 'request_changes')),
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pitch_id, reviewer_id)
);

-- ============================================================
-- INVESTORS & KYC
-- ============================================================

CREATE TABLE investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  organization TEXT,
  organization_type TEXT,
  website TEXT,
  linkedin_url TEXT,
  investment_thesis TEXT,
  preferred_sectors TEXT[] DEFAULT '{}',
  preferred_stages startup_stage[] DEFAULT '{}',
  min_ticket_size BIGINT,
  max_ticket_size BIGINT,
  preferred_geographies TEXT[] DEFAULT '{}',
  total_investments INTEGER DEFAULT 0,
  portfolio_count INTEGER DEFAULT 0,
  kyc_status kyc_status NOT NULL DEFAULT 'pending',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  reputation_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE kyc_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  encrypted_url TEXT,
  status kyc_status NOT NULL DEFAULT 'pending',
  reviewer_id UUID REFERENCES users(id),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- AI MATCHING & HEALTH SCORES
-- ============================================================

CREATE TABLE startup_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  compatibility_score INTEGER CHECK (compatibility_score BETWEEN 0 AND 100),
  match_reasons TEXT[] DEFAULT '{}',
  ai_explanation TEXT,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(startup_id, investor_id)
);

CREATE TABLE startup_health_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  traction_score INTEGER CHECK (traction_score BETWEEN 0 AND 100),
  growth_score INTEGER CHECK (growth_score BETWEEN 0 AND 100),
  engagement_score INTEGER CHECK (engagement_score BETWEEN 0 AND 100),
  team_quality_score INTEGER CHECK (team_quality_score BETWEEN 0 AND 100),
  fundraising_readiness_score INTEGER CHECK (fundraising_readiness_score BETWEEN 0 AND 100),
  investor_activity_score INTEGER CHECK (investor_activity_score BETWEEN 0 AND 100),
  business_model_score INTEGER CHECK (business_model_score BETWEEN 0 AND 100),
  market_opportunity_score INTEGER CHECK (market_opportunity_score BETWEEN 0 AND 100),
  score_breakdown JSONB DEFAULT '{}',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(startup_id)
);

-- ============================================================
-- CRM
-- ============================================================

CREATE TABLE crm_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  stage crm_stage NOT NULL DEFAULT 'interested',
  notes TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  tags TEXT[] DEFAULT '{}',
  next_follow_up TIMESTAMPTZ,
  invested_amount BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(investor_id, startup_id)
);

CREATE TABLE crm_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crm_record_id UUID NOT NULL REFERENCES crm_records(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- CONNECTIONS & MESSAGING
-- ============================================================

CREATE TABLE connection_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status connection_status NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id),
  CHECK (sender_id != receiver_id)
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_ids UUID[] NOT NULL,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unread_count INTEGER NOT NULL DEFAULT 0,
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type message_type NOT NULL DEFAULT 'text',
  file_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- DEAL ROOMS
-- ============================================================

CREATE TABLE deal_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE deal_room_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_room_id UUID NOT NULL REFERENCES deal_rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE deal_room_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_room_id UUID NOT NULL REFERENCES deal_rooms(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id),
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- DATA ROOMS (Due Diligence)
-- ============================================================

CREATE TABLE data_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE data_room_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data_room_id UUID NOT NULL REFERENCES data_rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  category document_category NOT NULL DEFAULT 'other',
  access_level TEXT NOT NULL DEFAULT 'investors' CHECK (access_level IN ('founders_only', 'investors', 'specific_investors')),
  allowed_investor_ids UUID[] DEFAULT '{}',
  download_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE data_room_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES data_room_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL CHECK (action IN ('view', 'download')),
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- EVENTS
-- ============================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_type event_type NOT NULL,
  status event_status NOT NULL DEFAULT 'draft',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  is_virtual BOOLEAN NOT NULL DEFAULT false,
  virtual_link TEXT,
  max_participants INTEGER,
  registration_deadline TIMESTAMPTZ,
  banner_url TEXT,
  organizer_id UUID NOT NULL REFERENCES users(id),
  agenda JSONB DEFAULT '[]',
  speakers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  startup_id UUID REFERENCES startups(id),
  registration_type TEXT NOT NULL DEFAULT 'attendee' CHECK (registration_type IN ('attendee', 'pitcher', 'speaker', 'sponsor')),
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'attended', 'cancelled')),
  application_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- ============================================================
-- SOCIAL ENGAGEMENT
-- ============================================================

CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('startup', 'pitch', 'comment')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, entity_type, entity_id)
);

CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  collection_name TEXT DEFAULT 'Default',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, startup_id)
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('startup', 'pitch', 'event')),
  entity_id UUID NOT NULL,
  parent_id UUID REFERENCES comments(id),
  content TEXT NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ============================================================
-- BADGES & REPUTATION
-- ============================================================

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category badge_category NOT NULL,
  criteria TEXT,
  color TEXT NOT NULL DEFAULT '#6366f1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  startup_id UUID REFERENCES startups(id),
  awarded_by UUID REFERENCES users(id),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE TABLE reputation_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL DEFAULT 0,
  engagement_score INTEGER NOT NULL DEFAULT 0,
  verification_score INTEGER NOT NULL DEFAULT 0,
  responsiveness_score INTEGER NOT NULL DEFAULT 0,
  activity_score INTEGER NOT NULL DEFAULT 0,
  contribution_score INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  in_app_notifications BOOLEAN NOT NULL DEFAULT true,
  notification_types JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- REPORTS & MODERATION
-- ============================================================

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('startup', 'user', 'comment', 'message', 'content')),
  entity_id UUID NOT NULL,
  category report_category NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  moderator_id UUID REFERENCES users(id),
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE moderation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  moderator_id UUID NOT NULL REFERENCES users(id),
  target_user_id UUID REFERENCES users(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('warning', 'strike', 'suspension', 'ban', 'content_removal', 'reinstatement')),
  reason TEXT NOT NULL,
  duration_days INTEGER,
  expires_at TIMESTAMPTZ,
  related_report_id UUID REFERENCES reports(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ANALYTICS
-- ============================================================

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  event_name TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  properties JSONB DEFAULT '{}',
  session_id TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PLATFORM SETTINGS
-- ============================================================

CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Users
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Startups
CREATE INDEX idx_startups_founder_id ON startups(founder_id);
CREATE INDEX idx_startups_stage ON startups(stage);
CREATE INDEX idx_startups_industry ON startups(industry);
CREATE INDEX idx_startups_country ON startups(country);
CREATE INDEX idx_startups_is_featured ON startups(is_featured);
CREATE INDEX idx_startups_health_score ON startups(health_score DESC);
CREATE INDEX idx_startups_search_vector ON startups USING GIN(search_vector);

-- Pitches
CREATE INDEX idx_pitches_startup_id ON pitches(startup_id);
CREATE INDEX idx_pitches_status ON pitches(status);
CREATE INDEX idx_pitches_reviewer_id ON pitches(reviewer_id);
CREATE INDEX idx_pitches_submitted_at ON pitches(submitted_at DESC);

-- Investors
CREATE INDEX idx_investors_user_id ON investors(user_id);
CREATE INDEX idx_investors_kyc_status ON investors(kyc_status);
CREATE INDEX idx_investors_is_verified ON investors(is_verified);

-- Messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Analytics
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);

-- Audit logs
CREATE INDEX idx_audit_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- FULL TEXT SEARCH
-- ============================================================

CREATE OR REPLACE FUNCTION update_startup_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.slogan, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.industry, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.country, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER startup_search_vector_update
  BEFORE INSERT OR UPDATE ON startups
  FOR EACH ROW EXECUTE FUNCTION update_startup_search_vector();

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER startups_updated_at BEFORE UPDATE ON startups FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER pitches_updated_at BEFORE UPDATE ON pitches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER investors_updated_at BEFORE UPDATE ON investors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER crm_records_updated_at BEFORE UPDATE ON crm_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER deal_rooms_updated_at BEFORE UPDATE ON deal_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER data_rooms_updated_at BEFORE UPDATE ON data_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER pitch_reviews_updated_at BEFORE UPDATE ON pitch_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER connection_requests_updated_at BEFORE UPDATE ON connection_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

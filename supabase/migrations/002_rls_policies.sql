-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE startup_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE startup_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE startup_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_room_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_room_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_room_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_room_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role(uid UUID)
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT role IN ('sub_admin', 'super_admin') FROM users WHERE id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT role = 'super_admin' FROM users WHERE id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if investor is verified
CREATE OR REPLACE FUNCTION is_verified_investor(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM investors
    WHERE user_id = uid AND is_verified = true AND kyc_status = 'approved'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- USERS POLICIES
-- ============================================================

CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_select_public" ON users
  FOR SELECT USING (is_active = true);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_admin_all" ON users
  FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- STARTUPS POLICIES
-- ============================================================

CREATE POLICY "startups_select_published" ON startups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pitches
      WHERE startup_id = startups.id
      AND status IN ('published', 'approved')
    )
    OR founder_id = auth.uid()
    OR is_admin(auth.uid())
  );

CREATE POLICY "startups_insert_founder" ON startups
  FOR INSERT WITH CHECK (
    auth.uid() = founder_id
    AND get_user_role(auth.uid()) = 'founder'
  );

CREATE POLICY "startups_update_own" ON startups
  FOR UPDATE USING (auth.uid() = founder_id OR is_admin(auth.uid()));

CREATE POLICY "startups_delete_admin" ON startups
  FOR DELETE USING (is_admin(auth.uid()));

-- ============================================================
-- PITCHES POLICIES
-- ============================================================

CREATE POLICY "pitches_select_own_startup" ON pitches
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM startups WHERE id = startup_id AND founder_id = auth.uid())
    OR (status = 'published' AND is_verified_investor(auth.uid()))
    OR is_admin(auth.uid())
    OR reviewer_id = auth.uid()
  );

CREATE POLICY "pitches_insert_founder" ON pitches
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM startups WHERE id = startup_id AND founder_id = auth.uid())
  );

CREATE POLICY "pitches_update_founder_or_admin" ON pitches
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM startups WHERE id = startup_id AND founder_id = auth.uid())
    OR is_admin(auth.uid())
    OR reviewer_id = auth.uid()
  );

-- ============================================================
-- INVESTORS POLICIES
-- ============================================================

CREATE POLICY "investors_select_verified" ON investors
  FOR SELECT USING (
    user_id = auth.uid()
    OR is_verified = true
    OR is_admin(auth.uid())
  );

CREATE POLICY "investors_insert_own" ON investors
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND get_user_role(auth.uid()) = 'investor'
  );

CREATE POLICY "investors_update_own_or_admin" ON investors
  FOR UPDATE USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- ============================================================
-- KYC POLICIES
-- ============================================================

CREATE POLICY "kyc_select_own_or_admin" ON kyc_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM investors WHERE id = investor_id AND user_id = auth.uid())
    OR is_admin(auth.uid())
  );

CREATE POLICY "kyc_insert_own" ON kyc_documents
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM investors WHERE id = investor_id AND user_id = auth.uid())
  );

CREATE POLICY "kyc_update_admin" ON kyc_documents
  FOR UPDATE USING (is_admin(auth.uid()));

-- ============================================================
-- CRM POLICIES
-- ============================================================

CREATE POLICY "crm_own_investor" ON crm_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM investors WHERE id = investor_id AND user_id = auth.uid())
  );

CREATE POLICY "crm_admin" ON crm_records
  FOR SELECT USING (is_admin(auth.uid()));

-- ============================================================
-- MESSAGES & CONVERSATIONS POLICIES
-- ============================================================

CREATE POLICY "conversations_participants" ON conversations
  FOR SELECT USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "messages_participants" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND auth.uid() = ANY(participant_ids)
    )
  );

CREATE POLICY "messages_insert_participant" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND auth.uid() = ANY(participant_ids)
    )
  );

-- ============================================================
-- DEAL ROOMS POLICIES
-- ============================================================

CREATE POLICY "deal_rooms_participants" ON deal_rooms
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM startups WHERE id = startup_id AND founder_id = auth.uid())
    OR EXISTS (SELECT 1 FROM investors WHERE id = investor_id AND user_id = auth.uid())
    OR is_admin(auth.uid())
  );

-- ============================================================
-- DATA ROOMS POLICIES
-- ============================================================

CREATE POLICY "data_rooms_founder" ON data_rooms
  FOR ALL USING (
    EXISTS (SELECT 1 FROM startups WHERE id = startup_id AND founder_id = auth.uid())
    OR is_admin(auth.uid())
  );

CREATE POLICY "data_room_docs_access" ON data_room_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM data_rooms dr
      JOIN startups s ON s.id = dr.startup_id
      WHERE dr.id = data_room_id
      AND (
        s.founder_id = auth.uid()
        OR (access_level = 'investors' AND is_verified_investor(auth.uid()))
        OR (access_level = 'specific_investors' AND auth.uid() = ANY(allowed_investor_ids))
        OR is_admin(auth.uid())
      )
    )
  );

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================

CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- COMMENTS POLICIES
-- ============================================================

CREATE POLICY "comments_select_all" ON comments
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "comments_insert_auth" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_update_own" ON comments
  FOR UPDATE USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- ============================================================
-- LIKES & BOOKMARKS POLICIES
-- ============================================================

CREATE POLICY "likes_own" ON likes
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "bookmarks_own" ON bookmarks
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- REVIEWS POLICIES
-- ============================================================

CREATE POLICY "reviews_reviewer_own" ON pitch_reviews
  FOR ALL USING (
    reviewer_id = auth.uid()
    OR is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM pitches p
      JOIN startups s ON s.id = p.startup_id
      WHERE p.id = pitch_id AND s.founder_id = auth.uid()
    )
  );

-- ============================================================
-- EVENTS POLICIES
-- ============================================================

CREATE POLICY "events_select_published" ON events
  FOR SELECT USING (
    status IN ('published', 'ongoing', 'completed')
    OR organizer_id = auth.uid()
    OR is_admin(auth.uid())
  );

CREATE POLICY "events_insert_admin" ON events
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "events_update_admin" ON events
  FOR UPDATE USING (is_admin(auth.uid()) OR organizer_id = auth.uid());

-- ============================================================
-- BADGES POLICIES
-- ============================================================

CREATE POLICY "badges_select_all" ON badges
  FOR SELECT USING (is_active = true);

CREATE POLICY "user_badges_select_all" ON user_badges
  FOR SELECT USING (true);

CREATE POLICY "user_badges_admin" ON user_badges
  FOR INSERT USING (is_admin(auth.uid()));

-- ============================================================
-- AUDIT LOGS POLICIES
-- ============================================================

CREATE POLICY "audit_logs_admin" ON audit_logs
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- PLATFORM SETTINGS POLICIES
-- ============================================================

CREATE POLICY "platform_settings_public" ON platform_settings
  FOR SELECT USING (is_public = true OR is_admin(auth.uid()));

CREATE POLICY "platform_settings_admin" ON platform_settings
  FOR ALL USING (is_super_admin(auth.uid()));

-- ============================================================
-- ANALYTICS POLICIES
-- ============================================================

CREATE POLICY "analytics_insert" ON analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "analytics_admin" ON analytics_events
  FOR SELECT USING (is_admin(auth.uid()));

-- ============================================================
-- REPORTS POLICIES
-- ============================================================

CREATE POLICY "reports_own_or_admin" ON reports
  FOR SELECT USING (reporter_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "reports_insert_auth" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports_update_admin" ON reports
  FOR UPDATE USING (is_admin(auth.uid()));

-- ============================================================
-- CONNECTION REQUESTS POLICIES
-- ============================================================

CREATE POLICY "connections_own" ON connection_requests
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "connections_insert_auth" ON connection_requests
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "connections_update_receiver" ON connection_requests
  FOR UPDATE USING (receiver_id = auth.uid() OR sender_id = auth.uid());

-- ============================================================
-- STARTUP HEALTH SCORES POLICIES
-- ============================================================

CREATE POLICY "health_scores_select" ON startup_health_scores
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM startups WHERE id = startup_id AND founder_id = auth.uid())
    OR is_verified_investor(auth.uid())
    OR is_admin(auth.uid())
  );

-- ============================================================
-- SEED DEFAULT BADGES
-- ============================================================

INSERT INTO badges (name, description, icon, category, criteria, color) VALUES
  ('Verified Startup', 'DPIIT verified startup', 'shield-check', 'startup', 'DPIIT number verified by admin', '#10b981'),
  ('DPIIT Verified', 'Department for Promotion of Industry and Internal Trade verified', 'award', 'startup', 'Valid DPIIT registration', '#6366f1'),
  ('Fast Growing', 'Top 10% growth rate on platform', 'trending-up', 'startup', 'Monthly growth rate > 20%', '#f59e0b'),
  ('Top Rated', 'Consistently high review scores', 'star', 'startup', 'Average review score > 8.5', '#f97316'),
  ('Featured Startup', 'Curated and featured by StartupMinds team', 'sparkles', 'startup', 'Manually awarded by admin', '#ec4899'),
  ('Investor Favorite', 'Bookmarked by 10+ verified investors', 'heart', 'startup', 'Bookmarked by 10+ verified investors', '#ef4444'),
  ('Verified Investor', 'KYC verified investor', 'badge-check', 'investor', 'KYC approved', '#10b981'),
  ('Active Investor', 'Made 3+ investments through platform', 'activity', 'investor', '3+ investments recorded', '#6366f1'),
  ('Lead Investor', 'Led a funding round', 'crown', 'investor', 'Led at least 1 funding round', '#f59e0b'),
  ('Ecosystem Contributor', 'Active mentor and community contributor', 'users', 'investor', 'Contributed to 5+ events or mentoring', '#8b5cf6');

-- ============================================================
-- SEED DEFAULT PLATFORM SETTINGS
-- ============================================================

INSERT INTO platform_settings (key, value, description, is_public) VALUES
  ('platform_name', '"StartupMinds"', 'Platform name', true),
  ('platform_tagline', '"Where Startups Meet Their Future"', 'Platform tagline', true),
  ('max_pitch_deck_size_mb', '50', 'Maximum pitch deck file size in MB', true),
  ('max_document_size_mb', '100', 'Maximum document size in MB', true),
  ('kyc_required_for_investors', 'true', 'Whether KYC is required for investors', true),
  ('auto_assign_reviewers', 'true', 'Automatically assign reviewers to pitches', false),
  ('ai_analysis_enabled', 'true', 'Enable AI analysis for pitch submissions', false),
  ('matchmaking_enabled', 'true', 'Enable AI matchmaking', false),
  ('demo_day_enabled', 'true', 'Enable demo day events', true),
  ('max_startup_members', '20', 'Maximum team members per startup', true);

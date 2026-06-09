-- ============================================================
-- StartupMinds — Supplemental Seed SQL
-- ============================================================
-- This file seeds non-auth platform data for local Supabase dev.
-- For production/hosted seeding use: npm run seed
--
-- Usage (local Supabase):
--   supabase db reset   (applies migrations + this seed)
--
-- Note: Auth users must be created via the Node seed script or
--       the Supabase dashboard; this file seeds everything else.
-- ============================================================

-- Platform Settings (idempotent)
INSERT INTO public.platform_settings (key, value, description, is_public)
VALUES
  ('platform_name',              '"StartupMinds"',               'Platform display name',                   true),
  ('platform_tagline',           '"Where India''s Startups Meet Smart Capital"', 'Hero tagline',             true),
  ('max_pitch_deck_size_mb',     '50',                            'Maximum pitch deck upload size in MB',    false),
  ('max_document_size_mb',       '100',                           'Maximum data room document size in MB',   false),
  ('kyc_required_for_investors', 'true',                          'Require KYC before investors can contact',false),
  ('auto_assign_reviewers',      'true',                          'Auto-assign pitches to available reviewers',false),
  ('ai_analysis_enabled',        'true',                          'Enable AI pitch analysis feature',        false),
  ('matchmaking_enabled',        'true',                          'Enable AI-powered matchmaking',           false),
  ('demo_day_enabled',           'true',                          'Enable Demo Day events',                  false),
  ('max_startup_members',        '10',                            'Maximum team members per startup',        false)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Default Badges (idempotent)
INSERT INTO public.badges (name, description, icon, category, criteria, color, is_active)
VALUES
  ('Verified Startup',      'Startup has been verified by the platform',          '✅', 'startup',  'Admin verification',           '#22c55e', true),
  ('DPIIT Verified',        'DPIIT Startup India registration verified',          '🇮🇳', 'startup',  'DPIIT number validated',        '#3b82f6', true),
  ('Fast Growing',          'Month-over-month growth rate above 20%',             '🚀', 'startup',  'MoM growth >= 20%',             '#f59e0b', true),
  ('Top Rated',             'Average review score above 8.0/10',                  '⭐', 'startup',  'Review score >= 8.0',           '#eab308', true),
  ('Featured Startup',      'Curated as a featured startup by the platform',      '🏆', 'startup',  'Admin featured flag',           '#8b5cf6', true),
  ('Investor Favorite',     'Bookmarked by 10+ verified investors',               '❤️', 'startup',  'Bookmarks from investors >= 10','#ec4899', true),
  ('Verified Investor',     'Investor has completed KYC verification',            '🛡️', 'investor', 'KYC approved',                  '#22c55e', true),
  ('Active Investor',       'Made 5+ investments on the platform',                '💼', 'investor', 'Total investments >= 5',        '#3b82f6', true),
  ('Lead Investor',         'Has led 3+ funding rounds',                          '👑', 'investor', 'Lead deals >= 3',               '#f59e0b', true),
  ('Ecosystem Contributor', 'Active mentor or event speaker',                     '🌱', 'founder',  'Mentoring or speaking activity','#14b8a6', true)
ON CONFLICT (name) DO NOTHING;

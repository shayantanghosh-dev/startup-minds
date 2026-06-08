-- ============================================================
-- Auth Trigger: Create user profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    avatar_url,
    role,
    email_verified,
    is_active,
    is_verified
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'founder'::user_role
    ),
    NEW.email_confirmed_at IS NOT NULL,
    true,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified,
    updated_at = now();

  -- Create notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create reputation score
  INSERT INTO public.reputation_scores (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Log first login
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id)
  VALUES (NEW.id, 'user_registered', 'user', NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- Function: Track login
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET last_login_at = now(), login_attempts = 0
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Function: Get founder stats (used in dashboard)
-- ============================================================

CREATE OR REPLACE FUNCTION get_founder_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_startup_id UUID;
  v_stats JSONB;
BEGIN
  SELECT id INTO v_startup_id FROM startups WHERE founder_id = p_user_id LIMIT 1;

  IF v_startup_id IS NULL THEN
    RETURN '{}'::JSONB;
  END IF;

  SELECT jsonb_build_object(
    'total_views', s.total_views,
    'total_likes', s.total_likes,
    'total_bookmarks', s.total_bookmarks,
    'investor_connections', (
      SELECT COUNT(*) FROM connection_requests cr
      JOIN users u ON u.id = cr.sender_id
      WHERE cr.receiver_id = p_user_id
      AND u.role = 'investor'
      AND cr.status = 'accepted'
    ),
    'pitch_views', (
      SELECT COUNT(*) FROM analytics_events
      WHERE entity_type = 'pitch'
      AND entity_id IN (SELECT id FROM pitches WHERE startup_id = v_startup_id)
      AND event_name = 'pitch_viewed'
    )
  )
  INTO v_stats
  FROM startups s
  WHERE s.id = v_startup_id;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Function: Startup leaderboard
-- ============================================================

CREATE OR REPLACE FUNCTION get_startup_leaderboard(
  p_limit INT DEFAULT 20,
  p_sector TEXT DEFAULT NULL,
  p_stage TEXT DEFAULT NULL
)
RETURNS TABLE (
  startup_id UUID,
  startup_name TEXT,
  stage TEXT,
  industry TEXT,
  health_score INT,
  ai_quality_score INT,
  total_views INT,
  total_likes INT,
  total_bookmarks INT,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.stage::TEXT,
    s.industry,
    s.health_score,
    p.ai_quality_score,
    s.total_views,
    s.total_likes,
    s.total_bookmarks,
    ROW_NUMBER() OVER (
      ORDER BY
        COALESCE(s.health_score, 0) DESC,
        COALESCE(p.ai_quality_score, 0) DESC,
        s.total_likes DESC
    ) as rank
  FROM startups s
  LEFT JOIN pitches p ON p.startup_id = s.id AND p.status = 'published'
  WHERE
    p.status = 'published'
    AND (p_sector IS NULL OR s.industry = p_sector)
    AND (p_stage IS NULL OR s.stage::TEXT = p_stage)
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Realtime: Enable for messaging and notifications
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE deal_room_activities;

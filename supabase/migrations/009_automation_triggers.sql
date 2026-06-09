-- ============================================================
-- Migration 009: Automation Triggers
-- Health score recalculation, reputation score updates,
-- event reminder notifications, connection notifications
-- ============================================================

-- ── 1. Health Score: Recompute on startup field changes ─────────────────────

CREATE OR REPLACE FUNCTION public.recompute_health_score_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_traction    NUMERIC := 0;
  v_growth      NUMERIC := 0;
  v_engagement  NUMERIC := 0;
  v_team        NUMERIC := 0;
  v_fundraising NUMERIC := 0;
  v_investor    NUMERIC := 0;
  v_bizmodel    NUMERIC := 0;
  v_market      NUMERIC := 0;
  v_overall     NUMERIC := 0;
  v_pitch       RECORD;
BEGIN
  -- Only run when relevant fields change
  IF NOT (
    NEW.health_score IS DISTINCT FROM OLD.health_score OR
    NEW.total_views   IS DISTINCT FROM OLD.total_views  OR
    NEW.total_likes   IS DISTINCT FROM OLD.total_likes  OR
    NEW.total_bookmarks IS DISTINCT FROM OLD.total_bookmarks
  ) THEN
    RETURN NEW;
  END IF;

  -- Pull best pitch traction data
  SELECT p.monthly_revenue, p.monthly_growth_rate, p.total_customers,
         p.mrr, p.arr, p.ai_quality_score
  INTO v_pitch
  FROM public.pitches p
  WHERE p.startup_id = NEW.id
  ORDER BY p.version DESC
  LIMIT 1;

  -- Traction score (0-100) based on MRR buckets
  IF v_pitch.mrr IS NOT NULL THEN
    v_traction := LEAST(100, GREATEST(0,
      CASE
        WHEN v_pitch.mrr >= 10000000 THEN 100
        WHEN v_pitch.mrr >= 5000000  THEN 85
        WHEN v_pitch.mrr >= 1000000  THEN 70
        WHEN v_pitch.mrr >= 500000   THEN 55
        WHEN v_pitch.mrr >= 100000   THEN 40
        ELSE 20
      END
    ));
  END IF;

  -- Growth score based on monthly growth rate
  IF v_pitch.monthly_growth_rate IS NOT NULL THEN
    v_growth := LEAST(100, GREATEST(0, v_pitch.monthly_growth_rate * 3));
  END IF;

  -- Engagement score from views/likes/bookmarks
  v_engagement := LEAST(100, GREATEST(0,
    (COALESCE(NEW.total_views, 0) / 10.0) +
    (COALESCE(NEW.total_likes, 0) * 2.0) +
    (COALESCE(NEW.total_bookmarks, 0) * 3.0)
  ));

  -- Team quality: fixed at 70 (updated separately when members added)
  SELECT COALESCE(
    (SELECT sh.team_quality_score FROM public.startup_health_scores sh WHERE sh.startup_id = NEW.id),
    70
  ) INTO v_team;

  -- Fundraising readiness from pitch AI score
  IF v_pitch.ai_quality_score IS NOT NULL THEN
    v_fundraising := v_pitch.ai_quality_score;
  ELSE
    v_fundraising := 50;
  END IF;

  -- Investor activity: CRM records count × 10, capped at 100
  SELECT LEAST(100, COUNT(*) * 10)
  INTO v_investor
  FROM public.crm_records cr
  WHERE cr.startup_id = NEW.id;

  -- Business model: from AI score or default
  v_bizmodel := COALESCE(v_pitch.ai_quality_score, 55);

  -- Market opportunity: fixed reasonable default
  v_market := 72;

  -- Overall weighted score
  v_overall := ROUND(
    (v_traction * 0.20) +
    (v_growth   * 0.15) +
    (v_engagement * 0.10) +
    (v_team     * 0.15) +
    (v_fundraising * 0.15) +
    (v_investor * 0.10) +
    (v_bizmodel * 0.10) +
    (v_market   * 0.05)
  );

  -- Upsert health score record
  INSERT INTO public.startup_health_scores (
    startup_id, overall_score, traction_score, growth_score, engagement_score,
    team_quality_score, fundraising_readiness_score, investor_activity_score,
    business_model_score, market_opportunity_score, computed_at
  ) VALUES (
    NEW.id, v_overall, v_traction, v_growth, v_engagement,
    v_team, v_fundraising, v_investor, v_bizmodel, v_market,
    now()
  )
  ON CONFLICT (startup_id) DO UPDATE SET
    overall_score               = EXCLUDED.overall_score,
    traction_score              = EXCLUDED.traction_score,
    growth_score                = EXCLUDED.growth_score,
    engagement_score            = EXCLUDED.engagement_score,
    fundraising_readiness_score = EXCLUDED.fundraising_readiness_score,
    investor_activity_score     = EXCLUDED.investor_activity_score,
    business_model_score        = EXCLUDED.business_model_score,
    market_opportunity_score    = EXCLUDED.market_opportunity_score,
    computed_at                 = EXCLUDED.computed_at;

  -- Keep startup.health_score column in sync
  NEW.health_score := v_overall;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_startup_health_score ON public.startups;
CREATE TRIGGER trg_startup_health_score
  BEFORE UPDATE ON public.startups
  FOR EACH ROW
  EXECUTE FUNCTION public.recompute_health_score_on_update();


-- ── 2. Reputation Score: Update on engagement events ────────────────────────

CREATE OR REPLACE FUNCTION public.update_reputation_on_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user UUID;
  v_delta       INT;
BEGIN
  -- Find the owner of the liked entity
  IF TG_OP = 'INSERT' THEN
    v_delta := 5;
    IF NEW.entity_type = 'startup' THEN
      SELECT founder_id INTO v_target_user FROM public.startups WHERE id = NEW.entity_id;
    ELSIF NEW.entity_type = 'pitch' THEN
      SELECT s.founder_id INTO v_target_user
      FROM public.pitches p JOIN public.startups s ON s.id = p.startup_id
      WHERE p.id = NEW.entity_id;
    END IF;
  ELSE -- DELETE
    v_delta := -5;
    IF OLD.entity_type = 'startup' THEN
      SELECT founder_id INTO v_target_user FROM public.startups WHERE id = OLD.entity_id;
    ELSIF OLD.entity_type = 'pitch' THEN
      SELECT s.founder_id INTO v_target_user
      FROM public.pitches p JOIN public.startups s ON s.id = p.startup_id
      WHERE p.id = OLD.entity_id;
    END IF;
  END IF;

  IF v_target_user IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  INSERT INTO public.reputation_scores (user_id, total_score, engagement_score)
  VALUES (v_target_user, GREATEST(0, v_delta), GREATEST(0, v_delta))
  ON CONFLICT (user_id) DO UPDATE SET
    engagement_score = GREATEST(0, reputation_scores.engagement_score + v_delta),
    total_score      = GREATEST(0, reputation_scores.total_score + v_delta);

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_reputation_like ON public.likes;
CREATE TRIGGER trg_reputation_like
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reputation_on_like();


CREATE OR REPLACE FUNCTION public.update_reputation_on_bookmark()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_founder UUID;
  v_delta   INT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_delta := 3;
    SELECT founder_id INTO v_founder FROM public.startups WHERE id = NEW.startup_id;
  ELSE
    v_delta := -3;
    SELECT founder_id INTO v_founder FROM public.startups WHERE id = OLD.startup_id;
  END IF;

  IF v_founder IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  INSERT INTO public.reputation_scores (user_id, total_score, engagement_score)
  VALUES (v_founder, GREATEST(0, v_delta), GREATEST(0, v_delta))
  ON CONFLICT (user_id) DO UPDATE SET
    engagement_score = GREATEST(0, reputation_scores.engagement_score + v_delta),
    total_score      = GREATEST(0, reputation_scores.total_score + v_delta);

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_reputation_bookmark ON public.bookmarks;
CREATE TRIGGER trg_reputation_bookmark
  AFTER INSERT OR DELETE ON public.bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reputation_on_bookmark();


CREATE OR REPLACE FUNCTION public.update_reputation_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target UUID;
BEGIN
  IF NEW.entity_type = 'startup' THEN
    SELECT founder_id INTO v_target FROM public.startups WHERE id = NEW.entity_id;
  END IF;
  IF v_target IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.reputation_scores (user_id, total_score, activity_score)
  VALUES (v_target, 2, 2)
  ON CONFLICT (user_id) DO UPDATE SET
    activity_score = reputation_scores.activity_score + 2,
    total_score    = reputation_scores.total_score + 2;

  -- Commenter also earns contribution points
  INSERT INTO public.reputation_scores (user_id, total_score, contribution_score)
  VALUES (NEW.user_id, 1, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    contribution_score = reputation_scores.contribution_score + 1,
    total_score        = reputation_scores.total_score + 1;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reputation_comment ON public.comments;
CREATE TRIGGER trg_reputation_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reputation_on_comment();


CREATE OR REPLACE FUNCTION public.update_reputation_on_pitch_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_founder UUID;
  v_points  INT := 0;
BEGIN
  -- Only fire when status transitions to approved or published
  IF NOT (NEW.status IN ('approved', 'published') AND
          OLD.status NOT IN ('approved', 'published')) THEN
    RETURN NEW;
  END IF;

  SELECT s.founder_id INTO v_founder
  FROM public.startups s WHERE s.id = NEW.startup_id;

  IF v_founder IS NULL THEN RETURN NEW; END IF;

  v_points := CASE NEW.status WHEN 'published' THEN 25 ELSE 15 END;

  INSERT INTO public.reputation_scores (user_id, total_score, verification_score)
  VALUES (v_founder, v_points, v_points)
  ON CONFLICT (user_id) DO UPDATE SET
    verification_score = reputation_scores.verification_score + v_points,
    total_score        = reputation_scores.total_score + v_points;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reputation_pitch ON public.pitches;
CREATE TRIGGER trg_reputation_pitch
  AFTER UPDATE ON public.pitches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reputation_on_pitch_approval();


CREATE OR REPLACE FUNCTION public.update_reputation_on_connection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when status changes to 'accepted'
  IF NOT (NEW.status = 'accepted' AND OLD.status != 'accepted') THEN
    RETURN NEW;
  END IF;

  -- Both parties earn responsiveness/activity points
  INSERT INTO public.reputation_scores (user_id, total_score, responsiveness_score)
  VALUES (NEW.sender_id, 8, 8)
  ON CONFLICT (user_id) DO UPDATE SET
    responsiveness_score = reputation_scores.responsiveness_score + 8,
    total_score          = reputation_scores.total_score + 8;

  INSERT INTO public.reputation_scores (user_id, total_score, responsiveness_score)
  VALUES (NEW.receiver_id, 8, 8)
  ON CONFLICT (user_id) DO UPDATE SET
    responsiveness_score = reputation_scores.responsiveness_score + 8,
    total_score          = reputation_scores.total_score + 8;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reputation_connection ON public.connection_requests;
CREATE TRIGGER trg_reputation_connection
  AFTER UPDATE ON public.connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reputation_on_connection();


-- ── 3. Connection Request: In-App Notifications ──────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_connection_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_name TEXT;
BEGIN
  SELECT full_name INTO v_sender_name FROM public.users WHERE id = NEW.sender_id;

  IF TG_OP = 'INSERT' THEN
    -- Notify receiver of new request
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      NEW.receiver_id,
      'connection_request',
      'New Connection Request',
      COALESCE(v_sender_name, 'Someone') || ' wants to connect with you',
      jsonb_build_object('sender_id', NEW.sender_id, 'request_id', NEW.id)
    );

  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Notify sender that request was accepted
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      NEW.sender_id,
      'connection_accepted',
      'Connection Accepted! 🎉',
      COALESCE(v_sender_name, 'Someone') || ' accepted your connection request',
      jsonb_build_object('receiver_id', NEW.receiver_id, 'request_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_connection_notify ON public.connection_requests;
CREATE TRIGGER trg_connection_notify
  AFTER INSERT OR UPDATE ON public.connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_connection_request();


-- ── 4. Event Registration: Notify Organiser ──────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_event_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_title TEXT;
  v_organiser   UUID;
  v_user_name   TEXT;
BEGIN
  SELECT title, organizer_id INTO v_event_title, v_organiser
  FROM public.events WHERE id = NEW.event_id;

  SELECT full_name INTO v_user_name FROM public.users WHERE id = NEW.user_id;

  -- Notify registrant
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    NEW.user_id,
    'event_reminder',
    'Registration Confirmed: ' || COALESCE(v_event_title, 'Event'),
    'You are registered for ' || COALESCE(v_event_title, 'the event') || '. We will send a reminder before it starts.',
    jsonb_build_object('event_id', NEW.event_id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_event_registration_notify ON public.event_registrations;
CREATE TRIGGER trg_event_registration_notify
  AFTER INSERT ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_event_registration();


-- ── 5. Pitch Version: Auto-snapshot on every edit ────────────────────────────

CREATE OR REPLACE FUNCTION public.snapshot_pitch_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Snapshot whenever meaningful content fields change (not status-only changes)
  IF (
    NEW.company_overview      IS DISTINCT FROM OLD.company_overview OR
    NEW.problem_statement     IS DISTINCT FROM OLD.problem_statement OR
    NEW.solution_description  IS DISTINCT FROM OLD.solution_description OR
    NEW.revenue_model         IS DISTINCT FROM OLD.revenue_model OR
    NEW.amount_raising        IS DISTINCT FROM OLD.amount_raising OR
    NEW.unique_value_proposition IS DISTINCT FROM OLD.unique_value_proposition
  ) THEN
    INSERT INTO public.pitch_versions (
      pitch_id, startup_id, version, snapshot, change_summary, created_by
    ) VALUES (
      OLD.id,
      OLD.startup_id,
      OLD.version,
      to_jsonb(OLD),
      CASE
        WHEN NEW.status = 'submitted'           THEN 'Submitted for review'
        WHEN NEW.status = 'resubmitted'         THEN 'Resubmitted after changes'
        WHEN OLD.status = 'changes_requested'   THEN 'Addressing requested changes'
        ELSE                                         'Content updated'
      END,
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pitch_version_snapshot ON public.pitches;
CREATE TRIGGER trg_pitch_version_snapshot
  BEFORE UPDATE ON public.pitches
  FOR EACH ROW
  EXECUTE FUNCTION public.snapshot_pitch_on_update();

-- 20261106150000_pause_clock_and_status_rules
--
-- Pausing an activity stops its clock. games.paused_ms keeps the time
-- spent in finished pauses and games.paused_at marks a pause in progress;
-- teams.pause_offset_ms is how much pause time had already passed when the
-- team started, so a team only gets back the pauses that fell inside its
-- own run. The server deadline, the participant countdown and the class
-- screen all use the same rule (lib/game/clock.ts).
--
-- A BEFORE UPDATE trigger on games owns the status rules and the pause
-- bookkeeping for every writer (the API, PostgREST, SQL): the activity only
-- moves forward (draft -> active <-> paused -> finished), so a stale tab
-- cannot reopen a finished activity; leaving a pause adds its length to
-- paused_ms; the first start sets starts_at; values for paused_at or
-- paused_ms sent by a client are ignored.
--
-- set_game_status() changes the status under a row lock for the owner.
-- extend_game_time() adds minutes in one statement, so two devices adding 5
-- minutes give 10, and it refuses activities without a time limit.
-- update_game_settings() merges a settings patch in one statement, so a
-- builder save cannot undo an extension made meanwhile; while the activity
-- runs, the time limit changes only through extend_game_time().
--
-- Existing rows: activities paused at the time of the migration get
-- paused_at = now(), so their pause counts from then; nothing else changes.
-- teams_pause_offset stamps a team's pause offset when it starts. The
-- functions run as the caller, so the existing RLS rules (owner, active
-- account) still decide who may change an activity.
--
-- Rollback: supabase/rollback/20261106150000_pause_clock_and_status_rules.sql

BEGIN;

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS paused_ms bigint NOT NULL DEFAULT 0;

ALTER TABLE public.games
  ADD CONSTRAINT games_paused_ms_check CHECK (paused_ms >= 0);

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS pause_offset_ms bigint NOT NULL DEFAULT 0;

ALTER TABLE public.teams
  ADD CONSTRAINT teams_pause_offset_ms_check CHECK (pause_offset_ms >= 0);

-- Activities paused right now: their pause counts from this moment (the
-- time before is not known). Done before the trigger below, which owns
-- these columns from then on.
UPDATE public.games SET paused_at = now() WHERE status = 'paused' AND paused_at IS NULL;

-- A team's pause offset is stamped by the database when it starts, from the
-- game's pause time at that moment, whichever code sets started_at (also an
-- older app version still running while this migration is applied).
CREATE OR REPLACE FUNCTION public.teams_pause_offset()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_paused_ms bigint;
  v_paused_at timestamptz;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Kept as it was unless the team is starting now.
    NEW.pause_offset_ms := OLD.pause_offset_ms;
    IF NOT (OLD.started_at IS NULL AND NEW.started_at IS NOT NULL) THEN
      RETURN NEW;
    END IF;
  ELSIF NEW.started_at IS NULL THEN
    NEW.pause_offset_ms := 0;
    RETURN NEW;
  END IF;

  SELECT paused_ms, paused_at INTO v_paused_ms, v_paused_at
  FROM public.games WHERE id = NEW.game_id;
  NEW.pause_offset_ms := coalesce(v_paused_ms, 0) + CASE
    WHEN v_paused_at IS NOT NULL
      THEN greatest(0, floor(extract(epoch FROM (now() - v_paused_at)) * 1000))::bigint
    ELSE 0
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS teams_pause_offset ON public.teams;
CREATE TRIGGER teams_pause_offset BEFORE INSERT OR UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.teams_pause_offset();

CREATE OR REPLACE FUNCTION public.games_status_rules()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  -- The pause clock is kept here only.
  NEW.paused_ms := OLD.paused_ms;
  NEW.paused_at := OLD.paused_at;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      (OLD.status = 'draft' AND NEW.status = 'active')
      OR (OLD.status = 'active' AND NEW.status IN ('paused', 'finished'))
      OR (OLD.status = 'paused' AND NEW.status IN ('active', 'finished'))
    ) THEN
      RAISE EXCEPTION 'status cannot change from % to %', OLD.status, NEW.status USING ERRCODE = 'KS409';
    END IF;

    IF OLD.paused_at IS NOT NULL THEN
      NEW.paused_ms := OLD.paused_ms
        + greatest(0, floor(extract(epoch FROM (now() - OLD.paused_at)) * 1000))::bigint;
    END IF;
    NEW.paused_at := CASE WHEN NEW.status = 'paused' THEN now() ELSE NULL END;

    IF NEW.status = 'active' AND NEW.starts_at IS NULL THEN
      NEW.starts_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS games_status_rules ON public.games;
CREATE TRIGGER games_status_rules BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.games_status_rules();

CREATE OR REPLACE FUNCTION public.set_game_status(p_game_id uuid, p_status text)
RETURNS public.games
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  g public.games;
BEGIN
  IF p_status IS NULL OR p_status NOT IN ('draft', 'active', 'paused', 'finished') THEN
    RAISE EXCEPTION 'unknown status %', p_status USING ERRCODE = '22023';
  END IF;

  SELECT * INTO g FROM public.games
  WHERE id = p_game_id AND teacher_id = auth.uid()
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'activity not found' USING ERRCODE = 'P0002';
  END IF;

  -- Same status again (a second device, a double click): nothing to do.
  IF g.status = p_status THEN
    RETURN g;
  END IF;

  -- games_status_rules checks the move and keeps the pause time.
  UPDATE public.games SET status = p_status
  WHERE id = p_game_id
  RETURNING * INTO g;

  RETURN g;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_game_settings(p_game_id uuid, p_patch jsonb)
RETURNS public.games
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  g public.games;
  v_patch jsonb := coalesce(p_patch, '{}'::jsonb);
BEGIN
  IF jsonb_typeof(v_patch) <> 'object' THEN
    RAISE EXCEPTION 'settings patch must be an object' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO g FROM public.games
  WHERE id = p_game_id AND teacher_id = auth.uid()
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'activity not found' USING ERRCODE = 'P0002';
  END IF;

  IF g.status IN ('active', 'paused') THEN
    v_patch := v_patch - 'time_limit_minutes';
  END IF;

  UPDATE public.games
  SET settings = coalesce(settings, '{}'::jsonb) || v_patch
  WHERE id = p_game_id
  RETURNING * INTO g;

  RETURN g;
END;
$$;

CREATE OR REPLACE FUNCTION public.extend_game_time(p_game_id uuid, p_minutes integer)
RETURNS public.games
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  g public.games;
  v_limit numeric;
BEGIN
  IF p_minutes IS NULL OR p_minutes < 1 OR p_minutes > 180 THEN
    RAISE EXCEPTION 'minutes must be between 1 and 180' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO g FROM public.games
  WHERE id = p_game_id AND teacher_id = auth.uid()
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'activity not found' USING ERRCODE = 'P0002';
  END IF;
  IF g.status NOT IN ('active', 'paused') THEN
    RAISE EXCEPTION 'only a running activity can get more time' USING ERRCODE = 'KS409';
  END IF;

  v_limit := CASE
    WHEN jsonb_typeof(g.settings -> 'time_limit_minutes') = 'number'
      THEN (g.settings ->> 'time_limit_minutes')::numeric
    ELSE NULL
  END;
  IF v_limit IS NULL OR v_limit <= 0 THEN
    RAISE EXCEPTION 'activity has no time limit' USING ERRCODE = 'KS422';
  END IF;
  IF v_limit + p_minutes > 1440 THEN
    RAISE EXCEPTION 'time limit cannot exceed 24 hours' USING ERRCODE = 'KS423';
  END IF;

  UPDATE public.games
  SET settings = jsonb_set(coalesce(settings, '{}'::jsonb), '{time_limit_minutes}', to_jsonb(v_limit + p_minutes))
  WHERE id = p_game_id
  RETURNING * INTO g;

  RETURN g;
END;
$$;

REVOKE ALL ON FUNCTION public.games_status_rules() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.teams_pause_offset() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_game_status(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.extend_game_time(uuid, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_game_settings(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_game_status(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.extend_game_time(uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_game_settings(uuid, jsonb) TO authenticated, service_role;

COMMIT;

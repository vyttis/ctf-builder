-- 20261106150000_pause_clock_and_status_rules
--
-- Pausing an activity stops its clock. games.paused_ms keeps the time
-- spent in finished pauses and games.paused_at marks a pause in progress;
-- teams.pause_offset_ms is how much pause time had already passed when the
-- team started, so a team only gets back the pauses that fell inside its
-- own run. The server deadline, the participant countdown and the class
-- screen all use the same rule (lib/game/clock.ts).
--
-- Status changes go through set_game_status(): the activity only moves
-- forward (draft -> active <-> paused -> finished), so a stale tab cannot
-- reopen a finished activity, and the pause bookkeeping happens under the
-- same row lock. extend_game_time() adds minutes in one statement, so two
-- devices adding 5 minutes give 10, and it refuses activities without a
-- time limit (adding minutes there used to create a 5-minute limit counted
-- from the original start).
--
-- No existing rows are changed. Both functions run as the caller, so the
-- existing RLS rules (owner, active account) still decide who may change
-- an activity.
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

  IF NOT (
    (g.status = 'draft' AND p_status = 'active')
    OR (g.status = 'active' AND p_status IN ('paused', 'finished'))
    OR (g.status = 'paused' AND p_status IN ('active', 'finished'))
  ) THEN
    RAISE EXCEPTION 'status cannot change from % to %', g.status, p_status USING ERRCODE = 'KS409';
  END IF;

  UPDATE public.games SET
    status = p_status,
    paused_ms = g.paused_ms + CASE
      WHEN g.paused_at IS NOT NULL
        THEN greatest(0, floor(extract(epoch FROM (now() - g.paused_at)) * 1000))::bigint
      ELSE 0
    END,
    paused_at = CASE WHEN p_status = 'paused' THEN now() ELSE NULL END,
    starts_at = CASE WHEN p_status = 'active' AND g.starts_at IS NULL THEN now() ELSE g.starts_at END
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
    RAISE EXCEPTION 'time limit cannot exceed 24 hours' USING ERRCODE = 'KS422';
  END IF;

  UPDATE public.games
  SET settings = jsonb_set(coalesce(settings, '{}'::jsonb), '{time_limit_minutes}', to_jsonb(v_limit + p_minutes))
  WHERE id = p_game_id
  RETURNING * INTO g;

  RETURN g;
END;
$$;

REVOKE ALL ON FUNCTION public.set_game_status(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.extend_game_time(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_game_status(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.extend_game_time(uuid, integer) TO authenticated, service_role;

COMMIT;

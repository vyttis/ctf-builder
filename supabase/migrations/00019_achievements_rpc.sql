-- Achievements RPC + lesson plan competencies + composite index
--
-- 1. evaluate_achievements RPC — consolidates 5 sequential queries
--    (lib/game/achievements.ts evaluateAchievements fan-out) into a single
--    Postgres call. ~150ms savings per correct submission. Backwards
--    compatible: app code first tries the RPC; if it doesn't exist
--    (function_does_not_exist 42883), it falls back to the JS loop.
-- 2. lesson_plans.competencies column — stores plan-level LT BUP competencies.
-- 3. idx_achievements_game_team — fast achievement lookups by (game, team).

-- ============================================
-- 0. Add competencies column to lesson_plans (top-level plan competencies)
-- ============================================
ALTER TABLE public.lesson_plans
  ADD COLUMN IF NOT EXISTS competencies text[] NOT NULL DEFAULT '{}';

-- ============================================
-- 1. Composite index for fast achievement lookups by (game, team)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_achievements_game_team
  ON public.achievements(game_id, team_id);

-- ============================================
-- 2. evaluate_achievements() RPC
-- ============================================
-- Returns a JSON array of newly earned achievements:
-- [{ "type": "first_solver", "challenge_id": "...", "metadata": {...} }, ...]
--
-- Does NOT insert into achievements table — the caller still decides whether
-- to persist (the caller knows about hint_free, which is purely client-side).
CREATE OR REPLACE FUNCTION public.evaluate_achievements(
  p_team_id uuid,
  p_game_id uuid,
  p_challenge_id uuid,
  p_hints_used integer DEFAULT 0
) RETURNS jsonb AS $$
DECLARE
  v_earned jsonb := '[]'::jsonb;
  v_other_correct_count integer;
  v_first_attempt timestamptz;
  v_solve_seconds integer;
  v_total_challenges integer;
  v_unique_solved integer;
  v_all_hint_free boolean;
  v_streak_count integer;
  v_existing_streak integer;
  rec record;
BEGIN
  -- first_solver: nobody else has correctly solved this challenge yet
  SELECT count(*) INTO v_other_correct_count
  FROM public.submissions
  WHERE challenge_id = p_challenge_id
    AND is_correct = true
    AND team_id <> p_team_id;

  IF v_other_correct_count = 0 THEN
    v_earned := v_earned || jsonb_build_array(
      jsonb_build_object('type', 'first_solver', 'challenge_id', p_challenge_id, 'metadata', '{}'::jsonb)
    );
  END IF;

  -- speed_demon: team solved within 60s of their first attempt on this challenge
  SELECT min(attempted_at) INTO v_first_attempt
  FROM public.submissions
  WHERE team_id = p_team_id AND challenge_id = p_challenge_id;

  IF v_first_attempt IS NOT NULL THEN
    v_solve_seconds := floor(EXTRACT(EPOCH FROM (now() - v_first_attempt)))::integer;
    IF v_solve_seconds < 60 THEN
      v_earned := v_earned || jsonb_build_array(
        jsonb_build_object(
          'type', 'speed_demon',
          'challenge_id', p_challenge_id,
          'metadata', jsonb_build_object('solve_seconds', v_solve_seconds)
        )
      );
    END IF;
  END IF;

  -- hint_free: this submission used zero hints
  IF p_hints_used = 0 THEN
    v_earned := v_earned || jsonb_build_array(
      jsonb_build_object('type', 'hint_free', 'challenge_id', p_challenge_id, 'metadata', '{}'::jsonb)
    );
  END IF;

  -- perfect_game: team has correctly solved EVERY challenge in this game, all without hints
  SELECT count(*) INTO v_total_challenges
  FROM public.challenges
  WHERE game_id = p_game_id;

  IF v_total_challenges > 0 THEN
    SELECT count(DISTINCT s.challenge_id) INTO v_unique_solved
    FROM public.submissions s
    JOIN public.challenges c ON c.id = s.challenge_id
    WHERE s.team_id = p_team_id
      AND s.is_correct = true
      AND c.game_id = p_game_id;

    IF v_unique_solved = v_total_challenges THEN
      SELECT bool_and(coalesce(s.hints_used, 0) = 0) INTO v_all_hint_free
      FROM public.submissions s
      JOIN public.challenges c ON c.id = s.challenge_id
      WHERE s.team_id = p_team_id
        AND s.is_correct = true
        AND c.game_id = p_game_id;

      IF v_all_hint_free THEN
        v_earned := v_earned || jsonb_build_array(
          jsonb_build_object(
            'type', 'perfect_game',
            'challenge_id', NULL,
            'metadata', jsonb_build_object('challenges_solved', v_total_challenges)
          )
        );
      END IF;
    END IF;
  END IF;

  -- streak: consecutive correct submissions from the tail of the submission timeline
  v_streak_count := 0;
  FOR rec IN
    SELECT s.is_correct
    FROM public.submissions s
    JOIN public.challenges c ON c.id = s.challenge_id
    WHERE s.team_id = p_team_id AND c.game_id = p_game_id
    ORDER BY s.attempted_at DESC
  LOOP
    EXIT WHEN NOT rec.is_correct;
    v_streak_count := v_streak_count + 1;
  END LOOP;

  IF v_streak_count >= 3 THEN
    SELECT coalesce((metadata->>'streak_count')::integer, 0) INTO v_existing_streak
    FROM public.achievements
    WHERE game_id = p_game_id AND team_id = p_team_id AND type = 'streak' AND challenge_id IS NULL
    LIMIT 1;

    IF v_existing_streak IS NULL OR v_existing_streak < v_streak_count THEN
      v_earned := v_earned || jsonb_build_array(
        jsonb_build_object(
          'type', 'streak',
          'challenge_id', NULL,
          'metadata', jsonb_build_object('streak_count', v_streak_count)
        )
      );
    END IF;
  END IF;

  RETURN v_earned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

REVOKE EXECUTE ON FUNCTION public.evaluate_achievements(uuid, uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.evaluate_achievements(uuid, uuid, uuid, integer) TO service_role;

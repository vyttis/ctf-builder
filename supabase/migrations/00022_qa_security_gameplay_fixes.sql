-- QA sweep: security + gameplay fixes
--
-- 1. CRITICAL: hide teams.session_token from client roles. The token is a
--    team's only credential; the RLS SELECT policy from 00014/00020 exposed
--    every column, so any player could list rival teams' tokens via the anon
--    key and impersonate them. Column-level grants mirror the approach used
--    for challenges.answer_hash in 00005.
-- 2. get_player_game_state: draft games returned "game not found", so students
--    who scanned a QR before the teacher pressed Start saw a scary error
--    instead of "not started yet". Return draft games with status metadata
--    (no challenges) so the join page can render the proper waiting message.
-- 3. evaluate_achievements: speed_demon was awarded on EVERY first-try correct
--    answer (now() - min(attempted_at) of a set that already includes the
--    current submission is always ~0s). Base it on the first WRONG attempt
--    instead: "recovered and solved within 60s".

-- ============================================
-- 1. Teams: column-level security for session_token
-- ============================================
REVOKE SELECT ON public.teams FROM anon, authenticated;
GRANT SELECT (id, game_id, name, total_points, current_challenge_index, joined_at, updated_at)
  ON public.teams TO anon, authenticated;

-- ============================================
-- 2. get_player_game_state: draft games are visible (status only)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_player_game_state(
  p_game_code text,
  p_session_token text DEFAULT NULL
) RETURNS json AS $$
DECLARE
  v_game record;
  v_team record;
  v_challenges json;
  v_solved json;
BEGIN
  -- Game lookup by code (draft included so the join page can say
  -- "not started yet" instead of "not found")
  SELECT id, title, description, status, settings
  INTO v_game
  FROM public.games
  WHERE game_code = p_game_code
    AND status IN ('draft', 'active', 'paused', 'finished');

  IF v_game.id IS NULL THEN
    RETURN json_build_object('game', NULL);
  END IF;

  -- Draft games expose only title + status — no challenges, settings or team
  -- data before the teacher starts the game.
  IF v_game.status = 'draft' THEN
    RETURN json_build_object(
      'game', json_build_object(
        'id', v_game.id,
        'title', v_game.title,
        'description', NULL,
        'status', v_game.status,
        'settings', '{}'::json
      ),
      'challenges', '[]'::json,
      'team', NULL,
      'solved', '[]'::json
    );
  END IF;

  -- Challenges (safe columns only — no answer_hash)
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', c.id,
      'title', c.title,
      'description', c.description,
      'type', c.type,
      'points', c.points,
      'hints', c.hints,
      'options', c.options,
      'order_index', c.order_index,
      'image_url', c.image_url,
      'maps_url', c.maps_url,
      'hint_penalty', c.hint_penalty,
      'prerequisites', c.prerequisites
    ) ORDER BY c.order_index
  ), '[]'::json)
  INTO v_challenges
  FROM public.challenges c
  WHERE c.game_id = v_game.id;

  -- Team + solved challenges (if session_token provided)
  IF p_session_token IS NOT NULL THEN
    SELECT id, name, total_points, current_challenge_index
    INTO v_team
    FROM public.teams
    WHERE session_token = p_session_token
      AND game_id = v_game.id;

    IF v_team.id IS NOT NULL THEN
      SELECT COALESCE(json_agg(
        json_build_object(
          'challenge_id', challenge_id,
          'points_awarded', points_awarded
        )
      ), '[]'::json)
      INTO v_solved
      FROM public.submissions
      WHERE team_id = v_team.id AND is_correct = true;
    END IF;
  END IF;

  RETURN json_build_object(
    'game', json_build_object(
      'id', v_game.id,
      'title', v_game.title,
      'description', v_game.description,
      'status', v_game.status,
      'settings', v_game.settings
    ),
    'challenges', v_challenges,
    'team', CASE WHEN v_team.id IS NOT NULL THEN
      json_build_object(
        'id', v_team.id,
        'name', v_team.name,
        'total_points', v_team.total_points,
        'current_challenge_index', v_team.current_challenge_index
      )
    ELSE NULL END,
    'solved', COALESCE(v_solved, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_player_game_state(text, text) TO anon, authenticated, service_role;

-- ============================================
-- 3. evaluate_achievements: fix speed_demon
-- ============================================
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

  -- speed_demon: the team had at least one WRONG attempt and then solved
  -- within 60s of that first attempt. (The current correct submission is
  -- already inserted when this runs, so min(attempted_at) over all rows
  -- would always be ~0s away from now() on first-try solves — that made the
  -- badge fire on every first-try correct answer.)
  SELECT min(attempted_at) INTO v_first_attempt
  FROM public.submissions
  WHERE team_id = p_team_id
    AND challenge_id = p_challenge_id
    AND is_correct = false;

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

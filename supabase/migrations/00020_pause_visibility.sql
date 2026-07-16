-- ============================================
-- 00020: Make paused games visible to players
-- ============================================
-- Paused games were invisible to anon clients: the games SELECT policy and
-- get_player_game_state() only covered 'active'/'finished'. Because Supabase
-- Realtime applies RLS to postgres_changes, an active -> paused UPDATE was
-- never delivered to player subscriptions, and a page refresh during pause
-- degraded to "game not found". Players must be able to see a paused game
-- (to render the pause overlay) while joins/submissions stay blocked by the
-- API routes, which still require status = 'active'.

-- 1. Games: anon read includes paused
DROP POLICY IF EXISTS "Anyone can read active games" ON public.games;
CREATE POLICY "Anyone can read active games" ON public.games
  FOR SELECT
  USING (status IN ('active', 'paused', 'finished'));

-- 2. Challenges: keep readable during pause so the play page survives refresh
DROP POLICY IF EXISTS "Anyone can read challenges for active games" ON public.challenges;
CREATE POLICY "Anyone can read challenges for active games" ON public.challenges
  FOR SELECT
  USING (
    exists (
      SELECT 1 FROM public.games
      WHERE games.id = challenges.game_id
        AND games.status IN ('active', 'paused', 'finished')
    )
  );

-- 3. Teams/submissions (from 00014): leaderboard keeps working during pause
DROP POLICY IF EXISTS "Read teams in active games" ON public.teams;
CREATE POLICY "Read teams in active games" ON public.teams
  FOR SELECT
  USING (
    exists (
      SELECT 1 FROM public.games
      WHERE games.id = teams.game_id
        AND games.status IN ('active', 'paused', 'finished')
    )
  );

DROP POLICY IF EXISTS "Read submissions in active games" ON public.submissions;
CREATE POLICY "Read submissions in active games" ON public.submissions
  FOR SELECT
  USING (
    exists (
      SELECT 1 FROM public.teams t
      JOIN public.games g ON g.id = t.game_id
      WHERE t.id = submissions.team_id
        AND g.status IN ('active', 'paused', 'finished')
    )
  );

-- 4. get_player_game_state: return paused games too (body otherwise identical
--    to 00018; the play page needs game.status to render the pause overlay)
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
  -- Game lookup by code
  SELECT id, title, description, status, settings
  INTO v_game
  FROM public.games
  WHERE game_code = p_game_code
    AND status IN ('active', 'paused', 'finished');

  IF v_game.id IS NULL THEN
    RETURN json_build_object('game', NULL);
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

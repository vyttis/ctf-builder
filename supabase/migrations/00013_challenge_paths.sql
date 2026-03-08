-- Add prerequisites support for non-linear challenge paths
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS prerequisites uuid[] DEFAULT '{}';

-- Modified increment_team_score: conditional index increment based on game mode
CREATE OR REPLACE FUNCTION public.increment_team_score(
  p_team_id uuid,
  p_points integer
) RETURNS void AS $$
DECLARE
  v_game_id uuid;
  v_game_mode text;
BEGIN
  SELECT t.game_id INTO v_game_id FROM public.teams t WHERE t.id = p_team_id;

  SELECT COALESCE(settings->>'challenge_path_mode', 'linear')
  INTO v_game_mode
  FROM public.games WHERE id = v_game_id;

  IF v_game_mode = 'linear' THEN
    -- Legacy behavior: increment index
    UPDATE public.teams
    SET
      total_points = total_points + p_points,
      current_challenge_index = current_challenge_index + 1
    WHERE id = p_team_id;
  ELSE
    -- Free mode: only update points, not index
    UPDATE public.teams
    SET total_points = total_points + p_points
    WHERE id = p_team_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New function: check if a challenge is unlocked for a team
CREATE OR REPLACE FUNCTION public.is_challenge_unlocked(
  p_team_id uuid,
  p_challenge_id uuid
) RETURNS boolean AS $$
DECLARE
  v_prereqs uuid[];
  v_solved_count integer;
  v_game_id uuid;
  v_game_mode text;
BEGIN
  -- Get challenge prerequisites and game_id
  SELECT prerequisites, game_id INTO v_prereqs, v_game_id
  FROM public.challenges WHERE id = p_challenge_id;

  -- No prerequisites = always unlocked
  IF v_prereqs IS NULL OR array_length(v_prereqs, 1) IS NULL THEN
    RETURN true;
  END IF;

  -- Check game mode
  SELECT COALESCE(settings->>'challenge_path_mode', 'linear')
  INTO v_game_mode
  FROM public.games WHERE id = v_game_id;

  -- Linear mode ignores prerequisites
  IF v_game_mode = 'linear' THEN
    RETURN true;
  END IF;

  -- Count how many prerequisites are solved
  SELECT count(DISTINCT challenge_id) INTO v_solved_count
  FROM public.submissions
  WHERE team_id = p_team_id
    AND challenge_id = ANY(v_prereqs)
    AND is_correct = true;

  RETURN v_solved_count >= array_length(v_prereqs, 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

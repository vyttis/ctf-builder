-- 20261106160000_team_moderation
--
-- moderate_team() renames or removes a team of the caller's own running or
-- paused activity in one database call. It checks, in the same transaction
-- as the change, that the caller's account is active (no 30-second cache as
-- in the app's proxy) and that the activity is still running: the activity
-- row is locked for share, so finishing it at the same moment either waits
-- for the change or makes it fail. A finished activity keeps its teams and
-- their answers for the report.
--
-- Teams have no owner column the caller could write through RLS, so the
-- function runs as its owner after these checks (SECURITY DEFINER) and is
-- callable only by signed-in users.
--
-- No existing rows are changed.
--
-- Rollback: supabase/rollback/20261106160000_team_moderation.sql

BEGIN;

CREATE OR REPLACE FUNCTION public.moderate_team(
  p_game_id uuid,
  p_team_id uuid,
  p_name text DEFAULT NULL,
  p_remove boolean DEFAULT false
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_status text;
  v_name text := btrim(coalesce(p_name, ''));
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_active_account() THEN
    RAISE EXCEPTION 'this account cannot change the activity' USING ERRCODE = '42501';
  END IF;

  SELECT g.status INTO v_status FROM public.games g
  WHERE g.id = p_game_id AND g.teacher_id = auth.uid()
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'activity not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_status NOT IN ('active', 'paused') THEN
    RAISE EXCEPTION 'teams change only while the activity runs' USING ERRCODE = 'KS409';
  END IF;

  IF p_remove THEN
    DELETE FROM public.teams WHERE id = p_team_id AND game_id = p_game_id;
  ELSE
    IF length(v_name) = 0 OR length(v_name) > 30 THEN
      RAISE EXCEPTION 'team name must be 1 to 30 characters' USING ERRCODE = '22023';
    END IF;
    UPDATE public.teams SET name = v_name WHERE id = p_team_id AND game_id = p_game_id;
  END IF;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'team not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN CASE WHEN p_remove THEN 'removed' ELSE 'renamed' END;
END;
$$;

REVOKE ALL ON FUNCTION public.moderate_team(uuid, uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.moderate_team(uuid, uuid, text, boolean) TO authenticated;

COMMIT;

-- 20261106120000_close_answer_and_role_gaps: close the data-access gaps found in the 2026-11-06 audit.
--
-- Checked in production on 2026-11-06 before this migration:
--   * any signed-in user could SELECT submissions.answer and
--     challenges.answer_hash of every active, paused or finished activity
--     (00005/00006 revoked those columns from anon only), and the
--     explanations shown only after a correct answer;
--   * any signed-in user could UPDATE their own profiles.role
--     ("Users can update own profile" has no column or WITH CHECK limit);
--   * anon could EXECUTE get_game_stats, get_game_reflections and
--     get_platform_stats, SECURITY DEFINER functions with no caller check;
--   * a teacher could INSERT a library item that is already "approved".
--
-- Rollback: supabase/rollback/20261106120000_close_answer_and_role_gaps.sql
-- Test: npm run test:db (scripts/test-db.sh, also in CI)

BEGIN;

-- 1. Answers: signed-in users get the same column grants as anon.
--    The server checks answers with the service role; no page or browser
--    query reads these two columns.
DO $$
DECLARE
  cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'challenges' AND column_name <> 'answer_hash';
  EXECUTE 'REVOKE SELECT ON public.challenges FROM authenticated';
  EXECUTE format('GRANT SELECT (%s) ON public.challenges TO authenticated', cols);

  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'submissions' AND column_name <> 'answer';
  EXECUTE 'REVOKE SELECT ON public.submissions FROM authenticated';
  EXECUTE format('GRANT SELECT (%s) ON public.submissions TO authenticated', cols);
END $$;

-- 1b. Task content of other teachers' activities (hints, explanations, DI
--     notes) is for participants through the server only. Signed-in users
--     read the tasks of their own activities (teacher policy) or, as admins,
--     all of them; the open read stays for anon, whose column grants exclude
--     explanations (00005).
DROP POLICY IF EXISTS "Anyone can read challenges for active games" ON public.challenges;
CREATE POLICY "Anyone can read challenges for active games" ON public.challenges
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = challenges.game_id
        AND games.status IN ('active', 'paused', 'finished')
    )
  );

COMMENT ON COLUMN public.challenges.answer_hash IS
  'Never readable by anon or authenticated (00005, 20261106120000_close_answer_and_role_gaps). New columns on challenges must be granted to both roles explicitly.';
COMMENT ON COLUMN public.submissions.answer IS
  'Never readable by anon or authenticated (00006, 20261106120000_close_answer_and_role_gaps). New columns on submissions must be granted to both roles explicitly.';

-- 2. Profiles: a user may edit only their own contact details. Role and
--    email change only through the service role (admin API).
REVOKE INSERT, UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, school, phone, avatar_url, onboarding_completed)
  ON public.profiles TO authenticated;

-- 3. Library: a new item always starts in review.
DROP POLICY IF EXISTS "teacher_insert_library" ON public.library_items;
CREATE POLICY "teacher_insert_library" ON public.library_items
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = published_by
    AND status = 'pending_review'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
  );

-- 4. Stats and reflections: only the activity owner, an admin or the
--    service role. The original functions are kept, renamed and closed,
--    so their bodies (which may differ in production) stay untouched.
CREATE OR REPLACE FUNCTION public.can_read_game(game_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(auth.role(), '') = 'service_role'
    OR EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_uuid AND g.teacher_id = auth.uid())
    OR coalesce(public.get_my_role(), '') IN ('admin', 'super_admin')
$$;
REVOKE ALL ON FUNCTION public.can_read_game(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_game(uuid) TO authenticated, service_role;

ALTER FUNCTION public.get_game_stats(uuid) RENAME TO get_game_stats_unchecked;
ALTER FUNCTION public.get_game_reflections(uuid) RENAME TO get_game_reflections_unchecked;
ALTER FUNCTION public.get_platform_stats() RENAME TO get_platform_stats_unchecked;
REVOKE ALL ON FUNCTION public.get_game_stats_unchecked(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_game_reflections_unchecked(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_platform_stats_unchecked() FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.get_game_stats(game_uuid uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_read_game(game_uuid) THEN
    RAISE EXCEPTION 'Nėra teisės matyti šios veiklos statistikos' USING ERRCODE = '42501';
  END IF;
  RETURN public.get_game_stats_unchecked(game_uuid);
END;
$$;

CREATE FUNCTION public.get_game_reflections(game_uuid uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_read_game(game_uuid) THEN
    RAISE EXCEPTION 'Nėra teisės matyti šios veiklos refleksijų' USING ERRCODE = '42501';
  END IF;
  RETURN public.get_game_reflections_unchecked(game_uuid);
END;
$$;

CREATE FUNCTION public.get_platform_stats()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role'
     AND coalesce(public.get_my_role(), '') NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Platformos statistika prieinama tik administratoriams' USING ERRCODE = '42501';
  END IF;
  RETURN public.get_platform_stats_unchecked();
END;
$$;

REVOKE ALL ON FUNCTION public.get_game_stats(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_game_reflections(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_platform_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_game_stats(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_game_reflections(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO authenticated, service_role;

COMMIT;

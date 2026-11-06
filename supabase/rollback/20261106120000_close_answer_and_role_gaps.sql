-- Rollback for 20261106120000_close_answer_and_role_gaps.sql.
-- Restores the grants, policy and functions as they were before this migration.
-- Run as postgres in the SQL editor, then re-run the checks in
-- docs/migration-history.md.

BEGIN;

-- 1. Answers: table-level SELECT for authenticated again.
DO $$
DECLARE
  cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ') INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'challenges' AND column_name <> 'answer_hash';
  EXECUTE format('REVOKE SELECT (%s) ON public.challenges FROM authenticated', cols);
  EXECUTE 'GRANT SELECT ON public.challenges TO authenticated';

  SELECT string_agg(quote_ident(column_name), ', ') INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'submissions' AND column_name <> 'answer';
  EXECUTE format('REVOKE SELECT (%s) ON public.submissions FROM authenticated', cols);
  EXECUTE 'GRANT SELECT ON public.submissions TO authenticated';
END $$;

-- 2. Profiles: table-level INSERT and UPDATE again (RLS still applies).
REVOKE UPDATE (full_name, school, phone, avatar_url, onboarding_completed)
  ON public.profiles FROM authenticated;
GRANT INSERT, UPDATE ON public.profiles TO anon, authenticated;

-- 3. Library insert policy as in 00002.
DROP POLICY IF EXISTS "teacher_insert_library" ON public.library_items;
CREATE POLICY "teacher_insert_library" ON public.library_items
  FOR INSERT WITH CHECK (auth.uid() = published_by);

-- 4. Original functions back under their names, executable by everyone.
DROP FUNCTION public.get_game_stats(uuid);
DROP FUNCTION public.get_game_reflections(uuid);
DROP FUNCTION public.get_platform_stats();
ALTER FUNCTION public.get_game_stats_unchecked(uuid) RENAME TO get_game_stats;
ALTER FUNCTION public.get_game_reflections_unchecked(uuid) RENAME TO get_game_reflections;
ALTER FUNCTION public.get_platform_stats_unchecked() RENAME TO get_platform_stats;
GRANT EXECUTE ON FUNCTION public.get_game_stats(uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_game_reflections(uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO PUBLIC;
DROP FUNCTION public.can_read_game(uuid);

COMMIT;

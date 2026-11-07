-- 20261107120000_close_active_code_listing: nobody can list running
-- activities any more; participants reach theirs only with its code.
--
-- Before this migration, with the public anon key and no session:
--   * SELECT game_code, title FROM games returned every active, paused and
--     finished activity ("Anyone can read active games", 00001/00020), so
--     anyone could collect the codes and join classes that were not theirs;
--   * teams, submissions, challenges and announcements of those activities
--     were readable the same way (00014/00020/20261106120000/00012), and
--     achievements of every activity (00011, USING true). Their game_id led
--     back to the code;
--   * the same "public" policies let any signed-in facilitator list other
--     facilitators' running activities.
--
-- Participant pages now read through the server with the activity code:
-- /api/play/status (state, clock, latest announcement), /api/play/state,
-- /api/play/leaderboard. They used the service role already, except the
-- leaderboard page, the announcement banner and the play page's realtime
-- channel, which are changed in the same release. Facilitators keep their
-- own activities (owner policies) and realtime on them; admins keep reading
-- everything through admin policies.
--
-- Answers were never part of this: answer columns stay closed (00005,
-- 20261106120000).
--
-- Rollback: supabase/rollback/20261107120000_close_active_code_listing.sql
-- Test: npm run test:db (scripts/test-db.sh, also in CI)

BEGIN;

-- 1. The open reads.
DROP POLICY IF EXISTS "Anyone can read active games" ON public.games;
DROP POLICY IF EXISTS "Anyone can read challenges for active games" ON public.challenges;
DROP POLICY IF EXISTS "Read teams in active games" ON public.teams;
DROP POLICY IF EXISTS "Read submissions in active games" ON public.submissions;
DROP POLICY IF EXISTS "Anyone can read announcements" ON public.announcements;
DROP POLICY IF EXISTS "Anyone can read achievements" ON public.achievements;

-- 2. Signed-in reads that relied on them: facilitators see the achievements
--    of their own activities, admins see every activity's teams, results,
--    achievements and announcements (they already see every activity and
--    task: admins_read_all_games, admins_read_all_challenges).
DROP POLICY IF EXISTS "Teachers read own game achievements" ON public.achievements;
CREATE POLICY "Teachers read own game achievements" ON public.achievements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = achievements.game_id
        AND games.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS admins_read_all_teams ON public.teams;
CREATE POLICY admins_read_all_teams ON public.teams
  FOR SELECT TO authenticated
  USING (public.get_my_role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS admins_read_all_submissions ON public.submissions;
CREATE POLICY admins_read_all_submissions ON public.submissions
  FOR SELECT TO authenticated
  USING (public.get_my_role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS admins_read_all_achievements ON public.achievements;
CREATE POLICY admins_read_all_achievements ON public.achievements
  FOR SELECT TO authenticated
  USING (public.get_my_role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS admins_read_all_announcements ON public.announcements;
CREATE POLICY admins_read_all_announcements ON public.announcements
  FOR SELECT TO authenticated
  USING (public.get_my_role() IN ('admin', 'super_admin'));

-- 3. No policy is left for anon on these tables; the grants go too, so a
--    future policy cannot reopen them by accident. Revoking the table
--    privilege also revokes the column grants (teams, submissions,
--    challenges).
REVOKE SELECT ON public.games, public.challenges, public.teams, public.submissions,
  public.announcements, public.achievements FROM anon;

COMMENT ON TABLE public.games IS
  'Not readable by anon (20261107120000): participants reach an activity only with its code, through the server.';

COMMIT;

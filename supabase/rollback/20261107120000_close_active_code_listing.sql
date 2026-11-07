-- Rollback for 20261107120000_close_active_code_listing.
-- Reopens the anon reads of running activities exactly as production had
-- them on 2026-11-07 before the migration (checked in the SQL Editor), and
-- removes the admin and achievement policies the migration added. The app
-- from the same release works either way: it no longer reads these tables
-- with the anon key.
--
-- Production differs from the migration files here: the games, teams and
-- submissions read policies are the 00014 versions (active and finished;
-- 00020 never replaced them there), and anon has no grant on
-- challenges.generated_by_di.

BEGIN;

DROP POLICY IF EXISTS "Teachers read own game achievements" ON public.achievements;
DROP POLICY IF EXISTS admins_read_all_teams ON public.teams;
DROP POLICY IF EXISTS admins_read_all_submissions ON public.submissions;
DROP POLICY IF EXISTS admins_read_all_achievements ON public.achievements;
DROP POLICY IF EXISTS admins_read_all_announcements ON public.announcements;

DROP POLICY IF EXISTS "Anyone can read active games" ON public.games;
CREATE POLICY "Anyone can read active games" ON public.games
  FOR SELECT
  USING (status IN ('active', 'finished'));

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

DROP POLICY IF EXISTS "Read teams in active games" ON public.teams;
CREATE POLICY "Read teams in active games" ON public.teams
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = teams.game_id
        AND games.status IN ('active', 'finished')
    )
  );

DROP POLICY IF EXISTS "Read submissions in active games" ON public.submissions;
CREATE POLICY "Read submissions in active games" ON public.submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.games g ON g.id = t.game_id
      WHERE t.id = submissions.team_id
        AND g.status IN ('active', 'finished')
    )
  );

DROP POLICY IF EXISTS "Anyone can read announcements" ON public.announcements;
CREATE POLICY "Anyone can read announcements" ON public.announcements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = announcements.game_id
        AND games.status IN ('active', 'paused')
    )
  );

DROP POLICY IF EXISTS "Anyone can read achievements" ON public.achievements;
CREATE POLICY "Anyone can read achievements"
  ON public.achievements FOR SELECT USING (true);

GRANT SELECT ON public.games, public.announcements, public.achievements TO anon;
GRANT SELECT (id, game_id, title, description, type, options, points, order_index,
  image_url, maps_url, prerequisites, created_at, updated_at)
  ON public.challenges TO anon;
GRANT SELECT (id, game_id, name, total_points, current_challenge_index, joined_at, updated_at)
  ON public.teams TO anon;
GRANT SELECT (id, team_id, challenge_id, is_correct, points_awarded, attempted_at)
  ON public.submissions TO anon;

COMMENT ON TABLE public.games IS NULL;

COMMIT;

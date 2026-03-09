-- Tighten teams and submissions RLS policies for cross-game isolation
-- Previously: USING(true) allowed any client to read/update ALL teams across all games
-- Now: scoped to teams within active/finished games only

-- Drop overly permissive team policies
DROP POLICY IF EXISTS "Anyone can read teams" ON public.teams;
DROP POLICY IF EXISTS "Anyone can update teams" ON public.teams;

-- Teams: allow reading only within active/finished games
CREATE POLICY "Read teams in active games" ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = teams.game_id
        AND games.status IN ('active', 'finished')
    )
  );

-- Teams: allow teachers to read all teams in their own games (any status)
CREATE POLICY "Teachers read own game teams" ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = teams.game_id
        AND games.teacher_id = auth.uid()
    )
  );

-- Teams: updates only via service role (increment_team_score function)
-- No direct client updates needed — score updates go through SECURITY DEFINER function

-- Drop overly permissive submission read policy
DROP POLICY IF EXISTS "Anyone can read submissions" ON public.submissions;

-- Submissions: scope reads to active/finished games
CREATE POLICY "Read submissions in active games" ON public.submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.games g ON g.id = t.game_id
      WHERE t.id = submissions.team_id
        AND g.status IN ('active', 'finished')
    )
  );

-- Submissions: teachers can read all submissions for their games
CREATE POLICY "Teachers read own game submissions" ON public.submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.games g ON g.id = t.game_id
      WHERE t.id = submissions.team_id
        AND g.teacher_id = auth.uid()
    )
  );

-- Add composite index for common submission query patterns
CREATE INDEX IF NOT EXISTS idx_submissions_team_correct
  ON public.submissions(team_id, is_correct)
  WHERE is_correct = true;

CREATE INDEX IF NOT EXISTS idx_submissions_team_challenge
  ON public.submissions(team_id, challenge_id);

-- Add index for rate limiting query (recent attempts)
CREATE INDEX IF NOT EXISTS idx_submissions_team_attempted
  ON public.submissions(team_id, attempted_at DESC);

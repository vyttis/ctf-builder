-- Achievement badges for gamification
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('first_solver', 'speed_demon', 'hint_free', 'perfect_game', 'streak')),
  challenge_id uuid REFERENCES public.challenges(id) ON DELETE CASCADE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  earned_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_achievements_game_id ON public.achievements(game_id);
CREATE INDEX idx_achievements_team_id ON public.achievements(team_id);

-- Unique indexes: prevent duplicate badges
CREATE UNIQUE INDEX idx_achievements_unique_with_challenge
  ON public.achievements(game_id, team_id, type, challenge_id)
  WHERE challenge_id IS NOT NULL;

CREATE UNIQUE INDEX idx_achievements_unique_without_challenge
  ON public.achievements(game_id, team_id, type)
  WHERE challenge_id IS NULL;

-- RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read achievements"
  ON public.achievements FOR SELECT USING (true);

-- No INSERT policy needed: achievements are inserted via service role (admin client)
-- which bypasses RLS entirely. Leaving INSERT closed prevents client-side fabrication.

-- Add to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'achievements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.achievements;
  END IF;
END $$;

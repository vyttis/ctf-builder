-- Announcements system for live game control
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_game_id ON public.announcements(game_id);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage own game announcements" ON public.announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = announcements.game_id
        AND games.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read announcements" ON public.announcements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = announcements.game_id
        AND games.status IN ('active', 'paused')
    )
  );

-- Ensure games table is in realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'games'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;

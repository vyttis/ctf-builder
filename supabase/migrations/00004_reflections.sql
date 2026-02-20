-- CTF Builder Sprint 4: Post-Game Reflections
-- STEAM LT Klaipeda

-- ============================================
-- 1. Refleksijų lentelė
-- ============================================
CREATE TABLE public.reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  hardest_challenge_id uuid REFERENCES public.challenges(id) ON DELETE SET NULL,
  improvement_text text NOT NULL,
  liked_text text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(game_id, team_id)
);

-- ============================================
-- 2. RLS
-- ============================================
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

-- Žaidėjai neturi auth — naudoja anon role per admin client
CREATE POLICY "Anyone can create reflections"
ON public.reflections FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can read reflections"
ON public.reflections FOR SELECT
TO anon, authenticated
USING (true);

-- ============================================
-- 3. RPC: gauti žaidimo refleksijas su JOIN
-- ============================================
CREATE OR REPLACE FUNCTION public.get_game_reflections(game_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(row_to_json(r))
  INTO result
  FROM (
    SELECT
      ref.id,
      ref.team_id,
      t.name AS team_name,
      ref.hardest_challenge_id,
      c.title AS hardest_challenge_title,
      ref.improvement_text,
      ref.liked_text,
      ref.created_at
    FROM public.reflections ref
    JOIN public.teams t ON t.id = ref.team_id
    LEFT JOIN public.challenges c ON c.id = ref.hardest_challenge_id
    WHERE ref.game_id = game_uuid
    ORDER BY ref.created_at DESC
  ) r;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

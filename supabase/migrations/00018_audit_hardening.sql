-- Audit hardening: security, performance, integrity fixes from multi-agent audit
-- See PR description for full finding list

-- ============================================
-- 1. CRITICAL: Lock down anon INSERTs (prevents fabricated submissions/teams/reflections)
-- ============================================
-- service_role bypasses RLS, so player flows via /api/* admin client still work.
-- The previous wide-open policies allowed any browser to INSERT directly via anon client.

DROP POLICY IF EXISTS "Anyone can create submissions" ON public.submissions;
DROP POLICY IF EXISTS "Anyone can create teams for active games" ON public.teams;
DROP POLICY IF EXISTS "Anyone can create reflections" ON public.reflections;

COMMENT ON TABLE public.submissions IS 'INSERT only via service_role from /api/submissions';
COMMENT ON TABLE public.teams IS 'INSERT only via service_role from /api/teams';
COMMENT ON TABLE public.reflections IS 'INSERT only via service_role from /api/reflections';

-- ============================================
-- 2. CRITICAL: Documents storage bucket with RLS (for /api/import/upload)
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'imports'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can read own documents" ON storage.objects;
CREATE POLICY "Users can read own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'imports'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'imports'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- ============================================
-- 3. CRITICAL: Library items UPDATE policy with WITH CHECK
-- ============================================
DROP POLICY IF EXISTS "admin_update_library" ON public.library_items;

CREATE POLICY "admin_update_library"
  ON public.library_items FOR UPDATE
  USING (public.get_my_role() IN ('admin', 'super_admin'))
  WITH CHECK (public.get_my_role() IN ('admin', 'super_admin'));

CREATE POLICY "publisher_update_own_library"
  ON public.library_items FOR UPDATE
  USING (
    published_by = auth.uid()
    AND status IN ('pending_review', 'rejected')
  )
  WITH CHECK (
    published_by = auth.uid()
    AND status IN ('pending_review', 'rejected')
  );

-- ============================================
-- 4. HIGH: Prevent duplicate correct solves (race condition guard)
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_unique_solve
  ON public.submissions(team_id, challenge_id)
  WHERE is_correct = true;

-- ============================================
-- 5. HIGH: Rehash legacy plaintext "hashes" to bcrypt
-- ============================================
-- Pre-bcrypt migration 00007, answer_hash was stored as normalized plaintext (lower+trim).
-- Convert remaining plaintext rows to bcrypt to prevent answer disclosure if DB is leaked.
UPDATE public.challenges
SET answer_hash = crypt(answer_hash, gen_salt('bf', 10))
WHERE answer_hash IS NOT NULL
  AND answer_hash NOT LIKE '$2%';

-- ============================================
-- 6. HIGH: Restrict SECURITY DEFINER function EXECUTE (block direct RPC by anon)
-- ============================================
REVOKE EXECUTE ON FUNCTION public.check_answer(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_answer(uuid, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_answer(uuid, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.increment_team_score(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_team_score(uuid, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_team_score(uuid, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.is_challenge_unlocked(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_challenge_unlocked(uuid, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_challenge_unlocked(uuid, uuid) TO service_role;

-- Validate increment_team_score input (negative points guard)
CREATE OR REPLACE FUNCTION public.increment_team_score(
  p_team_id uuid,
  p_points integer
) RETURNS void AS $$
DECLARE
  v_game_id uuid;
  v_game_mode text;
BEGIN
  IF p_points < 0 THEN
    RAISE EXCEPTION 'invalid points: %', p_points;
  END IF;

  SELECT t.game_id INTO v_game_id FROM public.teams t WHERE t.id = p_team_id;

  SELECT COALESCE(settings->>'challenge_path_mode', 'linear')
  INTO v_game_mode
  FROM public.games WHERE id = v_game_id;

  IF v_game_mode = 'linear' THEN
    UPDATE public.teams
    SET
      total_points = total_points + p_points,
      current_challenge_index = current_challenge_index + 1
    WHERE id = p_team_id;
  ELSE
    UPDATE public.teams
    SET total_points = total_points + p_points
    WHERE id = p_team_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.increment_team_score(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_team_score(uuid, integer) TO service_role;

-- ============================================
-- 7. PERFORMANCE: get_player_game_state RPC — single round-trip for /play page
-- ============================================
-- Combines games + challenges + team + submissions lookup into one call.
-- Reduces 3-4 sequential queries to one, dramatically improving cold-start time
-- for student game pages (slow load issue).
CREATE OR REPLACE FUNCTION public.get_player_game_state(
  p_game_code text,
  p_session_token text DEFAULT NULL
) RETURNS json AS $$
DECLARE
  v_game record;
  v_team record;
  v_challenges json;
  v_solved json;
BEGIN
  -- Game lookup by code
  SELECT id, title, description, status, settings
  INTO v_game
  FROM public.games
  WHERE game_code = p_game_code
    AND status IN ('active', 'finished');

  IF v_game.id IS NULL THEN
    RETURN json_build_object('game', NULL);
  END IF;

  -- Challenges (safe columns only — no answer_hash)
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', c.id,
      'title', c.title,
      'description', c.description,
      'type', c.type,
      'points', c.points,
      'hints', c.hints,
      'options', c.options,
      'order_index', c.order_index,
      'image_url', c.image_url,
      'maps_url', c.maps_url,
      'hint_penalty', c.hint_penalty,
      'prerequisites', c.prerequisites
    ) ORDER BY c.order_index
  ), '[]'::json)
  INTO v_challenges
  FROM public.challenges c
  WHERE c.game_id = v_game.id;

  -- Team + solved challenges (if session_token provided)
  IF p_session_token IS NOT NULL THEN
    SELECT id, name, total_points, current_challenge_index
    INTO v_team
    FROM public.teams
    WHERE session_token = p_session_token
      AND game_id = v_game.id;

    IF v_team.id IS NOT NULL THEN
      SELECT COALESCE(json_agg(
        json_build_object(
          'challenge_id', challenge_id,
          'points_awarded', points_awarded
        )
      ), '[]'::json)
      INTO v_solved
      FROM public.submissions
      WHERE team_id = v_team.id AND is_correct = true;
    END IF;
  END IF;

  RETURN json_build_object(
    'game', json_build_object(
      'id', v_game.id,
      'title', v_game.title,
      'description', v_game.description,
      'status', v_game.status,
      'settings', v_game.settings
    ),
    'challenges', v_challenges,
    'team', CASE WHEN v_team.id IS NOT NULL THEN
      json_build_object(
        'id', v_team.id,
        'name', v_team.name,
        'total_points', v_team.total_points,
        'current_challenge_index', v_team.current_challenge_index
      )
    ELSE NULL END,
    'solved', COALESCE(v_solved, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_player_game_state(text, text) TO anon, authenticated, service_role;

-- ============================================
-- 8. MEDIUM: Foreign-key ON DELETE rules (audit-friendly soft cleanup)
-- ============================================
ALTER TABLE public.library_items
  DROP CONSTRAINT IF EXISTS library_items_published_by_fkey;
ALTER TABLE public.library_items
  ADD CONSTRAINT library_items_published_by_fkey
  FOREIGN KEY (published_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.library_items
  DROP CONSTRAINT IF EXISTS library_items_reviewed_by_fkey;
ALTER TABLE public.library_items
  ADD CONSTRAINT library_items_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- announcements.created_by CASCADE was too aggressive — switch to SET NULL
ALTER TABLE public.announcements ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.announcements
  DROP CONSTRAINT IF EXISTS announcements_created_by_fkey;
ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ============================================
-- 9. MEDIUM: Constraints + integrity guards
-- ============================================
-- game_code must be 6 chars from generator alphabet
ALTER TABLE public.games
  DROP CONSTRAINT IF EXISTS game_code_format;
ALTER TABLE public.games
  ADD CONSTRAINT game_code_format CHECK (game_code ~ '^[A-Za-z0-9_-]{6,12}$');

-- verification_confidence must be 0..1
ALTER TABLE public.challenges
  DROP CONSTRAINT IF EXISTS verification_confidence_range;
ALTER TABLE public.challenges
  ADD CONSTRAINT verification_confidence_range
  CHECK (verification_confidence IS NULL OR (verification_confidence >= 0 AND verification_confidence <= 1));

-- reflections.created_at NOT NULL for consistency
ALTER TABLE public.reflections ALTER COLUMN created_at SET NOT NULL;

-- ============================================
-- 10. MEDIUM: Missing indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_lesson_plans_source_game_id
  ON public.lesson_plans(source_game_id);

CREATE INDEX IF NOT EXISTS idx_announcements_created_at
  ON public.announcements(game_id, created_at DESC);

-- ============================================
-- 11. CLEANUP: Drop unused templates table (Sprint 1 placeholder)
-- ============================================
DROP TABLE IF EXISTS public.templates;

-- ============================================
-- 12. PERFORMANCE: Add games to realtime publication (idempotent)
-- ============================================
-- Players subscribe to game_settings_$id channel to receive paused/finished status
-- and time-extension updates. Without this, the subscription is silently broken.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'games'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
  END IF;
END $$;

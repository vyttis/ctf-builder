-- ============================================
-- 00021: Track challenges without a confirmed answer
-- ============================================
-- Duplicated/cloned challenges used to be created with a literal
-- "placeholder" answer (guessable by students) and no teacher-facing signal.
-- New flow: such challenges get an unguessable random answer_hash plus
-- needs_answer = true; the UI flags them and game activation is blocked
-- until the teacher sets a real answer.

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS needs_answer boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.challenges.needs_answer IS
  'True when the challenge was duplicated/cloned and the teacher has not yet set a real answer. Blocks game activation.';

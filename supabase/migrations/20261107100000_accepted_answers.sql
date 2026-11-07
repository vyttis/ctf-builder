-- 20261107100000_accepted_answers: a task may accept more than one answer
-- (owner decision 2026-11-07, "Keli teisingi atsakymai").
--
-- challenges.accepted_answer_hashes keeps up to five more answers for a
-- text or number task, hashed by the server (lib/game/answer-hasher.ts)
-- and checked with the service role after the main answer_hash. Like
-- answer_hash it is never readable by anon or authenticated: SELECT on
-- challenges is granted per column (00005, 20261106120000), so a new column
-- stays closed until granted. Facilitators see only how many there are,
-- through the generated accepted_answer_count, granted to authenticated.
--
-- Additive: existing tasks get an empty list. Adding the stored generated
-- column rewrites public.challenges (a few thousand rows, under a second,
-- with an exclusive lock): apply when no activity is running, then deploy.
--
-- Rollback: supabase/rollback/20261107100000_accepted_answers.sql
-- Test: npm run test:db (scripts/test-db.sh, also in CI)

BEGIN;

ALTER TABLE public.challenges
  ADD COLUMN accepted_answer_hashes text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN accepted_answer_count integer
    GENERATED ALWAYS AS (cardinality(accepted_answer_hashes)) STORED,
  ADD CONSTRAINT challenges_accepted_answers_max CHECK (cardinality(accepted_answer_hashes) <= 5);

GRANT SELECT (accepted_answer_count) ON public.challenges TO authenticated;

COMMENT ON COLUMN public.challenges.accepted_answer_hashes IS
  'More accepted answers (hashes). Never readable by anon or authenticated (20261107100000); the server checks them with the service role.';
COMMENT ON COLUMN public.challenges.accepted_answer_count IS
  'How many accepted_answer_hashes a task has; readable by the facilitator (20261107100000).';

COMMIT;

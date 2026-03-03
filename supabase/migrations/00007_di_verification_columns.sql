-- DI (Dirbtinis Intelektas) verification metadata on challenges
-- Tracks whether a challenge was AI-generated and its verification status

ALTER TABLE public.challenges
  ADD COLUMN generated_by_di boolean NOT NULL DEFAULT false;

ALTER TABLE public.challenges
  ADD COLUMN verification_verdict text
  CHECK (verification_verdict IN ('pass', 'fail', 'uncertain'));

ALTER TABLE public.challenges
  ADD COLUMN verification_issues jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.challenges
  ADD COLUMN verification_confidence numeric;

-- Migration 00005 revoked blanket SELECT from anon and grants column-level
-- SELECT on safe columns. New columns must be explicitly granted.
GRANT SELECT (generated_by_di, verification_verdict, verification_issues, verification_confidence)
  ON public.challenges TO anon;

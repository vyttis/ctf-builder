-- Add explanation, difficulty, and hint_penalty columns to challenges
-- Supports: post-answer explanations, difficulty metadata, per-task hint scoring

ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS explanation text;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS difficulty text
  CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT NULL;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS hint_penalty integer DEFAULT 20;

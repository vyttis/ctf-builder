-- Per-team game clock: server-authoritative start timestamp
--
-- The player time limit was enforced only by a localStorage timestamp
-- (ctf_start_<code>): a student could delete or edit it for a fresh clock,
-- switch devices, and /api/submissions never checked elapsed time. This adds a
-- per-team started_at that the API stamps once (via /api/play/start) and uses
-- to reject late submissions. Per-team (not games.starts_at) because each team
-- starts its own countdown when it taps "Pradėti", so timers legitimately
-- differ across teams in the same game.

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS started_at timestamptz;

COMMENT ON COLUMN public.teams.started_at IS
  'When the team started its timed run (stamped once by /api/play/start). NULL until the team starts a time-limited game.';

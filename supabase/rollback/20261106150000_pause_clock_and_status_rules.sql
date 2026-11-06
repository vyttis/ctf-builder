-- Rollback for 20261106150000_pause_clock_and_status_rules.
-- Deploy the previous application version first: it does not call these
-- functions or read the new columns.

BEGIN;

DROP FUNCTION IF EXISTS public.update_game_settings(uuid, jsonb);
DROP FUNCTION IF EXISTS public.extend_game_time(uuid, integer);
DROP FUNCTION IF EXISTS public.set_game_status(uuid, text);
DROP TRIGGER IF EXISTS games_status_rules ON public.games;
DROP FUNCTION IF EXISTS public.games_status_rules();

ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_pause_offset_ms_check;
ALTER TABLE public.teams DROP COLUMN IF EXISTS pause_offset_ms;

ALTER TABLE public.games DROP CONSTRAINT IF EXISTS games_paused_ms_check;
ALTER TABLE public.games DROP COLUMN IF EXISTS paused_ms;
ALTER TABLE public.games DROP COLUMN IF EXISTS paused_at;

COMMIT;

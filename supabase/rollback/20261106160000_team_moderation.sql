-- Rollback for 20261106160000_team_moderation.
-- The application falls back to its own checks when the function is missing.

BEGIN;

DROP FUNCTION IF EXISTS public.moderate_team(uuid, uuid, text, boolean);

COMMIT;

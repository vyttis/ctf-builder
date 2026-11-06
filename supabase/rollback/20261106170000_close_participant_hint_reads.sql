-- Rollback for 20261106170000_close_participant_hint_reads.
-- Restores the anon read of hints and the open execute grant of
-- get_player_game_state, as production had them on 2026-11-06. The DI note
-- columns (verification_*) were already not readable by anon in production
-- then, so they stay closed.

BEGIN;

GRANT SELECT (hints) ON public.challenges TO anon;

-- Production ACL before: {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
GRANT EXECUTE ON FUNCTION public.get_player_game_state(text, text) TO PUBLIC, anon, authenticated, service_role;

COMMENT ON COLUMN public.challenges.hints IS NULL;

COMMIT;

-- Rollback for 20261106170000_close_participant_hint_reads.
-- Restores the anon reads of hints and DI notes and the open execute grant
-- of get_player_game_state, as they were after 00022.

BEGIN;

GRANT SELECT (hints, verification_verdict, verification_issues, verification_confidence)
  ON public.challenges TO anon;

GRANT EXECUTE ON FUNCTION public.get_player_game_state(text, text) TO anon, authenticated, service_role;

COMMENT ON COLUMN public.challenges.hints IS NULL;

COMMIT;

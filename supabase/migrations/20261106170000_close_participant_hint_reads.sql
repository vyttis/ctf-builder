-- 20261106170000_close_participant_hint_reads: participants get hints and
-- DI notes only through the server (audit PLR-02, TCH-03 follow-up).
--
-- Before this migration, with the public anon key and no session:
--   * SELECT hints FROM challenges (00005) returned every hint of every
--     running, paused or finished activity, so the hint penalty could be
--     skipped by reading hints directly instead of revealing them;
--   * SELECT verification_issues/verdict/confidence (00007) returned the DI
--     check notes, which can quote an answer ("turėtų būti 144");
--   * get_player_game_state(text, text) (SECURITY DEFINER, 00018/00020/00022)
--     was executable by anon and authenticated and returns hint texts.
--
-- The app reads all of these with the service role only (/api/play/state,
-- /api/play/hint, the teacher pages as the owner): no browser query uses
-- them. Teachers keep their reads through the authenticated grants and the
-- owner policy (20261106120000).
--
-- Rollback: supabase/rollback/20261106170000_close_participant_hint_reads.sql
-- Test: npm run test:db (scripts/test-db.sh, also in CI)

BEGIN;

REVOKE SELECT (hints, verification_verdict, verification_issues, verification_confidence)
  ON public.challenges FROM anon;

REVOKE EXECUTE ON FUNCTION public.get_player_game_state(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_game_state(text, text) TO service_role;

COMMENT ON COLUMN public.challenges.hints IS
  'Not readable by anon (20261106170000): participants get hint texts from /api/play/hint, which records the reveal.';

COMMIT;

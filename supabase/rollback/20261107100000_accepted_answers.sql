-- Rollback for 20261107100000_accepted_answers.
-- Removes the extra accepted answers. Tasks keep their main answer; any
-- extra answers facilitators entered are lost and must be entered again
-- after a later re-apply. Deploy the code from before the feature first
-- (it does not read these columns), then run this.

BEGIN;

ALTER TABLE public.challenges
  DROP CONSTRAINT IF EXISTS challenges_accepted_answers_max,
  DROP COLUMN IF EXISTS accepted_answer_count,
  DROP COLUMN IF EXISTS accepted_answer_hashes;

COMMIT;

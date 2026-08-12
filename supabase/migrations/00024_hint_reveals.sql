-- Server-side hint tracking
--
-- The hint penalty was computed from a client-declared hints_used field, so a
-- student could reveal every hint in the UI and then submit hints_used: 0 to
-- avoid the penalty. This records each reveal server-side; /api/submissions
-- computes the penalty from stored rows instead of trusting the client.
--
-- Note (residual, tracked as follow-up): challenge hint TEXT is still shipped
-- in get_player_game_state, so a devtools user could read hints from the
-- payload without tapping "reveal" (hence without a recorded row). Fully
-- closing that requires on-demand hint delivery (drop hints from the state
-- payload, return each hint's text from /api/play/hint). This migration closes
-- the common-case exploit — revealing via the normal UI is now always
-- recorded — without that larger breaking change.

CREATE TABLE IF NOT EXISTS public.hint_reveals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  hint_index integer NOT NULL CHECK (hint_index >= 0),
  revealed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, challenge_id, hint_index)
);

-- Penalty query hits (team_id, challenge_id); the unique index above already
-- covers that prefix, so no extra index is needed.

ALTER TABLE public.hint_reveals ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: writes and reads happen only through the
-- service-role client in /api/play/hint and /api/submissions (service_role
-- bypasses RLS). This mirrors submissions/teams/reflections (00018).
COMMENT ON TABLE public.hint_reveals IS
  'One row per (team, challenge, hint) reveal. INSERT/SELECT only via service_role from /api/play/hint and /api/submissions.';

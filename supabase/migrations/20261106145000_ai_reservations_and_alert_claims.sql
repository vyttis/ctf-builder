-- 20261106145000_ai_reservations_and_alert_claims
--
-- The personal monthly DI limit is checked and the slot taken in one
-- database call. reserve_ai_action() holds a per-person advisory lock while
-- it counts the month's actions and inserts the reservation row, so two
-- requests started together at the last free slot cannot both pass, however
-- their transactions commit. An action counts when a model call was recorded
-- for it, or while it may still be running (in-flight window from the app).
-- The month (UTC) and the in-flight window are taken from the same timestamp
-- the reservation row gets, so a call at the turn of a month is counted in
-- the month its row belongs to.
--
-- Budget alert emails are claimed with a unique index: one row per month and
-- level, so two servers crossing a threshold together send one email.
--
-- No existing rows are changed. ai_usage and admin_audit_log are written by
-- the service role only; the function is not callable by anon or
-- authenticated.
--
-- Rollback: supabase/rollback/20261106145000_ai_reservations_and_alert_claims.sql

BEGIN;

CREATE INDEX IF NOT EXISTS ai_usage_request ON public.ai_usage (request_id);

CREATE UNIQUE INDEX IF NOT EXISTS admin_audit_log_ai_budget_alert_once
  ON public.admin_audit_log (target_id)
  WHERE action = 'ai_budget.alert';

CREATE OR REPLACE FUNCTION public.reserve_ai_action(
  p_user_id uuid,
  p_request_id uuid,
  p_endpoint text,
  p_limit integer,
  p_in_flight_seconds integer
) RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now constant timestamptz := now();
  v_month_start constant timestamptz := date_trunc('month', v_now, 'UTC');
  v_in_flight_since constant timestamptz := v_now - make_interval(secs => p_in_flight_seconds);
  v_used integer;
BEGIN
  -- One reservation at a time per person: the count below sees every
  -- earlier reservation, committed before this lock was granted.
  PERFORM pg_advisory_xact_lock(hashtextextended('ai_usage:' || p_user_id::text, 0));

  SELECT count(*) INTO v_used
  FROM public.ai_usage r
  WHERE r.user_id = p_user_id
    AND r.model = 'reservation'
    AND r.created_at >= v_month_start
    AND (
      r.created_at >= v_in_flight_since
      OR EXISTS (
        SELECT 1 FROM public.ai_usage c
        WHERE c.request_id = r.request_id AND c.model <> 'reservation'
      )
    );

  IF v_used >= p_limit THEN
    RETURN -1;
  END IF;

  INSERT INTO public.ai_usage (user_id, request_id, endpoint, model, created_at)
  VALUES (p_user_id, p_request_id, p_endpoint, 'reservation', v_now);

  RETURN v_used;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_ai_action(uuid, uuid, text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_action(uuid, uuid, text, integer, integer)
  TO service_role;

COMMIT;

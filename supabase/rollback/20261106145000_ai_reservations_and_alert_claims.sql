-- Rollback for 20261106145000_ai_reservations_and_alert_claims.
-- Deploy the previous application version first: it does not call
-- reserve_ai_action().

BEGIN;

DROP FUNCTION IF EXISTS public.reserve_ai_action(uuid, uuid, text, integer, integer);
DROP INDEX IF EXISTS public.admin_audit_log_ai_budget_alert_once;
DROP INDEX IF EXISTS public.ai_usage_request;

COMMIT;

-- Rollback for 20261106130000_access_requests_and_ai_usage.sql.
-- Drops the new tables (request links, requests, audit log, DI usage,
-- settings) and the new profile columns. Export the tables first if their
-- rows matter.

BEGIN;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['games', 'challenges', 'announcements', 'lesson_plans', 'library_items'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS "Only active accounts insert" ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS "Only active accounts update" ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS "Only active accounts delete" ON public.%I', t);
    END IF;
  END LOOP;
END $$;
DROP POLICY IF EXISTS "Only active accounts upload" ON storage.objects;
DROP POLICY IF EXISTS "Only active accounts change uploads" ON storage.objects;
DROP POLICY IF EXISTS "Only active accounts delete uploads" ON storage.objects;
DROP FUNCTION IF EXISTS public.is_active_account();

DROP TRIGGER IF EXISTS games_finished_at ON public.games;
DROP FUNCTION IF EXISTS public.set_game_finished_at();
ALTER TABLE public.games DROP COLUMN IF EXISTS finished_at;

DROP TRIGGER IF EXISTS access_requests_link_open ON public.access_requests;
DROP FUNCTION IF EXISTS public.check_request_link_open();

DROP TABLE IF EXISTS public.platform_settings;
DROP TABLE IF EXISTS public.ai_usage;
DROP TABLE IF EXISTS public.admin_audit_log;
DROP TABLE IF EXISTS public.access_requests;
DROP TABLE IF EXISTS public.request_links;

REVOKE UPDATE (first_name, last_name, school_code, municipality, school_type, subjects, grades, consent_at)
  ON public.profiles FROM authenticated;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS first_name,
  DROP COLUMN IF EXISTS last_name,
  DROP COLUMN IF EXISTS school_code,
  DROP COLUMN IF EXISTS municipality,
  DROP COLUMN IF EXISTS school_type,
  DROP COLUMN IF EXISTS subjects,
  DROP COLUMN IF EXISTS grades,
  DROP COLUMN IF EXISTS consent_at,
  DROP COLUMN IF EXISTS approved_at,
  DROP COLUMN IF EXISTS approved_by,
  DROP COLUMN IF EXISTS ai_monthly_limit;

COMMIT;

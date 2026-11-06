-- 20261106130000_access_requests_and_ai_usage
--
-- Closed sign-up: a teacher taking part in an activity, or one who got a
-- secret request link from the super admin, asks for a facilitator
-- account; the super admin approves it and the account starts active.
-- Accounts created any other way wait for approval and cannot write
-- facilitator data, even through the REST API directly. Profiles get the
-- fields used for statistics. DI calls are recorded with their cost so
-- monthly limits can be enforced.
--
-- Rollback: supabase/rollback/20261106130000_access_requests_and_ai_usage.sql

BEGIN;

-- 1. Profiles: status and statistics fields.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS school_code text,
  ADD COLUMN IF NOT EXISTS municipality text,
  ADD COLUMN IF NOT EXISTS school_type text,
  ADD COLUMN IF NOT EXISTS subjects text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS grades text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ai_monthly_limit integer CHECK (ai_monthly_limit IS NULL OR ai_monthly_limit >= 0);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check CHECK (status IN ('pending', 'active', 'blocked'));

-- Existing accounts were filled with 'active' above; from now on a new
-- account waits until the super admin approves it.
ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'pending';

GRANT UPDATE (first_name, last_name, school_code, municipality, school_type, subjects, grades, consent_at)
  ON public.profiles TO authenticated;

-- 2. Request links: secret addresses the super admin sends to teachers
--    (e.g. one per seminar). The token is the capability; the table is
--    server-only.
CREATE TABLE public.request_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE CHECK (length(token) >= 20),
  label text NOT NULL CHECK (length(label) BETWEEN 2 AND 120),
  expires_at timestamptz,
  revoked_at timestamptz,
  max_uses integer CHECK (max_uses IS NULL OR max_uses > 0),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.request_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.request_links FROM anon, authenticated;

-- 3. Access requests. Only the server writes and reads them (service role).
CREATE TABLE public.access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL CHECK (email = lower(email) AND position('@' in email) > 1),
  first_name text NOT NULL CHECK (length(first_name) BETWEEN 1 AND 80),
  last_name text NOT NULL CHECK (length(last_name) BETWEEN 1 AND 80),
  school_code text,
  school_name text NOT NULL CHECK (length(school_name) BETWEEN 2 AND 200),
  municipality text,
  source text NOT NULL CHECK (source IN ('finish_screen', 'qr', 'link')),
  source_game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
  source_link_id uuid REFERENCES public.request_links(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_note text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX access_requests_one_pending_per_email
  ON public.access_requests (email) WHERE status = 'pending';
CREATE INDEX access_requests_status_created ON public.access_requests (status, created_at DESC);
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.access_requests FROM anon, authenticated;

-- 4. Admin audit log: who changed which account, role or request.
CREATE TABLE public.admin_audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_audit_log_created ON public.admin_audit_log (created_at DESC);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_audit_log FROM anon, authenticated;

-- 5. DI usage: one row per model call; request_id groups the calls of one
--    teacher action (generation plus verification), which is what the
--    monthly limit counts.
CREATE TABLE public.ai_usage (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  request_id uuid NOT NULL,
  endpoint text NOT NULL,
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric(10, 5) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_usage_user_created ON public.ai_usage (user_id, created_at);
CREATE INDEX ai_usage_created ON public.ai_usage (created_at);
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_usage FROM anon, authenticated;

-- 6. Platform settings (one row), edited by the super admin.
CREATE TABLE public.platform_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  ai_monthly_budget_usd numeric(10, 2) NOT NULL DEFAULT 50 CHECK (ai_monthly_budget_usd >= 0),
  ai_user_monthly_limit integer NOT NULL DEFAULT 40 CHECK (ai_user_monthly_limit >= 0),
  ai_budget_alert_ratio numeric(3, 2) NOT NULL DEFAULT 0.80 CHECK (ai_budget_alert_ratio > 0 AND ai_budget_alert_ratio <= 1),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
INSERT INTO public.platform_settings DEFAULT VALUES ON CONFLICT DO NOTHING;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_settings FROM anon, authenticated;

-- 7. Only active accounts write facilitator data. The app also checks this
--    in proxy.ts, but a signed-in pending account could call the REST API
--    with its own token. Restrictive policies are ANDed with the existing
--    ones, so active teachers and admins keep exactly what they had.
CREATE FUNCTION public.is_active_account()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'active')
$$;
REVOKE EXECUTE ON FUNCTION public.is_active_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_account() TO authenticated, service_role;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['games', 'challenges', 'announcements', 'lesson_plans', 'library_items'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format(
        'CREATE POLICY "Only active accounts insert" ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated '
        'WITH CHECK ((SELECT public.is_active_account()))', t);
      EXECUTE format(
        'CREATE POLICY "Only active accounts update" ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated '
        'USING ((SELECT public.is_active_account()))', t);
      EXECUTE format(
        'CREATE POLICY "Only active accounts delete" ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated '
        'USING ((SELECT public.is_active_account()))', t);
    END IF;
  END LOOP;
END $$;

COMMIT;

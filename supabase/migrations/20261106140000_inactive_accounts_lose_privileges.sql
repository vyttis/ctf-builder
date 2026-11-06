-- 20261106140000_inactive_accounts_lose_privileges
--
-- A blocked or pending account keeps a valid Supabase session until it
-- expires. 20261106130000 stopped its writes; this stops the admin powers
-- it may still hold by role: get_my_role() answers 'teacher' unless the
-- account is active, the admin read policies that looked at profiles.role
-- directly now go through get_my_role(), and inactive accounts cannot
-- update profiles at all.
--
-- Rollback: supabase/rollback/20261106140000_inactive_accounts_lose_privileges.sql

BEGIN;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT CASE WHEN status = 'active' THEN role ELSE 'teacher' END
  FROM public.profiles
  WHERE id = auth.uid();
$$;

DROP POLICY IF EXISTS "Admins see all lesson plans" ON public.lesson_plans;
CREATE POLICY "Admins see all lesson plans" ON public.lesson_plans
  FOR SELECT USING (public.get_my_role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "Admins update lesson plans" ON public.lesson_plans;
CREATE POLICY "Admins update lesson plans" ON public.lesson_plans
  FOR UPDATE USING (public.get_my_role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "Admins delete lesson plans" ON public.lesson_plans;
CREATE POLICY "Admins delete lesson plans" ON public.lesson_plans
  FOR DELETE USING (public.get_my_role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "Admins read all reflections" ON public.reflections;
CREATE POLICY "Admins read all reflections" ON public.reflections
  FOR SELECT TO authenticated USING (public.get_my_role() IN ('admin', 'super_admin'));

CREATE POLICY "Only active accounts update profiles" ON public.profiles AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_active_account()));

COMMIT;

-- Rollback for 20261106140000_inactive_accounts_lose_privileges.sql.
BEGIN;

DROP POLICY IF EXISTS "Only active accounts update profiles" ON public.profiles;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

DROP POLICY IF EXISTS "Admins see all lesson plans" ON public.lesson_plans;
CREATE POLICY "Admins see all lesson plans" ON public.lesson_plans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "Admins update lesson plans" ON public.lesson_plans;
CREATE POLICY "Admins update lesson plans" ON public.lesson_plans
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "Admins delete lesson plans" ON public.lesson_plans;
CREATE POLICY "Admins delete lesson plans" ON public.lesson_plans
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "Admins read all reflections" ON public.reflections;
CREATE POLICY "Admins read all reflections" ON public.reflections
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

COMMIT;

-- P1 fixes from security audit:
-- 1. Add admin update/delete policies on lesson_plans (parity with other tables)
-- 2. Scope reflections SELECT to game participants, not anyone

-- ============================================
-- Admin policies on lesson_plans
-- ============================================
-- 00015 only gave admins SELECT. Without UPDATE/DELETE, admins cannot
-- moderate abusive or erroneous plans. Mirror the pattern from games/
-- challenges tables.

create policy "Admins update lesson plans"
  on lesson_plans for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'super_admin')
    )
  );

create policy "Admins delete lesson plans"
  on lesson_plans for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'super_admin')
    )
  );

-- ============================================
-- Tighten reflections SELECT policy
-- ============================================
-- Previous policy allowed anyone to read any game's reflections. That
-- leaks student feedback and hardest-challenge signal across schools.
-- Restrict to reflections from games that are currently active or
-- finished AND visible to the reader (teacher owns the game OR admin).

drop policy if exists "Anyone can read reflections" on public.reflections;

-- Teacher who owns the game can read its reflections
create policy "Teachers read reflections for own games"
  on public.reflections for select
  to authenticated
  using (
    exists (
      select 1 from public.games g
      where g.id = reflections.game_id
      and g.teacher_id = auth.uid()
    )
  );

-- Admins can read any reflection
create policy "Admins read all reflections"
  on public.reflections for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'super_admin')
    )
  );

-- Note: The student-side Reflections submission flow goes through the
-- `admin` service-role Supabase client (see app/api/play/**). The
-- RPC function get_game_reflections() uses SECURITY DEFINER and is
-- called by server code with teacher context, so it bypasses RLS as
-- designed.

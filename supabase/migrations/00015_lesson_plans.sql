-- Lesson plans: teacher-facing planning objects, separate from games/student activities
create table if not exists lesson_plans (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  subject text not null,
  grade smallint not null check (grade between 1 and 12),
  topic text not null,
  lesson_type text not null check (lesson_type in ('nauja_tema', 'kartojimas', 'vertinimas', 'projektine_veikla')),
  duration smallint not null check (duration between 25 and 90),
  goal text not null default '',
  curriculum_link text not null default '',
  stages jsonb not null default '[]'::jsonb,
  reflection_prompt text not null default '',
  teacher_methodical_note text not null default '',
  status text not null default 'draft' check (status in ('draft', 'saved', 'converted')),
  source_game_id uuid references games(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for teacher queries
create index if not exists idx_lesson_plans_teacher on lesson_plans(teacher_id, created_at desc);

-- RLS
alter table lesson_plans enable row level security;

create policy "Teachers see own lesson plans"
  on lesson_plans for select
  using (auth.uid() = teacher_id);

create policy "Teachers insert own lesson plans"
  on lesson_plans for insert
  with check (auth.uid() = teacher_id);

create policy "Teachers update own lesson plans"
  on lesson_plans for update
  using (auth.uid() = teacher_id);

create policy "Teachers delete own lesson plans"
  on lesson_plans for delete
  using (auth.uid() = teacher_id);

-- Admins can see all
create policy "Admins see all lesson plans"
  on lesson_plans for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'super_admin')
    )
  );

-- Updated_at trigger
create or replace trigger lesson_plans_updated_at
  before update on lesson_plans
  for each row
  execute function update_updated_at();

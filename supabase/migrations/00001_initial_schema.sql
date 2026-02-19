-- CTF Builder initial schema
-- STEAM LT Klaipėda

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  school text,
  role text not null default 'teacher' check (role in ('teacher', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- GAMES
-- ============================================
create table public.games (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  game_code text not null unique,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'finished')),
  settings jsonb not null default '{
    "max_teams": 50,
    "time_limit_minutes": null,
    "show_leaderboard": true,
    "shuffle_challenges": false
  }'::jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_games_game_code on public.games(game_code);
create index idx_games_teacher_id on public.games(teacher_id);

alter table public.games enable row level security;

create policy "Teachers can manage own games"
  on public.games for all
  using (auth.uid() = teacher_id);

create policy "Anyone can read active games"
  on public.games for select
  using (status in ('active', 'finished'));

-- ============================================
-- CHALLENGES
-- ============================================
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  title text not null,
  description text not null default '',
  type text not null default 'text' check (type in ('text', 'multiple_choice', 'number')),
  points integer not null default 100,
  answer_hash text not null,
  hints jsonb not null default '[]'::jsonb,
  options jsonb,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_challenges_game_id on public.challenges(game_id);

alter table public.challenges enable row level security;

create policy "Teachers can manage challenges for own games"
  on public.challenges for all
  using (
    exists (
      select 1 from public.games
      where games.id = challenges.game_id
        and games.teacher_id = auth.uid()
    )
  );

create policy "Anyone can read challenges for active games"
  on public.challenges for select
  using (
    exists (
      select 1 from public.games
      where games.id = challenges.game_id
        and games.status in ('active', 'finished')
    )
  );

-- ============================================
-- TEAMS (player sessions, no auth)
-- ============================================
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  name text not null,
  session_token text not null unique,
  total_points integer not null default 0,
  current_challenge_index integer not null default 0,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(game_id, name)
);

create index idx_teams_game_id on public.teams(game_id);
create index idx_teams_session_token on public.teams(session_token);

alter table public.teams enable row level security;

create policy "Anyone can create teams for active games"
  on public.teams for insert
  with check (
    exists (
      select 1 from public.games
      where games.id = teams.game_id
        and games.status = 'active'
    )
  );

create policy "Anyone can read teams"
  on public.teams for select
  using (true);

create policy "Anyone can update teams"
  on public.teams for update
  using (true);

-- ============================================
-- SUBMISSIONS
-- ============================================
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  answer text not null,
  is_correct boolean not null default false,
  points_awarded integer not null default 0,
  attempted_at timestamptz not null default now()
);

create index idx_submissions_team_id on public.submissions(team_id);
create index idx_submissions_challenge_id on public.submissions(challenge_id);

alter table public.submissions enable row level security;

create policy "Anyone can create submissions"
  on public.submissions for insert
  with check (true);

create policy "Anyone can read submissions"
  on public.submissions for select
  using (true);

-- ============================================
-- TEMPLATES (placeholder for Sprint 2)
-- ============================================
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  subject text,
  grade_level text,
  challenge_count integer not null default 5,
  template_data jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================
-- ANSWER VERIFICATION FUNCTION
-- Server-side only, never exposes answer to client
-- ============================================
create or replace function public.check_answer(
  p_challenge_id uuid,
  p_answer text
) returns boolean as $$
declare
  v_hash text;
begin
  select answer_hash into v_hash
  from public.challenges
  where id = p_challenge_id;

  if v_hash is null then
    return false;
  end if;

  -- Sprint 1: case-insensitive trimmed comparison
  -- Sprint 2: upgrade to bcrypt
  return lower(trim(p_answer)) = v_hash;
end;
$$ language plpgsql security definer;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.games
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.challenges
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.teams
  for each row execute function public.update_updated_at();

-- ============================================
-- REALTIME
-- ============================================
alter publication supabase_realtime add table public.teams;
alter publication supabase_realtime add table public.submissions;

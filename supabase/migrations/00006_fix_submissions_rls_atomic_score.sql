-- Fix submissions RLS: prevent leaking correct answers via the 'answer' column
-- The "Anyone can read submissions" policy with USING(true) exposes all answer text
-- including correct answers, to any anonymous user querying the table directly.

-- Restrict anon role to only see non-sensitive submission columns
revoke select on public.submissions from anon;
grant select (id, team_id, challenge_id, is_correct, points_awarded, attempted_at) on public.submissions to anon;

-- Atomic score update function to prevent race conditions
-- Instead of read-then-write (total_points = old_value + new), this does atomic increment
create or replace function public.increment_team_score(
  p_team_id uuid,
  p_points integer
) returns void as $$
begin
  update public.teams
  set
    total_points = total_points + p_points,
    current_challenge_index = current_challenge_index + 1
  where id = p_team_id;
end;
$$ language plpgsql security definer;

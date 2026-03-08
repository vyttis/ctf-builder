-- Add phone field and onboarding_completed flag to profiles
-- Phone number for teacher contact, onboarding flag to track profile completion

alter table public.profiles
  add column if not exists phone text,
  add column if not exists onboarding_completed boolean not null default false;

-- Mark existing users with full_name as onboarded (they were already using the platform)
update public.profiles
  set onboarding_completed = true
  where full_name is not null and full_name <> '';

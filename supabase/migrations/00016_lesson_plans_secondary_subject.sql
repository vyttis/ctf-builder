-- Add optional secondary subject for integrated (STEAM-style) lessons
alter table lesson_plans
  add column if not exists secondary_subject text null;

alter table lesson_plans
  add constraint lesson_plans_subjects_distinct
  check (secondary_subject is null or secondary_subject <> subject);

create index if not exists idx_lesson_plans_subjects
  on lesson_plans(subject, secondary_subject);

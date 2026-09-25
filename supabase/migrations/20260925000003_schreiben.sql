-- Goethe B2 Schreiben support. See docs/adr/0002-schreiben-exam-content-model.md and 0003-writing-drafts.md.

create type public.writing_task_type as enum ('forum_post', 'formal_email');

alter table public.exercises
  add column task_type      public.writing_task_type not null default 'forum_post',
  add column guiding_points text[] not null default '{}',
  add column recipient      text,
  add constraint exercises_word_range check (min_words is null or max_words is null or min_words <= max_words);

alter table public.writing_submissions
  add column duration_seconds       int check (duration_seconds >= 0),
  add column guiding_points_checked int check (guiding_points_checked >= 0);

-- Redemittel: reusable phrases grouped by category, per task type.
create table public.useful_phrases (
  id        uuid primary key default gen_random_uuid(),
  task_type public.writing_task_type not null,
  category  text not null,
  text      text not null,
  position  int not null,
  unique (task_type, position)
);

-- Work in progress, one per student and exercise. Unlike submissions, drafts are overwritten.
create table public.writing_drafts (
  id          uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  student_id  uuid not null references public.profiles (id) on delete cascade,
  content     text not null check (char_length(content) <= 5000),
  updated_at  timestamptz not null default now(),
  unique (student_id, exercise_id)
);

create function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger writing_drafts_touch_updated_at
  before insert or update on public.writing_drafts
  for each row execute function public.touch_updated_at();

create index on public.writing_drafts (student_id, updated_at desc);

grant select, insert, update, delete on public.useful_phrases, public.writing_drafts to authenticated;

alter table public.useful_phrases enable row level security;
alter table public.writing_drafts enable row level security;

create policy "read phrases" on public.useful_phrases for select to authenticated
  using (true);
create policy "staff manage phrases" on public.useful_phrases for all to authenticated
  using (public.app_current_role() in ('teacher', 'admin'))
  with check (public.app_current_role() in ('teacher', 'admin'));

create policy "student manages own drafts" on public.writing_drafts for all to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid() and public.app_current_role() = 'student');

-- Core schema from docs/ARCHITECTURE.md §7.

create type public.app_role as enum ('student', 'teacher', 'admin');
create type public.cefr_level as enum ('A1', 'A2', 'B1', 'B2');

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  role         public.app_role not null default 'student',
  created_at   timestamptz not null default now()
);

create table public.units (
  id       uuid primary key default gen_random_uuid(),
  level    public.cefr_level not null,
  position int not null,
  title    text not null,
  unique (level, position)
);

create table public.lessons (
  id           uuid primary key default gen_random_uuid(),
  unit_id      uuid not null references public.units (id) on delete cascade,
  position     int not null,
  title        text not null,
  content_md   text not null default '',
  is_published boolean not null default false,
  unique (unit_id, position)
);

create table public.audio_assets (
  id           uuid primary key default gen_random_uuid(),
  lesson_id    uuid not null references public.lessons (id) on delete cascade,
  german_text  text not null,
  translation  text,
  ipa          text,
  storage_path text not null unique
);

create table public.exercises (
  id        uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  prompt    text not null,
  min_words int,
  max_words int
);

create table public.writing_submissions (
  id             uuid primary key default gen_random_uuid(),
  exercise_id    uuid not null references public.exercises (id) on delete cascade,
  student_id     uuid not null references public.profiles (id) on delete cascade,
  attempt_number int not null check (attempt_number > 0),
  content        text not null check (char_length(content) between 1 and 5000),
  created_at     timestamptz not null default now(),
  unique (exercise_id, student_id, attempt_number)
);

create table public.feedback (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.writing_submissions (id) on delete cascade,
  teacher_id    uuid not null references public.profiles (id),
  comment       text not null,
  score         int check (score between 0 and 100),
  created_at    timestamptz not null default now()
);

create index on public.writing_submissions (student_id, created_at desc);
create index on public.writing_submissions (exercise_id);

-- New users are always students; only an admin can promote (never trust a client-sent role).
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', 'Student'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

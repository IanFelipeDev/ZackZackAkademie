-- Row Level Security from docs/ARCHITECTURE.md §9.
-- The helper is named app_current_role() because current_role is a reserved SQL keyword in Postgres.

create function public.app_current_role()
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Explicit grants: RLS decides which rows; anon gets nothing.
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

alter table public.profiles            enable row level security;
alter table public.units               enable row level security;
alter table public.lessons             enable row level security;
alter table public.audio_assets        enable row level security;
alter table public.exercises           enable row level security;
alter table public.writing_submissions enable row level security;
alter table public.feedback            enable row level security;

-- Profiles
create policy "read own profile or staff reads all" on public.profiles for select to authenticated
  using (id = auth.uid() or public.app_current_role() in ('teacher', 'admin'));
create policy "update own display name" on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.app_current_role());
create policy "admin manages roles" on public.profiles for update to authenticated
  using (public.app_current_role() = 'admin');

-- Curriculum: authenticated users read published content, staff manage it.
create policy "read units" on public.units for select to authenticated
  using (true);
create policy "staff manage units" on public.units for all to authenticated
  using (public.app_current_role() in ('teacher', 'admin'))
  with check (public.app_current_role() in ('teacher', 'admin'));

create policy "read published lessons" on public.lessons for select to authenticated
  using (is_published or public.app_current_role() in ('teacher', 'admin'));
create policy "staff manage lessons" on public.lessons for all to authenticated
  using (public.app_current_role() in ('teacher', 'admin'))
  with check (public.app_current_role() in ('teacher', 'admin'));

-- Children of a lesson are visible whenever the lesson itself is (the subquery runs under lessons RLS).
create policy "read audio of visible lessons" on public.audio_assets for select to authenticated
  using (exists (select 1 from public.lessons l where l.id = audio_assets.lesson_id));
create policy "staff manage audio" on public.audio_assets for all to authenticated
  using (public.app_current_role() in ('teacher', 'admin'))
  with check (public.app_current_role() in ('teacher', 'admin'));

create policy "read exercises of visible lessons" on public.exercises for select to authenticated
  using (exists (select 1 from public.lessons l where l.id = exercises.lesson_id));
create policy "staff manage exercises" on public.exercises for all to authenticated
  using (public.app_current_role() in ('teacher', 'admin'))
  with check (public.app_current_role() in ('teacher', 'admin'));

-- Submissions: no update/delete policies, attempts are immutable history.
create policy "student inserts own attempt" on public.writing_submissions for insert to authenticated
  with check (student_id = auth.uid() and public.app_current_role() = 'student');
create policy "student reads own, staff reads all" on public.writing_submissions for select to authenticated
  using (student_id = auth.uid() or public.app_current_role() in ('teacher', 'admin'));

-- Feedback
create policy "staff writes feedback" on public.feedback for insert to authenticated
  with check (teacher_id = auth.uid() and public.app_current_role() in ('teacher', 'admin'));
create policy "student reads feedback on own submissions" on public.feedback for select to authenticated
  using (
    public.app_current_role() in ('teacher', 'admin')
    or exists (
      select 1 from public.writing_submissions s
      where s.id = feedback.submission_id and s.student_id = auth.uid()
    )
  );

-- Security hardening after the first review. See docs/adr/0006-security-hardening.md.

-- 1. The first-access password change is enforced by the database, not only by the UI: until the temporary
--    password is replaced, the account has no role and therefore no permission beyond reading its own profile.
create or replace function public.app_current_role()
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles
  where id = auth.uid() and deactivated_at is null and not must_change_password;
$$;

-- 2. Submissions are history, so the server decides when they happened and which attempt they are.
create function public.stamp_writing_submission()
returns trigger language plpgsql as $$
begin
  new.created_at = now();
  new.attempt_number = coalesce(
    (select max(s.attempt_number) from public.writing_submissions s
     where s.exercise_id = new.exercise_id and s.student_id = new.student_id),
    0
  ) + 1;
  return new;
end;
$$;

create trigger writing_submissions_stamp
  before insert on public.writing_submissions
  for each row execute function public.stamp_writing_submission();

-- 3. Students may only write for exercises they can see (the subquery runs under the exercises/lessons RLS).
drop policy "student inserts own attempt" on public.writing_submissions;
create policy "student inserts own attempt" on public.writing_submissions for insert to authenticated
  with check (
    student_id = auth.uid()
    and public.app_current_role() = 'student'
    and exists (select 1 from public.exercises e where e.id = writing_submissions.exercise_id)
  );

drop policy "student manages own drafts" on public.writing_drafts;
create policy "student manages own drafts" on public.writing_drafts for all to authenticated
  using (student_id = auth.uid())
  with check (
    student_id = auth.uid()
    and public.app_current_role() = 'student'
    and exists (select 1 from public.exercises e where e.id = writing_drafts.exercise_id)
  );

-- 4. Anonymous visitors get no table access at all. Migration 0002 revoked it for the tables that existed then,
--    but Supabase's default privileges grant it again on every new table, so revoke both.
revoke all on all tables in schema public from anon;
alter default privileges for role postgres in schema public revoke all on tables from anon;

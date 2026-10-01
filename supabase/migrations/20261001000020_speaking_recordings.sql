-- Students may record themselves while practising Sprechen, so the teacher can listen before scoring (ADR-0014).
-- Audio lives in a private Storage bucket at `<student id>/<practice id>.<ext>`; the practice row points to it.

-- Set once, when the practice is inserted (practices are never updated, migration 0019). The check ties the path
-- to the practice's own student and id, so a student cannot point a practice at someone else's file.
alter table public.speaking_practices
  add column recording_path text
  check (
    recording_path is null
    or recording_path ~ ('^' || student_id::text || '/' || id::text || '\.(webm|ogg|m4a|mp3)$')
  );

-- 25 MB per file (MAX_RECORDING_BYTES); a 20-minute recording at 32 kbit/s is under 5 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('speaking-recordings', 'speaking-recordings', false, 26214400, array['audio/*'])
on conflict (id) do nothing;

-- Students upload only into their own folder. No update or delete policies: a recording is not replaced by clients,
-- and removing a student's recordings is done with the service role when the account is deleted (manage-user).
create policy "student uploads own speaking recordings" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'speaking-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.app_current_role() = 'student'
  );

create policy "student reads own speaking recordings, staff reads all" on storage.objects for select
  to authenticated
  using (
    bucket_id = 'speaking-recordings'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.app_current_role() in ('teacher', 'admin')
    )
  );

-- Goethe B2 Sprechen: topics, practices recorded by students and scores given by teachers. See
-- docs/adr/0009-sprechen-data-model.md. No audio is stored: the student speaks with the timer (alone or in class)
-- and a teacher assesses the practice afterwards.

-- Teil 1 is a presentation (Vortrag), Teil 2 a discussion (Diskussion).
create type public.speaking_task_type as enum ('presentation', 'discussion');

create table public.speaking_topics (
  id             uuid primary key default gen_random_uuid(),
  level          public.cefr_level not null,
  task_type      public.speaking_task_type not null,
  position       int not null,
  title          text not null,
  prompt         text not null,
  guiding_points text[] not null default '{}',
  is_published   boolean not null default false,
  unique (level, task_type, position)
);

-- One row per time the student practised a topic. History, so never updated or deleted by clients.
create table public.speaking_practices (
  id               uuid primary key default gen_random_uuid(),
  topic_id         uuid not null references public.speaking_topics (id) on delete cascade,
  student_id       uuid not null references public.profiles (id) on delete cascade,
  duration_seconds int not null check (duration_seconds between 0 and 7200),
  created_at       timestamptz not null default now()
);

create index on public.speaking_practices (student_id, created_at desc);
create index on public.speaking_practices (topic_id);

-- A teacher's score for one practice. Like feedback (ADR-0008) it can be revised; updated_at records when.
-- teacher_id has no cascade: deleting a teacher who assessed practices is refused (manage-user).
create table public.speaking_assessments (
  id          uuid primary key default gen_random_uuid(),
  practice_id uuid not null unique references public.speaking_practices (id) on delete cascade,
  teacher_id  uuid not null references public.profiles (id),
  score       int not null check (score between 0 and 100),
  comment     text not null default '' check (char_length(comment) <= 5000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create index on public.speaking_assessments (teacher_id);

-- The server decides when a practice happened and when an assessment was given or revised.
create function public.stamp_created_at()
returns trigger language plpgsql as $$
begin
  new.created_at = now();
  return new;
end;
$$;

-- Unlike touch_updated_at (drafts), this leaves updated_at null on insert: null means "never revised".
create function public.stamp_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger speaking_practices_stamp
  before insert on public.speaking_practices
  for each row execute function public.stamp_created_at();

create trigger speaking_assessments_stamp
  before insert on public.speaking_assessments
  for each row execute function public.stamp_created_at();

create trigger speaking_assessments_stamp_updated_at
  before update on public.speaking_assessments
  for each row execute function public.stamp_updated_at();

-- Grants: RLS decides the rows. Practices are insert-only; assessments may change only score and comment.
grant select, insert, update, delete on public.speaking_topics to authenticated;
grant select, insert on public.speaking_practices to authenticated;
grant select, insert on public.speaking_assessments to authenticated;
grant update (score, comment) on public.speaking_assessments to authenticated;
revoke all on public.speaking_topics, public.speaking_practices, public.speaking_assessments from anon;

alter table public.speaking_topics enable row level security;
alter table public.speaking_practices enable row level security;
alter table public.speaking_assessments enable row level security;

create policy "read published topics, staff reads all" on public.speaking_topics for select to authenticated
  using (is_published or public.app_current_role() in ('teacher', 'admin'));
create policy "staff manages topics" on public.speaking_topics for all to authenticated
  using (public.app_current_role() in ('teacher', 'admin'))
  with check (public.app_current_role() in ('teacher', 'admin'));

-- Students only practise topics they can see (the subquery runs under the topics RLS).
create policy "student records own practice" on public.speaking_practices for insert to authenticated
  with check (
    student_id = auth.uid()
    and public.app_current_role() = 'student'
    and exists (select 1 from public.speaking_topics t where t.id = speaking_practices.topic_id)
  );
create policy "student reads own practices, staff reads all" on public.speaking_practices for select
  to authenticated
  using (student_id = auth.uid() or public.app_current_role() in ('teacher', 'admin'));

create policy "staff assesses practices" on public.speaking_assessments for insert to authenticated
  with check (teacher_id = auth.uid() and public.app_current_role() in ('teacher', 'admin'));
create policy "staff revises assessments" on public.speaking_assessments for update to authenticated
  using (public.app_current_role() in ('teacher', 'admin'))
  with check (public.app_current_role() in ('teacher', 'admin'));
create policy "student reads assessments of own practices, staff reads all" on public.speaking_assessments
  for select to authenticated
  using (
    public.app_current_role() in ('teacher', 'admin')
    or exists (
      select 1 from public.speaking_practices p
      where p.id = speaking_assessments.practice_id and p.student_id = auth.uid()
    )
  );

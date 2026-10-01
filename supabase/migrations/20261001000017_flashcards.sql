-- Vocabulary flashcards (ADR-0013): cards grouped by category and each student's mark per card. A card without
-- a mark is "not done"; the student marks it "known" (Realizado) or "review" (A revisar) and may change the mark.

create table public.flashcards (
  id           uuid primary key default gen_random_uuid(),
  level        public.cefr_level not null,
  -- Mirrors FLASHCARD_CATEGORIES in src/features/flashcards/domain/flashcard.ts.
  category     text not null check (
    category in ('work', 'environment', 'health', 'technology', 'education', 'housing', 'verbs', 'synonyms', 'general')
  ),
  position     int not null,
  term         text not null check (char_length(term) between 1 and 200),
  translation  text not null check (char_length(translation) between 1 and 500),
  synonyms     text[] not null default '{}',
  is_published boolean not null default false,
  unique (level, category, position)
);

-- One row per student and card: the latest mark. Overwritten when the student marks the card again.
create table public.flashcard_marks (
  student_id   uuid not null references public.profiles (id) on delete cascade,
  flashcard_id uuid not null references public.flashcards (id) on delete cascade,
  status       text not null check (status in ('known', 'review')),
  updated_at   timestamptz not null default now(),
  primary key (student_id, flashcard_id)
);

create index on public.flashcard_marks (flashcard_id);

-- The server decides when a card was marked (touch_updated_at comes from the Schreiben migration).
create trigger flashcard_marks_touch_updated_at
  before insert or update on public.flashcard_marks
  for each row execute function public.touch_updated_at();

grant select, insert, update, delete on public.flashcards to authenticated;
-- Marks are changed, never removed: a card goes back to "not done" only when the card itself is deleted.
grant select, insert, update on public.flashcard_marks to authenticated;
revoke all on public.flashcards, public.flashcard_marks from anon;

alter table public.flashcards enable row level security;
alter table public.flashcard_marks enable row level security;

create policy "read published flashcards, staff reads all" on public.flashcards for select to authenticated
  using (is_published or public.app_current_role() in ('teacher', 'admin'));
create policy "staff manages flashcards" on public.flashcards for all to authenticated
  using (public.app_current_role() in ('teacher', 'admin'))
  with check (public.app_current_role() in ('teacher', 'admin'));

-- Students mark only cards they can see (the subquery runs under the flashcards RLS).
create policy "student reads own marks, staff reads all" on public.flashcard_marks for select to authenticated
  using (student_id = auth.uid() or public.app_current_role() in ('teacher', 'admin'));
create policy "student marks visible cards" on public.flashcard_marks for insert to authenticated
  with check (
    student_id = auth.uid()
    and public.app_current_role() = 'student'
    and exists (select 1 from public.flashcards f where f.id = flashcard_marks.flashcard_id)
  );
create policy "student changes own marks" on public.flashcard_marks for update to authenticated
  using (student_id = auth.uid())
  with check (
    student_id = auth.uid()
    and public.app_current_role() = 'student'
    and exists (select 1 from public.flashcards f where f.id = flashcard_marks.flashcard_id)
  );

-- Supabase's default privileges give `authenticated` every privilege on each new table, so the narrower grants in
-- migrations 0010 and 0017 added nothing on their own (same issue 0009 fixed for feedback). Replace the table-wide
-- privileges with what each table is meant to allow; RLS still decides the rows.

-- Assessments: staff may revise only score and comment (ADR-0009), never the author, the practice or the dates.
revoke update on public.speaking_assessments from authenticated;
grant update (score, comment) on public.speaking_assessments to authenticated;
revoke delete, truncate, references, trigger on public.speaking_assessments from authenticated;

-- Practices are history: insert and read only.
revoke update, delete, truncate, references, trigger on public.speaking_practices from authenticated;

-- Flashcard marks are changed, never removed (ADR-0013).
revoke delete, truncate, references, trigger on public.flashcard_marks from authenticated;

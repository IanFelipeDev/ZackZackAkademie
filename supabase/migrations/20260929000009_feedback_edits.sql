-- Teachers can revise feedback after sending it (ADR-0008). A revision overwrites comment and score;
-- updated_at records when, and stays null for feedback that was never edited.

alter table public.feedback add column updated_at timestamptz;

-- Stamped by the server on every update so clients cannot backdate or hide an edit.
create function public.stamp_feedback_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger feedback_stamp_updated_at
  before update on public.feedback
  for each row execute function public.stamp_feedback_updated_at();

-- Only comment and score are editable. A column-level revoke would not override the table-wide grant from
-- migration 0002, so replace it with grants on the editable columns (same approach as profiles in 0005).
revoke update on public.feedback from authenticated;
grant update (comment, score) on public.feedback to authenticated;

-- Any staff member may revise any feedback, not only its author.
create policy "staff updates feedback" on public.feedback for update to authenticated
  using (public.app_current_role() in ('teacher', 'admin'))
  with check (public.app_current_role() in ('teacher', 'admin'));

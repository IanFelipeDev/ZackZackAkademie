# ADR-0008: Teachers can revise feedback

- Status: Accepted
- Date: 2026-09-29

## Context

Feedback was write-once: `feedback` had no update policy and `GiveFeedback` refused a second review. Once sent,
a correction also disappeared from the teacher's view, since `/revisoes` only lists submissions without
feedback. Teachers need to look back at what they corrected and fix a score or add to the comment after talking
to the student.

## Decision

- Staff can revise the **comment and score** of existing feedback. The revision overwrites the previous
  version; there is no version history. `feedback.updated_at` (null until the first edit) is stamped by a
  trigger on the server, and the student sees "atualizado em …".
- Any teacher or admin may revise any feedback, not only its author, so a colleague can take over. The author
  (`teacher_id`), the submission and `created_at` stay immutable: the table-wide update grant is replaced by
  `grant update (comment, score)` (same approach as `profiles` in migration 0005).
- `/revisoes/historico` lists corrected submissions, most recently corrected or revised first. The review page
  of a corrected submission shows the feedback with an "Editar correção" action.
- Revisions go through the same validation as new feedback (`validateFeedbackContent`).

## Consequences

- A student may see a different score than the one they saw before, without the old value; "atualizado em"
  makes the change visible.
- If an audit trail is needed later, a `feedback_revisions` table filled by the same trigger can be added
  without changing the app's write path.

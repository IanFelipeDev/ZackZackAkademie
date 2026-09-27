# ADR-0007: Permanent account deletion by admins

- Status: Accepted
- Date: 2026-09-27
- Amends ADR-0005 ("deactivation instead of deletion").

## Context

ADR-0005 only allowed deactivating accounts. The school also wants to remove accounts for good, e.g. one
created with a wrong email or for someone who never joined, without going through the Supabase dashboard.

## Decision

- `manage-user` gets a `delete` action: `auth.admin.deleteUser`, which cascades to the profile, the person's
  drafts and submissions, and the feedback on those submissions.
- An account that has **given** feedback (`feedback.teacher_id`, no cascade) is not deleted: the function answers
  `409 user_has_reviews` and the app suggests deactivating instead. Those reviews are part of the students'
  history.
- Same guards as the other account actions: admins only, never on their own account (use case and function).
- The app asks for an explicit confirmation stating that the deletion cannot be undone. Deactivation stays the
  recommended, reversible way to cut someone's access.

## Consequences

- Deleted data cannot be recovered; Supabase backups are the only way back.
- The email becomes free again, so the person can be invited anew.
- A full LGPD erasure for teachers (what to do with their reviews) is still open.

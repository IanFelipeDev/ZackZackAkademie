# ADR-0009: Sprechen (speaking) data model

- Status: Accepted
- Date: 2026-09-29

## Context

The second module after Schreiben is Goethe B2 Sprechen: a catalogue of topics for Teil 1 (Vortrag) and Teil 2
(Diskussion), a pending/practised status per topic, a score history per topic and a timer that signals the
stages of the talk. Recording student audio stays out of scope (storage on the free tier, ARCHITECTURE §1), so
the student speaks with the timer, alone or in class, and a teacher gives the score afterwards.

## Decision

- Own tables instead of reusing `exercises`/`lessons`: `exercises` carries writing-only columns (writing
  `task_type`, word range, recipient) and `writing_submissions` requires text content. Mixing both would force
  nullable columns and filters on every writing query.
  - `speaking_topics` (level, `speaking_task_type` `presentation` | `discussion`, position, title, prompt,
    `guiding_points`, `is_published`).
  - `speaking_practices`: one row each time a student finishes the timer (topic, student, duration). Immutable
    history; `created_at` is stamped by the server.
  - `speaking_assessments`: at most one per practice (teacher, score 0–100 required, optional comment).
    Revisable like feedback (ADR-0008): only `score` and `comment` are updatable, `updated_at` is stamped by a
    trigger.
- A topic is **practised** once the student has at least one practice; the status is derived, not stored.
- The stage plan (Teil 1: 0:45 / 2:30 / 0:45, Teil 2: 0:30 / 1:30 / 0:30, 2:30 in total) lives in the domain
  (`speaking-timer.ts`) as a practice aid; it is not an exam rule and needs no table.
- Teachers work at `/avaliacoes-orais` (awaiting / assessed). Deleting an account that gave assessments is
  refused with `user_has_reviews`, like one that gave feedback (ADR-0007).
- Initial content: 10 Teil 1 and 10 Teil 2 topics written for this app (migration `…11`), to be reviewed by
  the teacher.

## Consequences

- A score reflects a talk the teacher heard; the app has no evidence of it besides the duration.
- Staff can add or unpublish topics directly in the table until there is a content editor.
- If audio recording comes later, it can hang off `speaking_practices` (e.g. a `storage_path` column).

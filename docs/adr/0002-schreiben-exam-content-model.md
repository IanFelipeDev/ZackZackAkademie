# ADR-0002: Model Goethe B2 Schreiben tasks on the generic curriculum

- Status: Accepted
- Date: 2026-09-25

## Context

The first module is a trainer for the Goethe-Zertifikat B2 writing exam, ported from a single-file HTML tool.
Each exam topic has a title, a task statement (Aufgabenstellung), four Leitpunkte, a word target and, for Teil 2,
an addressee. Students also use Redemittel (useful phrases) grouped by category. The core schema
(ARCHITECTURE §7) only has `exercises.prompt` and word limits.

## Decision

Map the exam onto the existing hierarchy instead of adding a parallel one:

| Exam concept     | Stored as                                                                              |
| ---------------- | -------------------------------------------------------------------------------------- |
| Level B2         | `units.level = 'B2'`                                                                   |
| Teil 1 / Teil 2  | one unit each ("Schreiben Teil 1 – Forumsbeitrag", "Schreiben Teil 2 – E-Mail formal") |
| Topic (Thema)    | one lesson per topic; `lessons.title` is the topic                                     |
| Aufgabenstellung | `exercises.prompt`                                                                     |
| Leitpunkte       | new `exercises.guiding_points text[]`                                                  |
| Teil type        | new enum `exercises.task_type` (`forum_post`, `formal_email`)                          |
| Addressee        | new `exercises.recipient`                                                              |
| Word target      | existing `min_words` / `max_words` (150–180 and 100–120)                               |
| Redemittel       | new table `useful_phrases` (task type, category, text, position)                       |

Submissions also record `duration_seconds` (exam timer) and `guiding_points_checked` (the student's own checklist).

The 40 topics and the Redemittel ship as a migration (`…_schreiben_b2_content.sql`), not as `seed.sql`,
because `supabase db push` does not run the seed on the hosted project. IDs are deterministic
(`md5(key)::uuid`), so the insert is idempotent.

## Consequences

- Future levels and modules reuse units/lessons/exercises without schema changes.
- Exam-code pairs from the mockup ("Simulado #B2-04") are not modeled yet.
- AI correction from the original HTML tool is out of scope for the MVP; teachers review submissions instead.

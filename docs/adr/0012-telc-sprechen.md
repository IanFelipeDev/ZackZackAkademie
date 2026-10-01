# ADR-0012: telc Sprechen (Mündlicher Ausdruck) next to Goethe

- Status: Accepted
- Date: 2026-09-30

## Context

The teacher's site plan ("SITE - ZACK ZACK", 2026-09-30) marks the telc B2 oral exam (Mündlicher Ausdruck) as
urgent: the Sprechen module should cover Goethe **and** telc. telc has three parts of about 5 minutes each, after 20
minutes of preparation:

- Teil 1 Über Erfahrungen sprechen: each partner reports on an experience for about 1:30 (Stichpunkte in brackets
  as hints), then answers 1–2 questions from the partner (Nachfragen); then the roles swap.
- Teil 2 Diskussion: both read a short text and discuss it, sharing the talking time.
- Teil 3 Gemeinsam etwas planen: the pair plans something together and decides on fixed points (when, where,
  food, costs, who does what).

## Decision

- One more dimension on `speaking_topics` instead of new tables: `exam` (`speaking_exam`: `goethe` | `telc`,
  default `goethe` so existing topics stay Goethe), `source_text` (telc Teil 2) and `follow_up_questions`
  (telc Teil 1 Nachfragen). Practices and assessments are unchanged, so history, scoring and the dashboard work for
  both exams.
- `speaking_task_type` gains `experience` (telc Teil 1) and `planning` (telc Teil 3); `discussion` is Teil 2 in both
  exams. A check constraint allows only each exam's parts; positions are unique per exam, level and part. The enum
  values get their own migration (`…14`) because Postgres cannot use a new enum value in the transaction that adds it.
- Timing lives in the domain (`stagePlanFor(exam, taskType)`): telc Teil 1 is report 1:30 / partner's questions
  1:00 / partner's report 1:30 / own questions 1:00; telc Teil 2 and 3 are 1:00 / 3:00 / 1:00; the preparation is
  one 20-minute stage. As for Goethe, the split is a practice aid, not an exam rule.
- Practice aids are UI only, nothing is stored: the minimum report time (1:30) in Teil 1, a "who is talking" tracker
  in Teil 2 (balanced = each partner 40–60 %), and checklists in the timer (report structure Einleitung →
  Hauptinhalt → Persönliches Beispiel → Fazit & Fragen in Teil 1, the points to decide in Teil 3).
- The official telc instructions shared by all topics of a part are app text (`task-card.tsx`), like the Goethe
  discussion steps.
- The catalogue URL names the exam and part: `/sprechen?prova=telc&teil=3`; Goethe stays the default without `prova`.
- Content (migration `…16`): the teacher's seven Teil 1 topics with their Stichpunkte. She keeps the Nachfragen,
  the Teil 2 texts and the Teil 3 tasks in a separate list ("aba TELC") that was not part of the plan, so starting
  content was written for this app; when her list arrives it replaces it the way `…13` replaced the Goethe
  placeholders (unpublish, do not delete).

## Consequences

- Teachers score telc practices on the same 0–100 scale. The official telc rubric (four criteria per part,
  0–25 points per part, 0–75 for the exam, pass at 45) needs its own assessment shape and is left for later,
  together with the full mock exam (Teil 1 → 2 → 3 with random topics and no pause) and audio recording.
- Every query by exam part must filter by exam as well, since `discussion` exists in both exams.

# Glossary

Names are identical in code, database and docs. The UI is Portuguese, so the pt-BR label is listed too.

| Term                 | Meaning                                                           | Code / DB                                  | UI (pt-BR)                       |
| -------------------- | ----------------------------------------------------------------- | ------------------------------------------ | -------------------------------- |
| Level                | CEFR level A1–B2                                                  | `CefrLevel`, `cefr_level`                  | Nível                            |
| Unit                 | Thematic group of lessons inside a level                          | `units`                                    | —                                |
| Lesson               | Smallest teaching unit; for Schreiben, one exam topic             | `lessons`                                  | Tema                             |
| Exercise             | A writing prompt the student answers                              | `WritingExercise`, `exercises`             | Tema do simulado                 |
| Task type            | Exam part: Teil 1 forum post or Teil 2 formal email               | `WritingTaskType`, `task_type`             | Teil 1 / Teil 2                  |
| Aufgabenstellung     | Task statement of an exercise                                     | `prompt`                                   | Enunciado                        |
| Leitpunkte           | Guiding points the text must cover                                | `guidingPoints`, `guiding_points`          | Leitpunkte                       |
| Redemittel           | Useful phrases grouped by category                                | `UsefulPhrase`, `useful_phrases`           | Redemittel / frases úteis        |
| Submission / Attempt | One answer to an exercise; never overwritten                      | `WritingSubmission`, `writing_submissions` | Tentativa / texto enviado        |
| Draft                | Work in progress for one exercise; overwritten on save            | `WritingDraft`, `writing_drafts`           | Rascunho                         |
| Feedback             | Teacher's review of a submission (comment + optional score 0–100) | `Feedback`, `feedback`                     | Correção / comentário da Melissa |
| Review history       | Submissions that already have feedback; staff can revise it       | `ReviewedSubmission`, `listReviewed`       | Histórico de correções           |
| Staff                | Teachers and admins                                               | `isStaff()`                                | Professora                       |

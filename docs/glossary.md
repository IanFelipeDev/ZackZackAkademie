# Glossary

Names are identical in code, database and docs. The UI is Portuguese, so the pt-BR label is listed too.

| Term                  | Meaning                                                                  | Code / DB                                    | UI (pt-BR)                               |
| --------------------- | ------------------------------------------------------------------------ | -------------------------------------------- | ---------------------------------------- |
| Level                 | CEFR level A1–B2                                                         | `CefrLevel`, `cefr_level`                    | Nível                                    |
| Unit                  | Thematic group of lessons inside a level                                 | `units`                                      | —                                        |
| Lesson                | Smallest teaching unit; for Schreiben, one exam topic                    | `lessons`                                    | Tema                                     |
| Exercise              | A writing prompt the student answers                                     | `WritingExercise`, `exercises`               | Tema do simulado                         |
| Task type             | Exam part: Teil 1 forum post or Teil 2 formal email                      | `WritingTaskType`, `task_type`               | Teil 1 / Teil 2                          |
| Aufgabenstellung      | Task statement of an exercise                                            | `prompt`                                     | Enunciado                                |
| Leitpunkte            | Guiding points the text must cover                                       | `guidingPoints`, `guiding_points`            | Leitpunkte                               |
| Redemittel            | Useful phrases grouped by category                                       | `UsefulPhrase`, `useful_phrases`             | Redemittel / frases úteis                |
| Submission / Attempt  | One answer to an exercise; never overwritten                             | `WritingSubmission`, `writing_submissions`   | Tentativa / texto enviado                |
| Draft                 | Work in progress for one exercise; overwritten on save                   | `WritingDraft`, `writing_drafts`             | Rascunho                                 |
| Feedback              | Teacher's review of a submission (comment + optional score 0–100)        | `Feedback`, `feedback`                       | Correção / comentário da Melissa         |
| Review history        | Submissions that already have feedback; staff can revise it              | `ReviewedSubmission`, `listReviewed`         | Histórico de correções                   |
| Speaking topic        | A Sprechen exam topic (prompt + guiding points)                          | `SpeakingTopic`, `speaking_topics`           | Tema                                     |
| Speaking task type    | Exam part: Teil 1 presentation (Vortrag) or Teil 2 discussion            | `SpeakingTaskType`, `speaking_task_type`     | Teil 1 / Teil 2                          |
| Practice              | One timed talk on a topic; never overwritten                             | `SpeakingPractice`, `speaking_practices`     | Prática                                  |
| Topic status          | Pending until the student has a practice, then practised                 | `TopicStatus`, `topicStatus()`               | Pendente / Já praticado                  |
| Stage                 | Part of the talk signalled by the timer                                  | `SpeakingStage`, `SPEAKING_STAGE_PLANS`      | Introdução / Desenvolvimento / Conclusão |
| Performance dashboard | Student home with progress per skill (Schreiben, Lesen, Hören, Sprechen) | `DashboardPage`, `/painel`                   | Painel de desempenho                     |
| Presence              | Last activity reported by the app; online = within 5 minutes             | `user_presence`, `isOnline()`                | Online agora / Último acesso             |
| Assessment            | Teacher's score (0–100) and optional comment on a practice               | `SpeakingAssessment`, `speaking_assessments` | Avaliação oral                           |
| Staff                 | Teachers and admins                                                      | `isStaff()`                                  | Professora                               |

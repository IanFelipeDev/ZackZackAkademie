# ADR-0013: Vocabulary flashcards

- Status: Accepted
- Date: 2026-10-01

## Context

The teacher's site plan ("SITE - ZACK ZACK", section 3.6) asks for a flashcard module in the student portal:
cards organised by topic and category, with status markers "Não feito", "Realizado" and "A revisar". She sent her
cards as a standalone page (`goethe_b2_flashcards_completo.html`): 810 cards in nine categories, each with a German
term, a Portuguese translation, an emoji and an example sentence; the 49 cards of the "Sinônimos & Paráfrases"
category also list German synonyms. Progress in that page lived only in memory and was lost on reload.

## Decision

- New feature `flashcards` with two tables. `flashcards` holds the content like `speaking_topics` does (level,
  category, position, `is_published`, staff manage it, students read published cards). `flashcard_marks` holds one
  row per student and card with the latest mark (`known` | `review`); a card without a row is "not done". Students
  upsert their own marks for cards they can see; marks are never deleted by clients, and `updated_at` is stamped
  by the server. Staff can read marks, for a future progress view.
- Categories are a check constraint mirrored by `FLASHCARD_CATEGORIES`, not an enum, so a category can be added
  without the separate-migration dance enum values need (ADR-0012).
- Content (migration `…18`) is imported from the teacher's file with deterministic ids. The example sentences are
  dropped: all 810 were generated placeholders ("„X“ ist ein wichtiger Begriff in diesem Zusammenhang."), not real
  usage. The emojis are dropped too; each category has a Material Symbol instead, as in the rest of the app.
  Synonyms become a `text[]`.
- The page (`/flashcards`) loads every card with the student's statuses at once (810 rows; the adapter pages past
  PostgREST's 1000-row limit), filters by category and status in the browser and saves each mark optimistically.
  A pass through the deck keeps its order while the student marks cards, so a card does not vanish from a "Não
  feitos" pass the moment it is marked.

## Consequences

- The student nav has five items; the header hides the user's name between `md` and `xl` so they fit.
- No spaced repetition yet: "A revisar" is a filter the student chooses, not a schedule. Example sentences,
  teacher editing in the app and a flashcards card on the dashboard can come later.

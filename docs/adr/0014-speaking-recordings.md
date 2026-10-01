# ADR-0014: Sprechen recordings for the teacher

- Status: Accepted
- Date: 2026-10-01

## Context

Teachers score Sprechen practices (ADR-0009) without hearing them: the student practises alone or in class and
only the duration is recorded. The teacher's site plan asks for an audio recorder so she can listen before
scoring (the timeline with per-second comments is a later step). She offered it as a suggestion.

## Decision

- Recording is opt-in per practice: the timer dialog offers "Gravar minha fala" before the timer starts. The
  recording follows the stopwatch (starts, pauses, resumes and restarts with it) and is uploaded when the student
  finishes. The preparation timer never records. Recorded at 32 kbit/s (about 1.2 MB for 5 minutes), capped at
  20 minutes and 25 MB.
- Audio lives in the private Storage bucket `speaking-recordings` at `<student id>/<practice id>.<ext>`.
  Storage policies: students insert only into their own folder; the student and staff can read; nobody updates
  or deletes through the API. Playback uses signed URLs valid for one hour, fetched only when someone presses
  play (the student) or opens the practice (the teacher). The CSP allows `media-src https://*.supabase.co`.
- `speaking_practices.recording_path` (migration 0020) is set when the practice is inserted; a check constraint
  ties it to the practice's own student and id. The upload happens first: if it fails, the practice is saved
  without a recording and the student is told, so a practice is never lost because of the audio. A practice
  insert that fails after a successful upload leaves an orphan file, accepted as rare.
- Deleting an account (`manage-user`) removes the user's recordings with the service role before deleting the
  user; if that fails the account is kept and the admin can retry.
- `useAudioRecorder` in `shared/ui` serves both this and the flashcard pronunciation (which never uploads).

## Consequences

- The free Supabase plan's 1 GB holds roughly 800 five-minute recordings. If that becomes tight: delete
  recordings of assessed practices after a period, or move to a paid plan.
- Teacher comments at a point in the recording, peer review and the telc 0–75 rubric remain open.

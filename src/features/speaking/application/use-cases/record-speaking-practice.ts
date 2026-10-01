import { SpeakingPractice, type SpeakingPracticeProps } from '../../domain/speaking-practice';
import { baseMimeType, recordingPathFor } from '../../domain/speaking-recording';
import type { SpeakingPracticeRepository } from '../ports/speaking-practice-repository';
import type { SpeakingRecordingStorage } from '../ports/speaking-recording-storage';

export interface RecordSpeakingPracticeInput extends SpeakingPracticeProps {
  /** What the student recorded during the practice, if they chose to record. */
  readonly recording?: { readonly data: Blob; readonly mimeType: string } | null;
}

/** "none": nothing was recorded; "failed": the practice was saved, but its recording could not be. */
export type RecordingOutcome = 'none' | 'saved' | 'failed';

export interface RecordedPractice {
  readonly practice: SpeakingPractice;
  readonly recording: RecordingOutcome;
}

/**
 * Records that a student practised a topic, which marks the topic as practised and puts the practice in the
 * teachers' assessment queue. A recording is uploaded first; if that fails the practice is still saved without it,
 * so the student never loses the practice itself.
 *
 * @throws {InvalidPracticeDurationError} when the duration is out of range
 */
export class RecordSpeakingPractice {
  constructor(
    private readonly practices: SpeakingPracticeRepository,
    private readonly recordings: SpeakingRecordingStorage,
  ) {}

  async execute({ recording, ...input }: RecordSpeakingPracticeInput): Promise<RecordedPractice> {
    let practice = SpeakingPractice.create(input);
    let outcome: RecordingOutcome = 'none';
    if (recording) {
      outcome = 'failed';
      const path = recordingPathFor(practice.studentId, practice.id, recording.mimeType, recording.data.size);
      if (path) {
        try {
          await this.recordings.upload(path, recording.data, baseMimeType(recording.mimeType));
          practice = practice.withRecording(path);
          outcome = 'saved';
        } catch {
          // Keep the practice; the student is told the recording did not go through.
        }
      }
    }
    await this.practices.save(practice);
    return { practice, recording: outcome };
  }
}

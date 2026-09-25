import { WritingSubmission } from '../../domain/writing-submission';
import type { DraftRepository } from '../ports/draft-repository';
import type { SubmissionRepository } from '../ports/submission-repository';

export interface SubmitWritingInput {
  readonly exerciseId: string;
  readonly studentId: string;
  readonly content: string;
  readonly durationSeconds: number | null;
  readonly guidingPointsChecked: number | null;
}

/**
 * Stores a new writing attempt for a student and discards the draft it came from.
 * Attempts are immutable; each call creates the next attempt number.
 *
 * @throws {EmptySubmissionError} when content is blank
 * @throws {SubmissionTooLongError} when content exceeds WritingSubmission.MAX_LENGTH
 */
export class SubmitWritingAttempt {
  constructor(
    private readonly submissions: SubmissionRepository,
    private readonly drafts: DraftRepository,
  ) {}

  async execute(input: SubmitWritingInput): Promise<WritingSubmission> {
    const previous = await this.submissions.countAttempts(input.exerciseId, input.studentId);
    const submission = WritingSubmission.create({ ...input, attemptNumber: previous + 1 });
    await this.submissions.save(submission);
    await this.drafts.delete(input.exerciseId, input.studentId);
    return submission;
  }
}

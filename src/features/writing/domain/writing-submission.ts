import { EmptySubmissionError, InvalidAttemptNumberError, SubmissionTooLongError } from './errors';

export interface WritingSubmissionProps {
  readonly exerciseId: string;
  readonly studentId: string;
  readonly content: string;
  readonly attemptNumber: number;
  readonly durationSeconds: number | null;
  readonly guidingPointsChecked: number | null;
}

/** One answer to an exercise. Attempts are never overwritten; each one gets the next attempt number. */
export class WritingSubmission {
  static readonly MAX_LENGTH = 5000;

  private constructor(
    readonly id: string,
    readonly exerciseId: string,
    readonly studentId: string,
    readonly content: string,
    readonly attemptNumber: number,
    readonly durationSeconds: number | null,
    readonly guidingPointsChecked: number | null,
    readonly createdAt: Date,
  ) {}

  /**
   * @throws {EmptySubmissionError} when content is blank
   * @throws {SubmissionTooLongError} when content exceeds MAX_LENGTH
   * @throws {InvalidAttemptNumberError} when attemptNumber is below 1
   */
  static create(props: WritingSubmissionProps): WritingSubmission {
    const content = props.content.trim();
    if (content.length === 0) throw new EmptySubmissionError();
    if (content.length > WritingSubmission.MAX_LENGTH) {
      throw new SubmissionTooLongError(WritingSubmission.MAX_LENGTH);
    }
    if (!Number.isInteger(props.attemptNumber) || props.attemptNumber < 1) {
      throw new InvalidAttemptNumberError();
    }
    return new WritingSubmission(
      crypto.randomUUID(),
      props.exerciseId,
      props.studentId,
      content,
      props.attemptNumber,
      normalizeCounter(props.durationSeconds),
      normalizeCounter(props.guidingPointsChecked),
      new Date(),
    );
  }
}

function normalizeCounter(value: number | null): number | null {
  if (value === null || !Number.isFinite(value) || value < 0) return null;
  return Math.floor(value);
}

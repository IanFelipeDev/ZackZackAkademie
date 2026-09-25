import { EmptyFeedbackError, FeedbackTooLongError, InvalidScoreError } from './errors';

export const MIN_SCORE = 0;
export const MAX_SCORE = 100;
export const MAX_COMMENT_LENGTH = 5000;

export interface FeedbackProps {
  readonly submissionId: string;
  readonly teacherId: string;
  readonly comment: string;
  readonly score: number | null;
}

/** A teacher's review of one submission. A submission has at most one feedback. */
export class Feedback {
  private constructor(
    readonly id: string,
    readonly submissionId: string,
    readonly teacherId: string,
    readonly comment: string,
    readonly score: number | null,
    readonly createdAt: Date,
  ) {}

  /**
   * @throws {EmptyFeedbackError} when the comment is blank
   * @throws {FeedbackTooLongError} when the comment exceeds MAX_COMMENT_LENGTH
   * @throws {InvalidScoreError} when the score is not an integer between MIN_SCORE and MAX_SCORE
   */
  static create(props: FeedbackProps): Feedback {
    const comment = props.comment.trim();
    if (comment.length === 0) throw new EmptyFeedbackError();
    if (comment.length > MAX_COMMENT_LENGTH) throw new FeedbackTooLongError(MAX_COMMENT_LENGTH);
    if (props.score !== null && !isValidScore(props.score)) throw new InvalidScoreError();
    return new Feedback(
      crypto.randomUUID(),
      props.submissionId,
      props.teacherId,
      comment,
      props.score,
      new Date(),
    );
  }
}

function isValidScore(score: number): boolean {
  return Number.isInteger(score) && score >= MIN_SCORE && score <= MAX_SCORE;
}

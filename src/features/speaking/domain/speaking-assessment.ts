import { AssessmentCommentTooLongError, InvalidSpeakingScoreError } from './errors';

export const MIN_SPEAKING_SCORE = 0;
export const MAX_SPEAKING_SCORE = 100;
export const MAX_ASSESSMENT_COMMENT_LENGTH = 5000;

/** The part of an assessment a teacher can revise. */
export interface AssessmentContent {
  readonly score: number;
  /** Optional; empty when the teacher only gives a score. */
  readonly comment: string;
}

export interface SpeakingAssessmentProps extends AssessmentContent {
  readonly practiceId: string;
  readonly teacherId: string;
}

/** A teacher's score for one speaking practice. A practice has at most one assessment, which staff may revise. */
export class SpeakingAssessment {
  private constructor(
    readonly id: string,
    readonly practiceId: string,
    readonly teacherId: string,
    readonly score: number,
    readonly comment: string,
    readonly createdAt: Date,
  ) {}

  /**
   * @throws {InvalidSpeakingScoreError} when the score is not an integer between 0 and 100
   * @throws {AssessmentCommentTooLongError} when the comment exceeds MAX_ASSESSMENT_COMMENT_LENGTH
   */
  static create(props: SpeakingAssessmentProps): SpeakingAssessment {
    const { score, comment } = validateAssessmentContent(props);
    return new SpeakingAssessment(
      crypto.randomUUID(),
      props.practiceId,
      props.teacherId,
      score,
      comment,
      new Date(),
    );
  }
}

/**
 * Rules shared by new and revised assessments; returns the content with a trimmed comment.
 *
 * @throws {InvalidSpeakingScoreError} when the score is not an integer between 0 and 100
 * @throws {AssessmentCommentTooLongError} when the comment exceeds MAX_ASSESSMENT_COMMENT_LENGTH
 */
export function validateAssessmentContent(content: AssessmentContent): AssessmentContent {
  const { score } = content;
  if (!Number.isInteger(score) || score < MIN_SPEAKING_SCORE || score > MAX_SPEAKING_SCORE) {
    throw new InvalidSpeakingScoreError();
  }
  const comment = content.comment.trim();
  if (comment.length > MAX_ASSESSMENT_COMMENT_LENGTH) {
    throw new AssessmentCommentTooLongError(MAX_ASSESSMENT_COMMENT_LENGTH);
  }
  return { score, comment };
}

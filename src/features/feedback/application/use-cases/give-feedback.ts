import { Feedback, type FeedbackProps } from '../../domain/feedback';
import { SubmissionAlreadyReviewedError } from '../../domain/errors';
import type { ReviewRepository } from '../ports/review-repository';

/**
 * Records a teacher's review. Each submission gets at most one feedback.
 *
 * @throws {EmptyFeedbackError} when the comment is blank
 * @throws {InvalidScoreError} when the score is outside 0–100
 * @throws {SubmissionAlreadyReviewedError} when the submission was already reviewed
 */
export class GiveFeedback {
  constructor(private readonly reviews: ReviewRepository) {}

  async execute(input: FeedbackProps): Promise<Feedback> {
    const feedback = Feedback.create(input);
    const submission = await this.reviews.findForReview(input.submissionId);
    if (submission?.feedback) throw new SubmissionAlreadyReviewedError(input.submissionId);
    await this.reviews.saveFeedback(feedback);
    return feedback;
  }
}

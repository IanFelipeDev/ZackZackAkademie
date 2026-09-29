import { FeedbackNotFoundError } from '../../domain/errors';
import { validateFeedbackContent, type FeedbackContent } from '../../domain/feedback';
import type { ReviewRepository } from '../ports/review-repository';

export interface UpdateFeedbackInput extends FeedbackContent {
  readonly submissionId: string;
}

/**
 * Revises the comment and score of feedback that was already sent. The new version replaces the old one.
 *
 * @throws {EmptyFeedbackError} when the comment is blank
 * @throws {InvalidScoreError} when the score is outside 0–100
 * @throws {FeedbackNotFoundError} when the submission has no feedback yet
 */
export class UpdateFeedback {
  constructor(private readonly reviews: ReviewRepository) {}

  async execute({ submissionId, ...input }: UpdateFeedbackInput): Promise<void> {
    const content = validateFeedbackContent(input);
    const submission = await this.reviews.findForReview(submissionId);
    if (!submission?.feedback) throw new FeedbackNotFoundError(submissionId);
    await this.reviews.updateFeedback(submissionId, content);
  }
}

import { ReviewSubmissionNotFoundError } from '../../domain/errors';
import type { ReviewRepository } from '../ports/review-repository';
import type { SubmissionForReview } from '../read-models';

export class GetSubmissionForReview {
  constructor(private readonly reviews: ReviewRepository) {}

  /** @throws {ReviewSubmissionNotFoundError} when missing or not visible to the current user */
  async execute(submissionId: string): Promise<SubmissionForReview> {
    const submission = await this.reviews.findForReview(submissionId);
    if (!submission) throw new ReviewSubmissionNotFoundError(submissionId);
    return submission;
  }
}

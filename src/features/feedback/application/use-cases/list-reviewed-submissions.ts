import type { ReviewRepository } from '../ports/review-repository';
import type { ReviewedSubmission } from '../read-models';

function lastTouched(submission: ReviewedSubmission): number {
  return (submission.feedback.updatedAt ?? submission.feedback.createdAt).getTime();
}

export class ListReviewedSubmissions {
  constructor(private readonly reviews: ReviewRepository) {}

  /** Review history, most recently corrected or revised first. */
  async execute(): Promise<ReviewedSubmission[]> {
    const reviewed = await this.reviews.listReviewed();
    return [...reviewed].sort((a, b) => lastTouched(b) - lastTouched(a));
  }
}

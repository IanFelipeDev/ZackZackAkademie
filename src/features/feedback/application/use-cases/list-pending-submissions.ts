import type { ReviewRepository } from '../ports/review-repository';
import type { PendingSubmission } from '../read-models';

export class ListPendingSubmissions {
  constructor(private readonly reviews: ReviewRepository) {}

  execute(): Promise<PendingSubmission[]> {
    return this.reviews.listPending();
  }
}

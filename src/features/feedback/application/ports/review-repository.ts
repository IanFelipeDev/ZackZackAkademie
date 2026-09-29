import type { Feedback, FeedbackContent } from '../../domain/feedback';
import type { PendingSubmission, ReviewedSubmission, SubmissionForReview } from '../read-models';

export interface ReviewRepository {
  /** Submissions without feedback, oldest first so nobody waits forever. */
  listPending(): Promise<PendingSubmission[]>;
  /** Submissions that already have feedback, in no particular order. */
  listReviewed(): Promise<ReviewedSubmission[]>;
  findForReview(submissionId: string): Promise<SubmissionForReview | null>;
  /** @throws {SubmissionAlreadyReviewedError} when the submission already has feedback */
  saveFeedback(feedback: Feedback): Promise<void>;
  /** @throws {FeedbackNotFoundError} when the submission has no feedback yet (or is not visible) */
  updateFeedback(submissionId: string, content: FeedbackContent): Promise<void>;
}

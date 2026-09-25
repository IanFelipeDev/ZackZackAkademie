import type { Feedback } from '../../domain/feedback';
import type { PendingSubmission, SubmissionForReview } from '../read-models';

export interface ReviewRepository {
  /** Submissions without feedback, oldest first so nobody waits forever. */
  listPending(): Promise<PendingSubmission[]>;
  findForReview(submissionId: string): Promise<SubmissionForReview | null>;
  /** @throws {SubmissionAlreadyReviewedError} when the submission already has feedback */
  saveFeedback(feedback: Feedback): Promise<void>;
}

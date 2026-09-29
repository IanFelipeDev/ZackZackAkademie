import { FeedbackNotFoundError } from '../../domain/errors';
import type { Feedback, FeedbackContent } from '../../domain/feedback';
import type { ReviewRepository } from '../ports/review-repository';
import type { PendingSubmission, ReviewedSubmission, SubmissionForReview } from '../read-models';

export class InMemoryReviewRepository implements ReviewRepository {
  readonly submissions: SubmissionForReview[] = [];
  readonly saved: Feedback[] = [];
  /** Name shown as the author of feedback saved through this repository. */
  teacherName = 'Melissa';

  listPending(): Promise<PendingSubmission[]> {
    return Promise.resolve(
      this.submissions
        .filter((s) => s.feedback === null)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    );
  }

  listReviewed(): Promise<ReviewedSubmission[]> {
    return Promise.resolve(
      this.submissions.flatMap(({ feedback, ...submission }) =>
        feedback ? [{ ...submission, feedback }] : [],
      ),
    );
  }

  findForReview(submissionId: string): Promise<SubmissionForReview | null> {
    return Promise.resolve(this.submissions.find((s) => s.id === submissionId) ?? null);
  }

  saveFeedback(feedback: Feedback): Promise<void> {
    this.saved.push(feedback);
    const index = this.submissions.findIndex((s) => s.id === feedback.submissionId);
    const submission = this.submissions[index];
    if (submission) {
      this.submissions[index] = {
        ...submission,
        feedback: {
          comment: feedback.comment,
          score: feedback.score,
          teacherName: this.teacherName,
          createdAt: feedback.createdAt,
          updatedAt: null,
        },
      };
    }
    return Promise.resolve();
  }

  updateFeedback(submissionId: string, content: FeedbackContent): Promise<void> {
    const index = this.submissions.findIndex((s) => s.id === submissionId);
    const submission = this.submissions[index];
    if (!submission?.feedback) return Promise.reject(new FeedbackNotFoundError(submissionId));
    this.submissions[index] = {
      ...submission,
      feedback: { ...submission.feedback, ...content, updatedAt: new Date() },
    };
    return Promise.resolve();
  }
}

export function buildSubmissionForReview(overrides: Partial<SubmissionForReview> = {}): SubmissionForReview {
  return {
    id: 'submission-1',
    studentName: 'Ana',
    exerciseTitle: 'Konsumverhalten',
    taskType: 'forum_post',
    attemptNumber: 1,
    wordCount: 3,
    createdAt: new Date('2026-09-01T10:00:00Z'),
    content: 'Ich finde das gut.',
    prompt: 'Sie schreiben einen Forumsbeitrag zum Thema „Konsumverhalten".',
    guidingPoints: ['Meinung äußern'],
    recipient: null,
    minWords: 150,
    maxWords: 180,
    durationSeconds: 900,
    guidingPointsChecked: 1,
    feedback: null,
    ...overrides,
  };
}

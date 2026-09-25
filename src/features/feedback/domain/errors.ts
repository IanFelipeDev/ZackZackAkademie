import { DomainError } from '@/shared/domain';

export class EmptyFeedbackError extends DomainError {
  readonly code = 'empty_feedback';

  constructor() {
    super('Feedback needs a comment');
  }
}

export class FeedbackTooLongError extends DomainError {
  readonly code = 'feedback_too_long';

  constructor(readonly maxLength: number) {
    super(`Feedback cannot exceed ${maxLength} characters`);
  }
}

export class InvalidScoreError extends DomainError {
  readonly code = 'invalid_score';

  constructor() {
    super('Score must be a whole number between 0 and 100');
  }
}

export class SubmissionAlreadyReviewedError extends DomainError {
  readonly code = 'submission_already_reviewed';

  constructor(readonly submissionId: string) {
    super(`Submission ${submissionId} already has feedback`);
  }
}

export class ReviewSubmissionNotFoundError extends DomainError {
  readonly code = 'review_submission_not_found';

  constructor(readonly submissionId: string) {
    super(`Submission ${submissionId} was not found`);
  }
}

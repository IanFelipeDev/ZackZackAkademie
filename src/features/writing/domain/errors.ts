import { DomainError } from '@/shared/domain';

export class EmptySubmissionError extends DomainError {
  readonly code = 'empty_submission';

  constructor() {
    super('A submission cannot be empty');
  }
}

export class SubmissionTooLongError extends DomainError {
  readonly code = 'submission_too_long';

  constructor(readonly maxLength: number) {
    super(`A submission cannot exceed ${maxLength} characters`);
  }
}

export class DraftTooLongError extends DomainError {
  readonly code = 'draft_too_long';

  constructor(readonly maxLength: number) {
    super(`A draft cannot exceed ${maxLength} characters`);
  }
}

export class InvalidAttemptNumberError extends DomainError {
  readonly code = 'invalid_attempt_number';

  constructor() {
    super('Attempt numbers start at 1');
  }
}

export class ExerciseNotFoundError extends DomainError {
  readonly code = 'exercise_not_found';

  constructor(readonly exerciseId: string) {
    super(`Exercise ${exerciseId} was not found`);
  }
}

export class SubmissionNotFoundError extends DomainError {
  readonly code = 'submission_not_found';

  constructor(readonly submissionId: string) {
    super(`Submission ${submissionId} was not found`);
  }
}

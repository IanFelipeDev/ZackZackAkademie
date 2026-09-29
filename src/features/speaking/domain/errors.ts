import { DomainError } from '@/shared/domain';

export class InvalidPracticeDurationError extends DomainError {
  readonly code = 'invalid_practice_duration';

  constructor(readonly maxSeconds: number) {
    super(`A practice lasts between 0 and ${maxSeconds} whole seconds`);
  }
}

export class InvalidSpeakingScoreError extends DomainError {
  readonly code = 'invalid_speaking_score';

  constructor() {
    super('Score must be a whole number between 0 and 100');
  }
}

export class AssessmentCommentTooLongError extends DomainError {
  readonly code = 'assessment_comment_too_long';

  constructor(readonly maxLength: number) {
    super(`An assessment comment cannot exceed ${maxLength} characters`);
  }
}

export class SpeakingTopicNotFoundError extends DomainError {
  readonly code = 'speaking_topic_not_found';

  constructor(readonly topicId: string) {
    super(`Speaking topic ${topicId} was not found`);
  }
}

export class SpeakingPracticeNotFoundError extends DomainError {
  readonly code = 'speaking_practice_not_found';

  constructor(readonly practiceId: string) {
    super(`Speaking practice ${practiceId} was not found`);
  }
}

export class PracticeAlreadyAssessedError extends DomainError {
  readonly code = 'practice_already_assessed';

  constructor(readonly practiceId: string) {
    super(`Speaking practice ${practiceId} already has an assessment`);
  }
}

export class AssessmentNotFoundError extends DomainError {
  readonly code = 'assessment_not_found';

  constructor(readonly practiceId: string) {
    super(`Speaking practice ${practiceId} has no assessment to revise`);
  }
}

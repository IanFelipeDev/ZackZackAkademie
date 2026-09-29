import { InvalidPracticeDurationError } from './errors';

/** Upper bound for one practice, far above the exam timing; also enforced by the database. */
export const MAX_PRACTICE_SECONDS = 7200;

export interface SpeakingPracticeProps {
  readonly topicId: string;
  readonly studentId: string;
  readonly durationSeconds: number;
}

/** One time a student practised a topic with the timer. Practices are never changed afterwards. */
export class SpeakingPractice {
  private constructor(
    readonly id: string,
    readonly topicId: string,
    readonly studentId: string,
    readonly durationSeconds: number,
    readonly createdAt: Date,
  ) {}

  /** @throws {InvalidPracticeDurationError} when the duration is not a whole number of seconds in range */
  static create(props: SpeakingPracticeProps): SpeakingPractice {
    const { durationSeconds } = props;
    if (!Number.isInteger(durationSeconds) || durationSeconds < 0 || durationSeconds > MAX_PRACTICE_SECONDS) {
      throw new InvalidPracticeDurationError(MAX_PRACTICE_SECONDS);
    }
    return new SpeakingPractice(
      crypto.randomUUID(),
      props.topicId,
      props.studentId,
      durationSeconds,
      new Date(),
    );
  }
}

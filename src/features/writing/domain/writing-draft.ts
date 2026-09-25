import { DraftTooLongError } from './errors';
import { WritingSubmission } from './writing-submission';

/** Work in progress for one exercise. Unlike submissions, a draft is overwritten on every save. */
export class WritingDraft {
  private constructor(
    readonly exerciseId: string,
    readonly studentId: string,
    readonly content: string,
  ) {}

  /** @throws {DraftTooLongError} when content exceeds the submission limit */
  static create(props: { exerciseId: string; studentId: string; content: string }): WritingDraft {
    if (props.content.length > WritingSubmission.MAX_LENGTH) {
      throw new DraftTooLongError(WritingSubmission.MAX_LENGTH);
    }
    return new WritingDraft(props.exerciseId, props.studentId, props.content);
  }

  get isBlank(): boolean {
    return this.content.trim().length === 0;
  }
}

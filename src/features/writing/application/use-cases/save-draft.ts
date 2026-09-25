import { WritingDraft } from '../../domain/writing-draft';
import type { DraftRepository } from '../ports/draft-repository';

export interface SaveDraftInput {
  readonly exerciseId: string;
  readonly studentId: string;
  readonly content: string;
}

/**
 * Saves work in progress. Saving blank content removes the draft instead of storing an empty row.
 *
 * @throws {DraftTooLongError} when content exceeds the submission limit
 */
export class SaveDraft {
  constructor(private readonly drafts: DraftRepository) {}

  async execute(input: SaveDraftInput): Promise<void> {
    const draft = WritingDraft.create(input);
    if (draft.isBlank) {
      await this.drafts.delete(input.exerciseId, input.studentId);
      return;
    }
    await this.drafts.save(draft);
  }
}

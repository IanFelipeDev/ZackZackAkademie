import type { WritingDraft } from '../../domain/writing-draft';
import type { DraftRepository } from '../ports/draft-repository';

export class GetDraft {
  constructor(private readonly drafts: DraftRepository) {}

  execute(exerciseId: string, studentId: string): Promise<WritingDraft | null> {
    return this.drafts.find(exerciseId, studentId);
  }
}

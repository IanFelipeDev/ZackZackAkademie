import type { DraftRepository } from '../ports/draft-repository';

export class DeleteDraft {
  constructor(private readonly drafts: DraftRepository) {}

  execute(exerciseId: string, studentId: string): Promise<void> {
    return this.drafts.delete(exerciseId, studentId);
  }
}

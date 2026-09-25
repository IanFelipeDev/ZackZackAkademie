import type { DraftRepository } from '../ports/draft-repository';
import type { DraftSummary } from '../read-models';

export class ListMyDrafts {
  constructor(private readonly drafts: DraftRepository) {}

  execute(studentId: string): Promise<DraftSummary[]> {
    return this.drafts.listByStudent(studentId);
  }
}

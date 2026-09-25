import type { WritingTaskType } from '../../domain/task-type';
import { groupPhrasesByCategory, type PhraseGroup } from '../../domain/useful-phrase';
import type { PhraseRepository } from '../ports/phrase-repository';

/** Redemittel for a task type, grouped by category (Einleitung, Meinung äußern, …). */
export class ListUsefulPhrases {
  constructor(private readonly phrases: PhraseRepository) {}

  async execute(taskType: WritingTaskType): Promise<PhraseGroup[]> {
    return groupPhrasesByCategory(await this.phrases.listByTaskType(taskType));
  }
}

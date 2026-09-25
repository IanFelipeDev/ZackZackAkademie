import type { WritingTaskType } from '../../domain/task-type';
import type { UsefulPhrase } from '../../domain/useful-phrase';

export interface PhraseRepository {
  listByTaskType(taskType: WritingTaskType): Promise<UsefulPhrase[]>;
}

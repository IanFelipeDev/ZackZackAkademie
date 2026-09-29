import type { SpeakingTopic } from '../../domain/speaking-topic';
import type { SpeakingTaskType } from '../../domain/task-type';

export interface SpeakingTopicRepository {
  /** Topics of an exam part visible to the current user, ordered by position. */
  listByTaskType(taskType: SpeakingTaskType): Promise<SpeakingTopic[]>;
  findById(id: string): Promise<SpeakingTopic | null>;
}

import type { SpeakingExam } from '../../domain/exam';
import type { SpeakingTopic } from '../../domain/speaking-topic';
import type { SpeakingTaskType } from '../../domain/task-type';

export interface SpeakingTopicRepository {
  /** Topics of one exam part visible to the current user, ordered by position. */
  listByPart(exam: SpeakingExam, taskType: SpeakingTaskType): Promise<SpeakingTopic[]>;
  findById(id: string): Promise<SpeakingTopic | null>;
}

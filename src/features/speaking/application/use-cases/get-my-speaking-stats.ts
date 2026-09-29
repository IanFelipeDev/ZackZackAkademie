import { SPEAKING_TASK_TYPES } from '../../domain/task-type';
import type { SpeakingPracticeRepository } from '../ports/speaking-practice-repository';
import type { SpeakingTopicRepository } from '../ports/speaking-topic-repository';
import { computeSpeakingStats, type StudentSpeakingStats } from './compute-speaking-stats';

/** Speaking summary for the performance dashboard, across both exam parts. */
export class GetMySpeakingStats {
  constructor(
    private readonly topics: SpeakingTopicRepository,
    private readonly practices: SpeakingPracticeRepository,
  ) {}

  async execute(studentId: string): Promise<StudentSpeakingStats> {
    const [practices, ...topicsPerPart] = await Promise.all([
      this.practices.listByStudent(studentId),
      ...SPEAKING_TASK_TYPES.map((taskType) => this.topics.listByTaskType(taskType)),
    ]);
    const totalTopics = topicsPerPart.reduce((sum, topics) => sum + topics.length, 0);
    return computeSpeakingStats(practices, totalTopics);
  }
}

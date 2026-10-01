import { EXAM_TASK_TYPES, SPEAKING_EXAMS } from '../../domain/exam';
import type { SpeakingPracticeRepository } from '../ports/speaking-practice-repository';
import type { SpeakingTopicRepository } from '../ports/speaking-topic-repository';
import { computeSpeakingStats, type StudentSpeakingStats } from './compute-speaking-stats';

/** Speaking summary for the performance dashboard, across every part of both exams. */
export class GetMySpeakingStats {
  constructor(
    private readonly topics: SpeakingTopicRepository,
    private readonly practices: SpeakingPracticeRepository,
  ) {}

  async execute(studentId: string): Promise<StudentSpeakingStats> {
    const [practices, ...topicsPerPart] = await Promise.all([
      this.practices.listByStudent(studentId),
      ...SPEAKING_EXAMS.flatMap((exam) =>
        EXAM_TASK_TYPES[exam].map((taskType) => this.topics.listByPart(exam, taskType)),
      ),
    ]);
    const totalTopics = topicsPerPart.reduce((sum, topics) => sum + topics.length, 0);
    return computeSpeakingStats(practices, totalTopics);
  }
}

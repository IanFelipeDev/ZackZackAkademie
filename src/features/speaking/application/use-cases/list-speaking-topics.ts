import type { SpeakingExam } from '../../domain/exam';
import { topicStatus, type SpeakingTopic } from '../../domain/speaking-topic';
import type { SpeakingTaskType } from '../../domain/task-type';
import type { SpeakingPracticeRepository } from '../ports/speaking-practice-repository';
import type { SpeakingTopicRepository } from '../ports/speaking-topic-repository';
import type { SpeakingPracticeSummary, SpeakingTopicProgress } from '../read-models';

/** Combines topics with a student's practices (newest first) into the catalogue's progress view. */
export function buildTopicProgress(
  topics: readonly SpeakingTopic[],
  practices: readonly SpeakingPracticeSummary[],
): SpeakingTopicProgress[] {
  return topics.map((topic) => {
    const own = practices.filter((p) => p.topicId === topic.id);
    const lastAssessed = own.find((p) => p.assessment !== null);
    return {
      topic,
      status: topicStatus(own.length),
      practiceCount: own.length,
      lastScore: lastAssessed?.assessment?.score ?? null,
      lastPracticedAt: own[0]?.createdAt ?? null,
    };
  });
}

export class ListSpeakingTopics {
  constructor(
    private readonly topics: SpeakingTopicRepository,
    private readonly practices: SpeakingPracticeRepository,
  ) {}

  async execute(
    exam: SpeakingExam,
    taskType: SpeakingTaskType,
    studentId: string,
  ): Promise<SpeakingTopicProgress[]> {
    const [topics, practices] = await Promise.all([
      this.topics.listByPart(exam, taskType),
      this.practices.listByStudent(studentId),
    ]);
    return buildTopicProgress(topics, practices);
  }
}

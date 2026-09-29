import type { SpeakingPracticeRepository } from '../ports/speaking-practice-repository';
import type { SpeakingPracticeSummary } from '../read-models';

export class ListMySpeakingPractices {
  constructor(private readonly practices: SpeakingPracticeRepository) {}

  /** The student's practices, newest first, optionally only those of one topic. */
  async execute(studentId: string, topicId?: string): Promise<SpeakingPracticeSummary[]> {
    const practices = await this.practices.listByStudent(studentId);
    return topicId === undefined ? practices : practices.filter((p) => p.topicId === topicId);
  }
}

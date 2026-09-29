import type { SpeakingAssessmentRepository } from '../ports/speaking-assessment-repository';
import type { PracticeForAssessment } from '../read-models';

function lastTouched(practice: PracticeForAssessment): number {
  const { assessment } = practice;
  return (assessment?.updatedAt ?? assessment?.createdAt ?? practice.createdAt).getTime();
}

/** Practices still waiting for a score, oldest first so nobody waits forever. */
export class ListPracticesAwaitingAssessment {
  constructor(private readonly assessments: SpeakingAssessmentRepository) {}

  async execute(): Promise<PracticeForAssessment[]> {
    const practices = await this.assessments.listPractices();
    return practices
      .filter((p) => p.assessment === null)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}

/** Assessment history, most recently assessed or revised first. */
export class ListAssessedPractices {
  constructor(private readonly assessments: SpeakingAssessmentRepository) {}

  async execute(): Promise<PracticeForAssessment[]> {
    const practices = await this.assessments.listPractices();
    return practices.filter((p) => p.assessment !== null).sort((a, b) => lastTouched(b) - lastTouched(a));
  }
}

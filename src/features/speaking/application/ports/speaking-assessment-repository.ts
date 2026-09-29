import type { AssessmentContent, SpeakingAssessment } from '../../domain/speaking-assessment';
import type { PracticeForAssessment } from '../read-models';

/** Staff side of Sprechen: every student's practices and their assessments. */
export interface SpeakingAssessmentRepository {
  /** All practices visible to the current user, assessed or not, in no particular order. */
  listPractices(): Promise<PracticeForAssessment[]>;
  findPractice(practiceId: string): Promise<PracticeForAssessment | null>;
  /** @throws {PracticeAlreadyAssessedError} when the practice already has an assessment */
  save(assessment: SpeakingAssessment): Promise<void>;
  /** @throws {AssessmentNotFoundError} when the practice has no assessment yet (or is not visible) */
  update(practiceId: string, content: AssessmentContent): Promise<void>;
}

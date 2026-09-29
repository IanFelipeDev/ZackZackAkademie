import type { SpeakingPractice } from '../../domain/speaking-practice';
import type { SpeakingPracticeSummary } from '../read-models';

export interface SpeakingPracticeRepository {
  save(practice: SpeakingPractice): Promise<void>;
  /** Newest first, with the teacher's assessment when there is one. */
  listByStudent(studentId: string): Promise<SpeakingPracticeSummary[]>;
}

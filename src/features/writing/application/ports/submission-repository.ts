import type { WritingSubmission } from '../../domain/writing-submission';
import type { SubmissionDetail, SubmissionSummary } from '../read-models';

export interface SubmissionRepository {
  save(submission: WritingSubmission): Promise<void>;
  countAttempts(exerciseId: string, studentId: string): Promise<number>;
  /** Newest first, with teacher feedback when there is any. */
  listSummariesByStudent(studentId: string): Promise<SubmissionSummary[]>;
  findDetailById(id: string): Promise<SubmissionDetail | null>;
}

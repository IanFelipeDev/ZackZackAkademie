import type { WritingDraft } from '../../domain/writing-draft';
import type { DraftSummary } from '../read-models';

export interface DraftRepository {
  /** Inserts or replaces the draft of this student for this exercise. */
  save(draft: WritingDraft): Promise<void>;
  find(exerciseId: string, studentId: string): Promise<WritingDraft | null>;
  delete(exerciseId: string, studentId: string): Promise<void>;
  /** Most recently edited first. */
  listByStudent(studentId: string): Promise<DraftSummary[]>;
}

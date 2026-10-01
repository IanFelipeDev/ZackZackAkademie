import type { MarkStatus } from '../../domain/card-status';

export interface FlashcardMark {
  readonly flashcardId: string;
  readonly status: MarkStatus;
}

export interface FlashcardMarkRepository {
  listByStudent(studentId: string): Promise<FlashcardMark[]>;
  /** Creates the student's mark for the card or replaces the previous one. */
  save(studentId: string, mark: FlashcardMark): Promise<void>;
}

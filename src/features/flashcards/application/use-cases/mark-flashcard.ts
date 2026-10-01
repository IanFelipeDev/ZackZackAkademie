import type { MarkStatus } from '../../domain/card-status';
import type { FlashcardMarkRepository } from '../ports/flashcard-mark-repository';

export interface MarkFlashcardInput {
  readonly studentId: string;
  readonly flashcardId: string;
  readonly status: MarkStatus;
}

/** Marks a card as known (Realizado) or to review (A revisar), replacing any earlier mark. */
export class MarkFlashcard {
  constructor(private readonly marks: FlashcardMarkRepository) {}

  execute({ studentId, flashcardId, status }: MarkFlashcardInput): Promise<void> {
    return this.marks.save(studentId, { flashcardId, status });
  }
}

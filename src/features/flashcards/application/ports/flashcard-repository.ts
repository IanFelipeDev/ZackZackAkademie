import type { Flashcard } from '../../domain/flashcard';

export interface FlashcardRepository {
  /** Every card visible to the current user (RLS hides unpublished ones from students), in no particular order. */
  listAll(): Promise<Flashcard[]>;
}

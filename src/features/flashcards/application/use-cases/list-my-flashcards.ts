import type { DeckCard } from '../../domain/deck';
import { sortFlashcards } from '../../domain/flashcard';
import type { FlashcardMarkRepository } from '../ports/flashcard-mark-repository';
import type { FlashcardRepository } from '../ports/flashcard-repository';

/** All cards in display order, each with the student's status (new when never marked). */
export class ListMyFlashcards {
  constructor(
    private readonly cards: FlashcardRepository,
    private readonly marks: FlashcardMarkRepository,
  ) {}

  async execute(studentId: string): Promise<DeckCard[]> {
    const [cards, marks] = await Promise.all([this.cards.listAll(), this.marks.listByStudent(studentId)]);
    const statusById = new Map(marks.map((m) => [m.flashcardId, m.status]));
    return sortFlashcards(cards).map((card) => ({ card, status: statusById.get(card.id) ?? 'new' }));
  }
}

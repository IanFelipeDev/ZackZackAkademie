import type { Flashcard } from '../../domain/flashcard';
import type { FlashcardMark, FlashcardMarkRepository } from '../ports/flashcard-mark-repository';
import type { FlashcardRepository } from '../ports/flashcard-repository';

/** In-memory backend for the flashcard ports, used by use-case and component tests. */
export class InMemoryFlashcardStore {
  readonly cards: Flashcard[] = [];
  /** Marks by student id, then by card id. */
  readonly marks = new Map<string, Map<string, FlashcardMark>>();

  readonly cardRepository: FlashcardRepository = {
    listAll: () => Promise.resolve([...this.cards]),
  };

  readonly markRepository: FlashcardMarkRepository = {
    listByStudent: (studentId) => Promise.resolve([...(this.marks.get(studentId)?.values() ?? [])]),
    save: (studentId, mark) => {
      const own = this.marks.get(studentId) ?? new Map<string, FlashcardMark>();
      own.set(mark.flashcardId, mark);
      this.marks.set(studentId, own);
      return Promise.resolve();
    },
  };
}

export function buildFlashcard(overrides: Partial<Flashcard> = {}): Flashcard {
  return {
    id: 'card-1',
    level: 'B2',
    category: 'work',
    position: 1,
    term: 'der Lebenslauf',
    translation: 'currículo',
    synonyms: [],
    ...overrides,
  };
}

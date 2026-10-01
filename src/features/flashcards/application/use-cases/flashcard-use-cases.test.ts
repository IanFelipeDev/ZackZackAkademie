import { beforeEach, describe, expect, it } from 'vitest';
import { buildFlashcard, InMemoryFlashcardStore } from '../testing/in-memory-flashcard-store';
import { ListMyFlashcards } from './list-my-flashcards';
import { MarkFlashcard } from './mark-flashcard';

const STUDENT = 'student-1';

let store: InMemoryFlashcardStore;

beforeEach(() => {
  store = new InMemoryFlashcardStore();
  store.cards.push(
    buildFlashcard({ id: 'verb', category: 'verbs', term: 'vermeiden' }),
    buildFlashcard({ id: 'work-2', position: 2, term: 'das Gehalt' }),
    buildFlashcard({ id: 'work-1' }),
  );
});

function list(studentId = STUDENT) {
  return new ListMyFlashcards(store.cardRepository, store.markRepository).execute(studentId);
}

function mark(flashcardId: string, status: 'known' | 'review', studentId = STUDENT) {
  return new MarkFlashcard(store.markRepository).execute({ studentId, flashcardId, status });
}

describe('flashcards', () => {
  it('lists every card in display order as new until the student marks it', async () => {
    const deck = await list();
    expect(deck.map((d) => [d.card.id, d.status])).toEqual([
      ['work-1', 'new'],
      ['work-2', 'new'],
      ['verb', 'new'],
    ]);
  });

  it('keeps each student marks separate and lets a mark be changed', async () => {
    await mark('work-1', 'review');
    await mark('verb', 'known');
    await mark('work-1', 'known');
    await mark('work-2', 'review', 'student-2');

    expect((await list()).map((d) => d.status)).toEqual(['known', 'new', 'known']);
    expect((await list('student-2')).map((d) => d.status)).toEqual(['new', 'review', 'new']);
  });
});

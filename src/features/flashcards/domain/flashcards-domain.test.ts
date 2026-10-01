import { describe, expect, it } from 'vitest';
import { countStatuses, isMarkStatus } from './card-status';
import { filterDeck, shuffle, type DeckCard } from './deck';
import { isFlashcardCategory, sortFlashcards, splitArticle, type Flashcard } from './flashcard';

function card(overrides: Partial<Flashcard> = {}): Flashcard {
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

describe('flashcard', () => {
  it('recognises the known categories and mark statuses', () => {
    expect(isFlashcardCategory('verbs')).toBe(true);
    expect(isFlashcardCategory('trabalho')).toBe(false);
    expect(isMarkStatus('review')).toBe(true);
    expect(isMarkStatus('new')).toBe(false);
  });

  it('sorts by category order, then position', () => {
    const cards = [
      card({ id: 'g1', category: 'general', position: 1 }),
      card({ id: 'w2', category: 'work', position: 2 }),
      card({ id: 'v1', category: 'verbs', position: 1 }),
      card({ id: 'w1', category: 'work', position: 1 }),
    ];
    expect(sortFlashcards(cards).map((c) => c.id)).toEqual(['w1', 'w2', 'v1', 'g1']);
    expect(cards[0]?.id).toBe('g1');
  });

  it.each([
    ['die Stellenanzeige', 'die', 'Stellenanzeige'],
    ['Der Band', 'der', 'Band'],
    ['  das Gehalt / der Lohn ', 'das', 'Gehalt / der Lohn'],
    ['entstehen', null, 'entstehen'],
    ['Dieselmotor', null, 'Dieselmotor'],
    ['die', null, 'die'],
  ])('splits the article off %j', (term, article, rest) => {
    expect(splitArticle(term)).toEqual({ article, rest });
  });
});

describe('statuses', () => {
  it('counts each status', () => {
    expect(countStatuses(['new', 'known', 'known', 'review'])).toEqual({
      total: 4,
      new: 1,
      known: 2,
      review: 1,
    });
    expect(countStatuses([])).toEqual({ total: 0, new: 0, known: 0, review: 0 });
  });
});

describe('deck', () => {
  const deck: DeckCard[] = [
    { card: card({ id: 'a', category: 'work' }), status: 'new' },
    { card: card({ id: 'b', category: 'work' }), status: 'review' },
    { card: card({ id: 'c', category: 'verbs' }), status: 'review' },
    { card: card({ id: 'd', category: 'verbs' }), status: 'known' },
  ];

  it('filters by category and status, keeping the order', () => {
    expect(filterDeck(deck, { category: 'all', status: 'all' })).toEqual(['a', 'b', 'c', 'd']);
    expect(filterDeck(deck, { category: 'work', status: 'all' })).toEqual(['a', 'b']);
    expect(filterDeck(deck, { category: 'all', status: 'review' })).toEqual(['b', 'c']);
    expect(filterDeck(deck, { category: 'verbs', status: 'new' })).toEqual([]);
  });

  it('shuffles into a new array with the same items', () => {
    const items = ['a', 'b', 'c', 'd'];
    // random() = 0 always swaps with the first slot: [a,b,c,d] → [d,b,c,a] → [c,b,d,a] → [b,c,d,a]
    expect(shuffle(items, () => 0)).toEqual(['b', 'c', 'd', 'a']);
    expect(shuffle(items, () => 0.999)).toEqual(items);
    expect(items).toEqual(['a', 'b', 'c', 'd']);
    expect([...shuffle(items)].sort()).toEqual(items);
  });
});

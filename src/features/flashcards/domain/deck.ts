import type { CardStatus } from './card-status';
import type { Flashcard, FlashcardCategory } from './flashcard';

/** A card together with the signed-in student's status for it. */
export interface DeckCard {
  readonly card: Flashcard;
  readonly status: CardStatus;
}

export interface DeckFilter {
  readonly category: FlashcardCategory | 'all';
  readonly status: CardStatus | 'all';
}

/** Ids of the cards matching the filter, in the given order. */
export function filterDeck(cards: readonly DeckCard[], filter: DeckFilter): string[] {
  return cards
    .filter(
      ({ card, status }) =>
        (filter.category === 'all' || card.category === filter.category) &&
        (filter.status === 'all' || status === filter.status),
    )
    .map(({ card }) => card.id);
}

/** Fisher–Yates shuffle into a new array. `random` returns a number in [0, 1), like Math.random. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}

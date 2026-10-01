import type { CefrLevel } from '@/shared/domain';

/** Card categories in display order. Mirrors the check constraint on flashcards.category. */
export const FLASHCARD_CATEGORIES = [
  'work',
  'environment',
  'health',
  'technology',
  'education',
  'housing',
  'verbs',
  'synonyms',
  'general',
] as const;

export type FlashcardCategory = (typeof FLASHCARD_CATEGORIES)[number];

export function isFlashcardCategory(value: string): value is FlashcardCategory {
  return (FLASHCARD_CATEGORIES as readonly string[]).includes(value);
}

/** A vocabulary card: the German term on the front, the Portuguese translation (and synonyms) on the back. */
export interface Flashcard {
  readonly id: string;
  readonly level: CefrLevel;
  readonly category: FlashcardCategory;
  readonly position: number;
  readonly term: string;
  readonly translation: string;
  /** German synonyms or paraphrases for the exam; empty for most cards. */
  readonly synonyms: readonly string[];
}

/** Orders cards by category (in FLASHCARD_CATEGORIES order), then by position. Returns a new array. */
export function sortFlashcards<T extends Flashcard>(cards: readonly T[]): T[] {
  const rank = (card: Flashcard) => FLASHCARD_CATEGORIES.indexOf(card.category);
  return [...cards].sort((a, b) => rank(a) - rank(b) || a.position - b.position);
}

export type Article = 'der' | 'die' | 'das';

/** Splits a leading definite article off a noun ("die Stellenanzeige"), so the front can highlight the gender. */
export function splitArticle(term: string): { readonly article: Article | null; readonly rest: string } {
  const match = /^(der|die|das)\s+(.+)$/i.exec(term.trim());
  if (!match) return { article: null, rest: term.trim() };
  const [, article = '', rest = ''] = match;
  return { article: article.toLowerCase() as Article, rest };
}

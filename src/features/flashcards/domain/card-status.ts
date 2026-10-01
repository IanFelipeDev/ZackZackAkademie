/** What a student can mark a card as: Realizado (known) or A revisar (review). Mirrors flashcard_marks.status. */
export const MARK_STATUSES = ['known', 'review'] as const;

export type MarkStatus = (typeof MARK_STATUSES)[number];

export function isMarkStatus(value: string): value is MarkStatus {
  return (MARK_STATUSES as readonly string[]).includes(value);
}

/** A card the student never marked is "new" (Não feito). */
export type CardStatus = 'new' | MarkStatus;

export const CARD_STATUSES: readonly CardStatus[] = ['new', 'review', 'known'];

export interface StatusCounts {
  readonly total: number;
  readonly new: number;
  readonly known: number;
  readonly review: number;
}

export function countStatuses(statuses: readonly CardStatus[]): StatusCounts {
  const counts = { total: statuses.length, new: 0, known: 0, review: 0 };
  for (const status of statuses) counts[status] += 1;
  return counts;
}

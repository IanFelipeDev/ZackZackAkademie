export { countWords } from '@/shared/domain';

export interface WordRange {
  readonly min: number;
  readonly max: number;
}

export type WordCountStatus = 'empty' | 'below' | 'within' | 'above';

/**
 * Exam graders tolerate texts somewhat above the suggested range; only clearly longer texts
 * are flagged. Same tolerance as the original trainer.
 */
export const WORD_RANGE_TOLERANCE = 40;

export function evaluateWordCount(count: number, range: WordRange | null): WordCountStatus {
  if (count === 0) return 'empty';
  if (!range) return 'within';
  if (count < range.min) return 'below';
  if (count > range.max + WORD_RANGE_TOLERANCE) return 'above';
  return 'within';
}

/** Progress towards the lower bound of the range, clamped to 0–100. */
export function wordProgressPercent(count: number, range: WordRange | null): number {
  if (!range) return count > 0 ? 100 : 0;
  return Math.min(100, Math.round((count / range.min) * 100));
}

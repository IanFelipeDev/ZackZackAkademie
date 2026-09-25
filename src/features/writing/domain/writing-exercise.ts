import type { WritingTaskType } from './task-type';
import type { WordRange } from './word-count';

/** A Schreiben task: the lesson title is the exam topic, the prompt is the Aufgabenstellung. */
export interface WritingExercise {
  readonly id: string;
  readonly title: string;
  readonly position: number;
  readonly prompt: string;
  readonly taskType: WritingTaskType;
  /** Leitpunkte the text must address. */
  readonly guidingPoints: readonly string[];
  /** Addressee of a formal email (Teil 2); null for forum posts. */
  readonly recipient: string | null;
  readonly wordRange: WordRange | null;
}

export function pickRandomExercise<T>(
  items: readonly T[],
  random: () => number = Math.random,
): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(random() * items.length)];
}

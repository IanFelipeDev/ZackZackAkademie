import type { WritingTaskType } from './task-type';

/** A Redemittel phrase students can insert into their text. */
export interface UsefulPhrase {
  readonly id: string;
  readonly taskType: WritingTaskType;
  readonly category: string;
  readonly text: string;
  readonly position: number;
}

export interface PhraseGroup {
  readonly category: string;
  readonly phrases: readonly UsefulPhrase[];
}

/** Groups phrases by category, keeping categories in order of their first phrase. */
export function groupPhrasesByCategory(phrases: readonly UsefulPhrase[]): PhraseGroup[] {
  const sorted = [...phrases].sort((a, b) => a.position - b.position);
  const groups = new Map<string, UsefulPhrase[]>();
  for (const phrase of sorted) {
    const group = groups.get(phrase.category) ?? [];
    group.push(phrase);
    groups.set(phrase.category, group);
  }
  return [...groups].map(([category, items]) => ({ category, phrases: items }));
}

/** Goethe B2 Schreiben: Teil 1 is a forum post (opinion), Teil 2 a formal email. */
export const WRITING_TASK_TYPES = ['forum_post', 'formal_email'] as const;

export type WritingTaskType = (typeof WRITING_TASK_TYPES)[number];

export function isWritingTaskType(value: string): value is WritingTaskType {
  return (WRITING_TASK_TYPES as readonly string[]).includes(value);
}

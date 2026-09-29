/** Goethe B2 Sprechen: Teil 1 is a presentation (Vortrag), Teil 2 a discussion (Diskussion). */
export const SPEAKING_TASK_TYPES = ['presentation', 'discussion'] as const;

export type SpeakingTaskType = (typeof SPEAKING_TASK_TYPES)[number];

export function isSpeakingTaskType(value: string): value is SpeakingTaskType {
  return (SPEAKING_TASK_TYPES as readonly string[]).includes(value);
}

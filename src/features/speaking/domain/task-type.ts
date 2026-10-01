/**
 * Parts of the Sprechen exams. Goethe B2: Teil 1 presentation (Vortrag), Teil 2 discussion (Diskussion).
 * telc B2 Mündlicher Ausdruck: Teil 1 experience (Über Erfahrungen sprechen), Teil 2 discussion, Teil 3 planning
 * (Gemeinsam etwas planen).
 */
export const SPEAKING_TASK_TYPES = ['presentation', 'discussion', 'experience', 'planning'] as const;

export type SpeakingTaskType = (typeof SPEAKING_TASK_TYPES)[number];

export function isSpeakingTaskType(value: string): value is SpeakingTaskType {
  return (SPEAKING_TASK_TYPES as readonly string[]).includes(value);
}

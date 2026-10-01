import type { SpeakingTaskType } from './task-type';

export const SPEAKING_EXAMS = ['goethe', 'telc'] as const;

export type SpeakingExam = (typeof SPEAKING_EXAMS)[number];

export function isSpeakingExam(value: string): value is SpeakingExam {
  return (SPEAKING_EXAMS as readonly string[]).includes(value);
}

/** The parts of each exam, in exam order (Teil 1, Teil 2, …). Mirrors the check constraint on speaking_topics. */
export const EXAM_TASK_TYPES: Record<SpeakingExam, readonly SpeakingTaskType[]> = {
  goethe: ['presentation', 'discussion'],
  telc: ['experience', 'discussion', 'planning'],
};

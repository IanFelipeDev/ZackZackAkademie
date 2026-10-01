import type { SpeakingExam } from '../domain/exam';
import type { SpeakingTaskType } from '../domain/task-type';

export const speakingQueryKeys = {
  all: ['speaking'] as const,
  topics: (exam: SpeakingExam, taskType: SpeakingTaskType, studentId: string) =>
    ['speaking', 'topics', exam, taskType, studentId] as const,
  topic: (topicId: string) => ['speaking', 'topic', topicId] as const,
  practices: (studentId: string) => ['speaking', 'practices', studentId] as const,
  awaiting: ['speaking', 'assessment', 'awaiting'] as const,
  assessed: ['speaking', 'assessment', 'assessed'] as const,
  practice: (practiceId: string) => ['speaking', 'assessment', 'practice', practiceId] as const,
  recording: (path: string) => ['speaking', 'recording', path] as const,
};

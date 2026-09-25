import type { WritingTaskType } from '../domain/task-type';

export const writingQueryKeys = {
  all: ['writing'] as const,
  exercises: (taskType: WritingTaskType) => ['writing', 'exercises', taskType] as const,
  phrases: (taskType: WritingTaskType) => ['writing', 'phrases', taskType] as const,
  draft: (exerciseId: string, studentId: string) => ['writing', 'draft', exerciseId, studentId] as const,
  drafts: (studentId: string) => ['writing', 'drafts', studentId] as const,
  submissions: (studentId: string) => ['writing', 'submissions', studentId] as const,
  submission: (submissionId: string) => ['writing', 'submission', submissionId] as const,
};

import type { WritingTaskType } from '../domain/task-type';
import type { WordRange } from '../domain/word-count';

export interface SubmissionFeedback {
  readonly comment: string;
  readonly score: number | null;
  readonly createdAt: Date;
  /** Null until the teacher revises the feedback. */
  readonly updatedAt: Date | null;
}

/** A submission as listed in "Meus Textos Salvos". */
export interface SubmissionSummary {
  readonly id: string;
  readonly exerciseId: string;
  readonly exerciseTitle: string;
  readonly taskType: WritingTaskType;
  readonly attemptNumber: number;
  readonly content: string;
  readonly wordCount: number;
  readonly durationSeconds: number | null;
  readonly guidingPointsChecked: number | null;
  readonly guidingPointsTotal: number;
  readonly createdAt: Date;
  readonly feedback: SubmissionFeedback | null;
}

export interface SubmissionDetail extends SubmissionSummary {
  readonly prompt: string;
  readonly guidingPoints: readonly string[];
  readonly wordRange: WordRange | null;
}

export interface DraftSummary {
  readonly exerciseId: string;
  readonly exerciseTitle: string;
  readonly taskType: WritingTaskType;
  readonly content: string;
  readonly wordCount: number;
  readonly wordRange: WordRange | null;
  readonly updatedAt: Date;
}

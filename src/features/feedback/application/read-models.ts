export type ReviewTaskType = 'forum_post' | 'formal_email';

/** A submission waiting in the teacher's review queue. */
export interface PendingSubmission {
  readonly id: string;
  readonly studentName: string;
  readonly exerciseTitle: string;
  readonly taskType: ReviewTaskType;
  readonly attemptNumber: number;
  readonly wordCount: number;
  readonly createdAt: Date;
}

export interface ExistingFeedback {
  readonly comment: string;
  readonly score: number | null;
  readonly createdAt: Date;
}

/** Everything the teacher needs on screen while reviewing one text. */
export interface SubmissionForReview extends PendingSubmission {
  readonly content: string;
  readonly prompt: string;
  readonly guidingPoints: readonly string[];
  readonly recipient: string | null;
  readonly minWords: number | null;
  readonly maxWords: number | null;
  readonly durationSeconds: number | null;
  readonly guidingPointsChecked: number | null;
  readonly feedback: ExistingFeedback | null;
}

import type { SpeakingTopic, TopicStatus } from '../domain/speaking-topic';
import type { SpeakingTaskType } from '../domain/task-type';

export interface PracticeAssessment {
  readonly score: number;
  readonly comment: string;
  readonly teacherName: string;
  readonly createdAt: Date;
  /** Null until a teacher revises the assessment. */
  readonly updatedAt: Date | null;
}

/** One practice in the student's history, with the teacher's score once there is one. */
export interface SpeakingPracticeSummary {
  readonly id: string;
  readonly topicId: string;
  readonly topicTitle: string;
  readonly taskType: SpeakingTaskType;
  readonly durationSeconds: number;
  readonly createdAt: Date;
  readonly assessment: PracticeAssessment | null;
}

/** A topic in the catalogue with how far the signed-in student got with it. */
export interface SpeakingTopicProgress {
  readonly topic: SpeakingTopic;
  readonly status: TopicStatus;
  readonly practiceCount: number;
  /** Score of the most recent assessed practice. */
  readonly lastScore: number | null;
  readonly lastPracticedAt: Date | null;
}

/** Everything a teacher needs on screen while assessing one practice. */
export interface PracticeForAssessment extends SpeakingPracticeSummary {
  readonly studentName: string;
  readonly prompt: string;
  readonly guidingPoints: readonly string[];
}

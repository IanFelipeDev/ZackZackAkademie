import type { SpeakingPracticeSummary } from '../read-models';

export interface StudentSpeakingStats {
  readonly totalTopics: number;
  /** Topics with at least one practice. */
  readonly practicedTopics: number;
  readonly totalPractices: number;
  readonly assessedPractices: number;
  readonly averageScore: number | null;
  readonly lastPracticedAt: Date | null;
}

/** Summary for the performance dashboard, computed from the student's practices and the topic count. */
export function computeSpeakingStats(
  practices: readonly SpeakingPracticeSummary[],
  totalTopics: number,
): StudentSpeakingStats {
  const scores = practices.flatMap((p) => (p.assessment ? [p.assessment.score] : []));
  const latest = practices.reduce<Date | null>(
    (max, p) => (max === null || p.createdAt > max ? p.createdAt : max),
    null,
  );
  return {
    totalTopics,
    practicedTopics: new Set(practices.map((p) => p.topicId)).size,
    totalPractices: practices.length,
    assessedPractices: scores.length,
    averageScore:
      scores.length === 0 ? null : Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length),
    lastPracticedAt: latest,
  };
}

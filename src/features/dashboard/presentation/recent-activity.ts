import type { SpeakingPracticeSummary } from '@/features/speaking';
import type { SubmissionSummary } from '@/features/writing';

export interface ActivityItem {
  readonly key: string;
  readonly skill: 'Schreiben' | 'Sprechen';
  readonly title: string;
  readonly score: number | null;
  /** When the correction or assessment was given or last revised. */
  readonly at: Date;
  readonly to: string;
}

/** The latest corrections and assessments the student received, newest first. */
export function recentActivity(
  submissions: readonly SubmissionSummary[],
  practices: readonly SpeakingPracticeSummary[],
  limit = 5,
): ActivityItem[] {
  const writing = submissions.flatMap(({ id, exerciseTitle, feedback }): ActivityItem[] =>
    feedback
      ? [
          {
            key: `w:${id}`,
            skill: 'Schreiben',
            title: exerciseTitle,
            score: feedback.score,
            at: feedback.updatedAt ?? feedback.createdAt,
            to: `/meus-textos/${id}`,
          },
        ]
      : [],
  );
  const speaking = practices.flatMap(({ id, topicId, topicTitle, assessment }): ActivityItem[] =>
    assessment
      ? [
          {
            key: `s:${id}`,
            skill: 'Sprechen',
            title: topicTitle,
            score: assessment.score,
            at: assessment.updatedAt ?? assessment.createdAt,
            to: `/sprechen/${topicId}`,
          },
        ]
      : [],
  );
  return [...writing, ...speaking].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

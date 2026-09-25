import type { SubmissionSummary } from '../read-models';

export interface StudentWritingStats {
  readonly totalSubmissions: number;
  readonly averageWords: number | null;
  readonly averageDurationSeconds: number | null;
  /** Share of Leitpunkte ticked off across submissions that recorded it, 0–100. */
  readonly guidingPointsCoveragePercent: number | null;
  readonly reviewedSubmissions: number;
  readonly averageScore: number | null;
  readonly lastSubmittedAt: Date | null;
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function coveragePercent(submissions: readonly SubmissionSummary[]): number | null {
  const tracked = submissions.filter((s) => s.guidingPointsChecked !== null && s.guidingPointsTotal > 0);
  if (tracked.length === 0) return null;
  const checked = tracked.reduce(
    (sum, s) => sum + Math.min(s.guidingPointsChecked ?? 0, s.guidingPointsTotal),
    0,
  );
  const total = tracked.reduce((sum, s) => sum + s.guidingPointsTotal, 0);
  return Math.round((checked / total) * 100);
}

/** Summary shown in the "Resumo do Aluno" sidebar, computed from the already loaded submission list. */
export function computeWritingStats(submissions: readonly SubmissionSummary[]): StudentWritingStats {
  const scores = submissions.flatMap((s) => (s.feedback?.score != null ? [s.feedback.score] : []));
  const durations = submissions.flatMap((s) => (s.durationSeconds != null ? [s.durationSeconds] : []));
  const latest = submissions.reduce<Date | null>(
    (max, s) => (max === null || s.createdAt > max ? s.createdAt : max),
    null,
  );
  return {
    totalSubmissions: submissions.length,
    averageWords: average(submissions.map((s) => s.wordCount)),
    averageDurationSeconds: average(durations),
    guidingPointsCoveragePercent: coveragePercent(submissions),
    reviewedSubmissions: submissions.filter((s) => s.feedback !== null).length,
    averageScore: average(scores),
    lastSubmittedAt: latest,
  };
}

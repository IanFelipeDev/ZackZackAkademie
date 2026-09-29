// Public API of the writing feature for other features. Everything else is internal.
export type { SubmissionSummary } from './application/read-models';
export { computeWritingStats, type StudentWritingStats } from './application/use-cases/compute-writing-stats';

export const feedbackQueryKeys = {
  pending: ['feedback', 'pending'] as const,
  reviewed: ['feedback', 'reviewed'] as const,
  review: (submissionId: string) => ['feedback', 'review', submissionId] as const,
};

export const feedbackQueryKeys = {
  pending: ['feedback', 'pending'] as const,
  review: (submissionId: string) => ['feedback', 'review', submissionId] as const,
};

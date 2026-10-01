export const flashcardQueryKeys = {
  all: ['flashcards'] as const,
  deck: (studentId: string) => ['flashcards', 'deck', studentId] as const,
};

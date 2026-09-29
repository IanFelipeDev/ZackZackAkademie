import { DomainError } from '@/shared/domain';

const MESSAGES: Record<string, string> = {
  empty_feedback: 'Escreva um comentário para o aluno.',
  feedback_too_long: 'O comentário passou do limite de 5.000 caracteres.',
  invalid_score: 'A nota deve ser um número inteiro de 0 a 100.',
  submission_already_reviewed: 'Este texto já foi corrigido.',
  review_submission_not_found: 'Não encontramos este texto.',
  feedback_not_found: 'Este texto ainda não tem correção para editar.',
};

const FALLBACK = 'Algo deu errado ao falar com o servidor. Tente novamente em instantes.';

export function feedbackErrorMessage(error: unknown): string {
  if (error instanceof DomainError) return MESSAGES[error.code] ?? FALLBACK;
  return FALLBACK;
}

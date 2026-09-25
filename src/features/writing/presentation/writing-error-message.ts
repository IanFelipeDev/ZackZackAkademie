import { DomainError } from '@/shared/domain';

const MESSAGES: Record<string, string> = {
  empty_submission: 'Escreva seu texto antes de enviar.',
  submission_too_long: 'O texto passou do limite de 5.000 caracteres.',
  draft_too_long: 'O rascunho passou do limite de 5.000 caracteres.',
  exercise_not_found: 'Este tema não está disponível.',
  submission_not_found: 'Não encontramos este texto.',
};

const FALLBACK = 'Algo deu errado ao falar com o servidor. Tente novamente em instantes.';

export function writingErrorMessage(error: unknown): string {
  if (error instanceof DomainError) return MESSAGES[error.code] ?? FALLBACK;
  return FALLBACK;
}

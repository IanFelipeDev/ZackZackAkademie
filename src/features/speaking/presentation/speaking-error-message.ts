import { DomainError } from '@/shared/domain';

const MESSAGES: Record<string, string> = {
  invalid_practice_duration: 'A duração da prática é inválida. Reinicie o cronômetro e tente de novo.',
  invalid_speaking_score: 'A nota deve ser um número inteiro de 0 a 100.',
  assessment_comment_too_long: 'O comentário passou do limite de 5.000 caracteres.',
  speaking_topic_not_found: 'Não encontramos este tema.',
  speaking_practice_not_found: 'Não encontramos esta prática.',
  practice_already_assessed: 'Esta prática já foi avaliada.',
  assessment_not_found: 'Esta prática ainda não tem avaliação para editar.',
};

const FALLBACK = 'Algo deu errado ao falar com o servidor. Tente novamente em instantes.';

export function speakingErrorMessage(error: unknown): string {
  if (error instanceof DomainError) return MESSAGES[error.code] ?? FALLBACK;
  return FALLBACK;
}

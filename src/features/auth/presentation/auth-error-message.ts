import { DomainError } from '@/shared/domain';

const MESSAGES: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Confirme seu e-mail pelo link que enviamos antes de entrar.',
  weak_password: 'Escolha uma senha mais forte (mínimo de 8 caracteres).',
};

const FALLBACK = 'Não foi possível concluir agora. Verifique sua conexão e tente novamente.';

export function authErrorMessage(error: unknown): string {
  if (error instanceof DomainError) return MESSAGES[error.code] ?? FALLBACK;
  return FALLBACK;
}

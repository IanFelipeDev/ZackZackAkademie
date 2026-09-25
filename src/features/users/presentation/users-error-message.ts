import { DomainError } from '@/shared/domain';
import { InvalidInvitationError } from '../domain/errors';

const MESSAGES: Record<string, string> = {
  invite_email_taken: 'Já existe uma conta com este e-mail.',
  cannot_change_own_role: 'Você não pode alterar o seu próprio papel.',
  user_admin_forbidden: 'Somente administradores podem gerenciar usuários.',
};

const FALLBACK = 'Não foi possível concluir agora. Verifique sua conexão e tente novamente.';

export function usersErrorMessage(error: unknown): string {
  if (error instanceof InvalidInvitationError) {
    return error.field === 'email' ? 'Informe um e-mail válido.' : 'Informe um nome entre 2 e 60 caracteres.';
  }
  if (error instanceof DomainError) return MESSAGES[error.code] ?? FALLBACK;
  return FALLBACK;
}

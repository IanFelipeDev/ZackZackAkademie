import { DomainError } from '@/shared/domain';
import { InvalidInvitationError } from '../domain/errors';

const MESSAGES: Record<string, string> = {
  invite_email_taken: 'Já existe uma conta com este e-mail.',
  cannot_manage_own_account:
    'Você não pode alterar, desativar, excluir ou reenviar o acesso da sua própria conta.',
  user_admin_forbidden:
    'Somente administradores podem gerenciar usuários. Saia e entre de novo se você acabou de virar admin.',
  invite_delivery_failed: 'Não foi possível enviar o e-mail de acesso. Nada foi criado; tente novamente.',
  email_not_configured:
    'O envio de e-mails ainda não foi configurado, então não é possível mandar a senha temporária. Configure o provedor de e-mail e tente de novo.',
  user_deactivated: 'Esta conta está desativada. Reative-a antes de reenviar o acesso.',
  user_has_reviews:
    'Esta conta já corrigiu textos ou avaliou práticas orais, e isso faz parte do histórico dos alunos, então não pode ser excluída. Use "Desativar conta".',
};

const FALLBACK = 'Não foi possível concluir agora. Verifique sua conexão e tente novamente.';

export function usersErrorMessage(error: unknown): string {
  if (error instanceof InvalidInvitationError) {
    return error.field === 'email' ? 'Informe um e-mail válido.' : 'Informe um nome entre 2 e 60 caracteres.';
  }
  if (error instanceof DomainError) return MESSAGES[error.code] ?? FALLBACK;
  return FALLBACK;
}

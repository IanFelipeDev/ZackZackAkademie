import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useContainer } from '@/app/context/container-context';
import { LOGIN_PATH } from '@/features/auth';
import { ROLES, type Role } from '@/shared/domain';
import { Alert, Badge, Button, formatDate, Icon } from '@/shared/ui';
import type { AccessStatus, ManagedUser } from '../domain/managed-user';
import { PresenceLabel } from './presence-label';
import { ROLE_LABELS } from './role-labels';
import { usersErrorMessage } from './users-error-message';
import { usersQueryKeys } from './users-query-keys';

const STATUS_BADGES: Record<
  Exclude<AccessStatus, 'active'>,
  { label: string; tone: 'warning' | 'neutral' }
> = {
  pending_first_access: { label: 'Aguardando primeiro acesso', tone: 'warning' },
  deactivated: { label: 'Desativada', tone: 'neutral' },
};

interface UserRowProps {
  readonly user: ManagedUser;
  readonly currentUserId: string;
  readonly now: Date;
}

export function UserRow({ user, currentUserId, now }: UserRowProps) {
  const { users } = useContainer();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<'deactivate' | 'delete' | null>(null);
  const isSelf = user.id === currentUserId;
  const isDeactivated = user.accessStatus === 'deactivated';
  const target = { actorId: currentUserId, userId: user.id };
  const refresh = () => queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });

  const changeRole = useMutation({
    mutationFn: (role: Role) => users.changeUserRole.execute({ ...target, role }),
    onSettled: refresh,
  });
  const resend = useMutation({
    mutationFn: () => users.resendAccess.execute(target, `${window.location.origin}${LOGIN_PATH}`),
    onSettled: refresh,
  });
  const setActive = useMutation({
    mutationFn: (isActive: boolean) =>
      isActive ? users.reactivateUser.execute(target) : users.deactivateUser.execute(target),
    onSuccess: () => setConfirming(null),
    onSettled: refresh,
  });
  const remove = useMutation({
    mutationFn: () => users.deleteUser.execute(target),
    onSettled: refresh,
  });
  const failed = [changeRole, resend, setActive, remove].find((mutation) => mutation.isError);
  const isBusy = changeRole.isPending || resend.isPending || setActive.isPending || remove.isPending;
  const badge = user.accessStatus === 'active' ? null : STATUS_BADGES[user.accessStatus];

  return (
    <li className={`flex flex-col gap-2 py-3 ${isDeactivated ? 'opacity-70' : ''}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
            {user.displayName}
            {isSelf ? <Badge>Você</Badge> : null}
            {badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : null}
          </p>
          <p className="truncate text-sm text-ink-soft">
            {user.email ?? 'e-mail indisponível'} · desde {formatDate(user.createdAt)}
          </p>
          <PresenceLabel lastSeenAt={user.lastSeenAt} now={now} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only">Papel de {user.displayName}</span>
          <select
            value={user.role}
            disabled={isSelf || isDeactivated || isBusy}
            title={isSelf ? 'Você não pode alterar o seu próprio papel.' : undefined}
            onChange={(event) => changeRole.mutate(event.target.value as Role)}
            className="rounded-lg border border-hairline bg-surface-lowest px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          {changeRole.isPending ? (
            <Icon name="progress_activity" className="animate-spin text-[18px]" />
          ) : null}
        </label>
      </div>

      {isSelf ? null : (
        <div className="flex flex-wrap items-center gap-2">
          {confirming === 'deactivate' ? (
            <span className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
              A pessoa perde o acesso na hora; o histórico é mantido.
              <Button size="sm" variant="soft" onClick={() => setConfirming(null)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                aria-label={`Confirmar desativação de ${user.displayName}`}
                isLoading={setActive.isPending}
                onClick={() => setActive.mutate(false)}
              >
                Desativar
              </Button>
            </span>
          ) : confirming === 'delete' ? (
            <span className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
              <span>
                <strong className="text-error">Não pode ser desfeito.</strong> A conta, os rascunhos, os
                textos enviados e as correções recebidas são apagados.
              </span>
              <Button size="sm" variant="soft" onClick={() => setConfirming(null)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                variant="danger"
                icon="delete_forever"
                aria-label={`Confirmar exclusão de ${user.displayName}`}
                isLoading={remove.isPending}
                onClick={() => remove.mutate()}
              >
                Excluir
              </Button>
            </span>
          ) : (
            <>
              {isDeactivated ? (
                <Button
                  size="sm"
                  variant="soft"
                  icon="person_check"
                  aria-label={`Reativar ${user.displayName}`}
                  isLoading={setActive.isPending}
                  disabled={isBusy}
                  onClick={() => setActive.mutate(true)}
                >
                  Reativar
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="soft"
                    icon="forward_to_inbox"
                    aria-label={`Reenviar acesso de ${user.displayName}`}
                    isLoading={resend.isPending}
                    disabled={isBusy}
                    onClick={() => resend.mutate()}
                  >
                    Reenviar acesso
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="person_off"
                    aria-label={`Desativar ${user.displayName}`}
                    disabled={isBusy}
                    onClick={() => setConfirming('deactivate')}
                  >
                    Desativar conta
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="ghost"
                icon="delete"
                aria-label={`Excluir ${user.displayName}`}
                disabled={isBusy}
                onClick={() => setConfirming('delete')}
              >
                Excluir conta
              </Button>
            </>
          )}
        </div>
      )}

      {resend.isSuccess ? (
        <Alert tone="success">
          Nova senha temporária enviada para {user.email}. A anterior deixou de valer.
        </Alert>
      ) : null}
      {failed ? <Alert tone="error">{usersErrorMessage(failed.error)}</Alert> : null}
    </li>
  );
}

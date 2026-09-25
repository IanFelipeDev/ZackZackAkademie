import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useContainer } from '@/app/context/container-context';
import { ROLES, type Role } from '@/shared/domain';
import { Alert, Badge, Card, formatDate, Icon } from '@/shared/ui';
import type { ManagedUser } from '../domain/managed-user';
import { ROLE_LABELS } from './role-labels';
import { usersErrorMessage } from './users-error-message';
import { usersQueryKeys } from './users-query-keys';

interface UsersTableProps {
  readonly users: readonly ManagedUser[];
  readonly currentUserId: string;
}

function matches(user: ManagedUser, search: string): boolean {
  const term = search.trim().toLocaleLowerCase('pt-BR');
  if (!term) return true;
  return `${user.displayName} ${user.email ?? ''}`.toLocaleLowerCase('pt-BR').includes(term);
}

export function UsersTable({ users: list, currentUserId }: UsersTableProps) {
  const { users } = useContainer();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const changeRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      users.changeUserRole.execute({ actorId: currentUserId, userId, role }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: usersQueryKeys.all }),
  });
  const visible = list.filter((user) => matches(user, search));

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl text-primary">
          Usuários <span className="font-sans text-base text-ink-soft">({list.length})</span>
        </h2>
        <label className="flex items-center gap-2 rounded-full bg-surface-low px-3 py-1.5 text-sm sm:w-64">
          <Icon name="search" className="text-[18px] text-outline" />
          <span className="sr-only">Buscar usuário</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou e-mail…"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-outline/70"
          />
        </label>
      </div>

      {changeRole.isError ? <Alert tone="error">{usersErrorMessage(changeRole.error)}</Alert> : null}

      <ul className="flex flex-col divide-y divide-hairline">
        {visible.map((user) => {
          const isSelf = user.id === currentUserId;
          const isSaving = changeRole.isPending && changeRole.variables.userId === user.id;
          return (
            <li
              key={user.id}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  {user.displayName}
                  {isSelf ? <Badge>Você</Badge> : null}
                </p>
                <p className="truncate text-sm text-ink-soft">
                  {user.email ?? 'e-mail indisponível'} · desde {formatDate(user.createdAt)}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <span className="sr-only">Papel de {user.displayName}</span>
                <select
                  value={user.role}
                  disabled={isSelf || isSaving}
                  title={isSelf ? 'Você não pode alterar o seu próprio papel.' : undefined}
                  onChange={(event) =>
                    changeRole.mutate({ userId: user.id, role: event.target.value as Role })
                  }
                  className="rounded-lg border border-hairline bg-surface-lowest px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
                {isSaving ? <Icon name="progress_activity" className="animate-spin text-[18px]" /> : null}
              </label>
            </li>
          );
        })}
      </ul>
      {visible.length === 0 ? (
        <p className="text-center text-sm text-ink-soft">Nenhum usuário encontrado.</p>
      ) : null}
    </Card>
  );
}

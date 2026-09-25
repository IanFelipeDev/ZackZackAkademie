import { useState } from 'react';
import { Card, Icon } from '@/shared/ui';
import type { ManagedUser } from '../domain/managed-user';
import { UserRow } from './user-row';

interface UsersTableProps {
  readonly users: readonly ManagedUser[];
  readonly currentUserId: string;
}

function matches(user: ManagedUser, search: string): boolean {
  const term = search.trim().toLocaleLowerCase('pt-BR');
  if (!term) return true;
  return `${user.displayName} ${user.email ?? ''}`.toLocaleLowerCase('pt-BR').includes(term);
}

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const [search, setSearch] = useState('');
  const visible = users.filter((user) => matches(user, search));

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl text-primary">
          Usuários <span className="font-sans text-base text-ink-soft">({users.length})</span>
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

      <ul className="flex flex-col divide-y divide-hairline">
        {visible.map((user) => (
          <UserRow key={user.id} user={user} currentUserId={currentUserId} />
        ))}
      </ul>
      {visible.length === 0 ? (
        <p className="text-center text-sm text-ink-soft">Nenhum usuário encontrado.</p>
      ) : null}
    </Card>
  );
}

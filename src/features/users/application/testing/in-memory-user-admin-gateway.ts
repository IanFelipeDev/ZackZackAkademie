import type { Role } from '@/shared/domain';
import { InviteEmailTakenError } from '../../domain/errors';
import type { Invitation } from '../../domain/invitation';
import type { ManagedUser } from '../../domain/managed-user';
import type { UserAdminGateway } from '../ports/user-admin-gateway';

export class InMemoryUserAdminGateway implements UserAdminGateway {
  readonly users: ManagedUser[] = [];
  readonly invitations: { invitation: Invitation; redirectTo: string }[] = [];

  listUsers(): Promise<ManagedUser[]> {
    return Promise.resolve([...this.users].sort((a, b) => a.displayName.localeCompare(b.displayName)));
  }

  invite(invitation: Invitation, redirectTo: string): Promise<void> {
    if (this.users.some((u) => u.email === invitation.email))
      return Promise.reject(new InviteEmailTakenError());
    this.invitations.push({ invitation, redirectTo });
    this.users.push({
      id: `invited-${this.users.length + 1}`,
      email: invitation.email,
      displayName: invitation.displayName,
      role: invitation.role,
      createdAt: new Date(),
    });
    return Promise.resolve();
  }

  changeRole(userId: string, role: Role): Promise<void> {
    const index = this.users.findIndex((u) => u.id === userId);
    const user = this.users[index];
    if (user) this.users[index] = { ...user, role };
    return Promise.resolve();
  }
}

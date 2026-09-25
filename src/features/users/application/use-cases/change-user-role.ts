import type { Role } from '@/shared/domain';
import { CannotManageOwnAccountError } from '../../domain/errors';
import type { UserAdminGateway } from '../ports/user-admin-gateway';

export interface ChangeUserRoleInput {
  readonly actorId: string;
  readonly userId: string;
  readonly role: Role;
}

/**
 * Changes another user's role. Admins cannot change their own role, so there is always at least one admin
 * (RLS enforces the same rule).
 *
 * @throws {CannotManageOwnAccountError} when the admin targets their own account
 */
export class ChangeUserRole {
  constructor(private readonly users: UserAdminGateway) {}

  async execute(input: ChangeUserRoleInput): Promise<void> {
    if (input.actorId === input.userId) throw new CannotManageOwnAccountError();
    await this.users.changeRole(input.userId, input.role);
  }
}

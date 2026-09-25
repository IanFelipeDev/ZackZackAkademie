import type { Role } from '@/shared/domain';
import type { Invitation } from '../../domain/invitation';
import type { ManagedUser } from '../../domain/managed-user';

export interface UserAdminGateway {
  /** All accounts, sorted by display name. */
  listUsers(): Promise<ManagedUser[]>;
  /**
   * Creates the account and emails an access link that lands on `redirectTo`.
   * @throws {InviteEmailTakenError} when the email is already registered
   */
  invite(invitation: Invitation, redirectTo: string): Promise<void>;
  /** @throws {UserAdminForbiddenError} when the backend refuses the change */
  changeRole(userId: string, role: Role): Promise<void>;
}

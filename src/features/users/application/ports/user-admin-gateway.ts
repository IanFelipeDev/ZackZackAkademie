import type { Role } from '@/shared/domain';
import type { Invitation } from '../../domain/invitation';
import type { ManagedUser } from '../../domain/managed-user';

export interface UserAdminGateway {
  /** All accounts, sorted by display name. */
  listUsers(): Promise<ManagedUser[]>;
  /**
   * Creates the account with a temporary password and emails it, with a link to `loginUrl`.
   * @throws {InviteEmailTakenError} when the email is already registered
   * @throws {EmailNotConfiguredError} when no email provider is configured
   */
  invite(invitation: Invitation, loginUrl: string): Promise<void>;
  /** @throws {UserAdminForbiddenError} when the backend refuses the change */
  changeRole(userId: string, role: Role): Promise<void>;
  /** Issues a new temporary password by email and lifts an expiry block. */
  resendAccess(userId: string, loginUrl: string): Promise<void>;
  /** Blocks sign-in and all permissions, keeping history. */
  deactivate(userId: string): Promise<void>;
  reactivate(userId: string): Promise<void>;
}

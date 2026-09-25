import type { Role } from '@/shared/domain';

/**
 * - pending_first_access: has a temporary password that was not changed yet
 * - access_expired: the temporary password expired unused; sign-in is blocked until access is resent
 * - deactivated: blocked by an admin; history is kept and the account can be reactivated
 */
export type AccessStatus = 'active' | 'pending_first_access' | 'access_expired' | 'deactivated';

/** A platform account as seen by an admin. */
export interface ManagedUser {
  readonly id: string;
  /** Null only for accounts created before emails were mirrored onto profiles. */
  readonly email: string | null;
  readonly displayName: string;
  readonly role: Role;
  readonly createdAt: Date;
  readonly accessStatus: AccessStatus;
  readonly temporaryPasswordExpiresAt: Date | null;
}

export interface AccessState {
  readonly deactivatedAt: Date | null;
  readonly mustChangePassword: boolean;
  readonly temporaryPasswordExpiresAt: Date | null;
}

export function accessStatusOf(state: AccessState, now: Date = new Date()): AccessStatus {
  if (state.deactivatedAt) return 'deactivated';
  if (!state.mustChangePassword) return 'active';
  const hasExpired = state.temporaryPasswordExpiresAt !== null && state.temporaryPasswordExpiresAt < now;
  return hasExpired ? 'access_expired' : 'pending_first_access';
}

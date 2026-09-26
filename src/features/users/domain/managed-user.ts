import type { Role } from '@/shared/domain';

/**
 * - pending_first_access: still on the emailed temporary password (valid until the first sign-in)
 * - deactivated: blocked by an admin; history is kept and the account can be reactivated
 */
export type AccessStatus = 'active' | 'pending_first_access' | 'deactivated';

/** A platform account as seen by an admin. */
export interface ManagedUser {
  readonly id: string;
  /** Null only for accounts created before emails were mirrored onto profiles. */
  readonly email: string | null;
  readonly displayName: string;
  readonly role: Role;
  readonly createdAt: Date;
  readonly accessStatus: AccessStatus;
}

export interface AccessState {
  readonly deactivatedAt: Date | null;
  readonly mustChangePassword: boolean;
}

export function accessStatusOf(state: AccessState): AccessStatus {
  if (state.deactivatedAt) return 'deactivated';
  return state.mustChangePassword ? 'pending_first_access' : 'active';
}

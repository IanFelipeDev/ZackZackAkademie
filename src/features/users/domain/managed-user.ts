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
  /** Last activity reported by the app; null when the person never used it since presence was tracked. */
  readonly lastSeenAt: Date | null;
}

/** Someone counts as online when the app reported activity within this window (it reports every 2 minutes). */
export const ONLINE_WINDOW_MS = 5 * 60_000;

export function isOnline(lastSeenAt: Date | null, now: Date): boolean {
  return lastSeenAt !== null && now.getTime() - lastSeenAt.getTime() <= ONLINE_WINDOW_MS;
}

export interface AccessState {
  readonly deactivatedAt: Date | null;
  readonly mustChangePassword: boolean;
}

export function accessStatusOf(state: AccessState): AccessStatus {
  if (state.deactivatedAt) return 'deactivated';
  return state.mustChangePassword ? 'pending_first_access' : 'active';
}

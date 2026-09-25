import type { Role } from '@/shared/domain';

/** A platform account as seen by an admin. */
export interface ManagedUser {
  readonly id: string;
  /** Null only for accounts created before emails were mirrored onto profiles. */
  readonly email: string | null;
  readonly displayName: string;
  readonly role: Role;
  readonly createdAt: Date;
}

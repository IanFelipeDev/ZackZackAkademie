import type { Role } from './role';

export const PASSWORD_MIN_LENGTH = 8;

export interface User {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: Role;
  /** Still on the temporary password from the access email; must choose their own before using the app. */
  readonly mustChangePassword: boolean;
}

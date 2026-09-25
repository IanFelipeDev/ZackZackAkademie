import type { Role } from './role';

export const PASSWORD_MIN_LENGTH = 8;

export interface User {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: Role;
}

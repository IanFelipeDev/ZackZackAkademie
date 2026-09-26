import type { Role } from './role';

export const PASSWORD_MIN_LENGTH = 8;

/** Mirrors the Supabase Auth policy: at least PASSWORD_MIN_LENGTH characters, with letters and digits. */
export function isStrongPassword(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH && /[a-z]/i.test(password) && /\d/.test(password);
}

export interface User {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: Role;
  /** Still on the temporary password from the access email; must choose their own before using the app. */
  readonly mustChangePassword: boolean;
}

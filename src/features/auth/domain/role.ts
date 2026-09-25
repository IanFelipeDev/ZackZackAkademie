export const ROLES = ['student', 'teacher', 'admin'] as const;

export type Role = (typeof ROLES)[number];

const STAFF_ROLES: readonly Role[] = ['teacher', 'admin'];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** Staff can review submissions and manage content (ARCHITECTURE §8). */
export function isStaff(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

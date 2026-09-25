// Public API of the auth feature for other features. Everything else is internal.
export { isStaff, type Role } from './domain/role';
export { ACCEPT_INVITE_PATH } from './presentation/auth-paths';
export type { User } from './domain/user';
export { useAuth, useSignedInUser } from './presentation/auth-provider';
export { RequireRole } from './presentation/require-role';

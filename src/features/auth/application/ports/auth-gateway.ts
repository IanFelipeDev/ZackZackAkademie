import type { User } from '../../domain/user';

/**
 * Accounts are created only by admin invitation (see the users feature), so there is no sign-up here.
 */
export interface AuthGateway {
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  requestPasswordReset(email: string, redirectTo: string): Promise<void>;
  updatePassword(newPassword: string): Promise<void>;
  /** Registers a listener for sign-in/sign-out events and returns an unsubscribe function. */
  onAuthStateChange(listener: () => void): () => void;
}

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
  /**
   * Records that the signed-in user is active right now, for "online" and "last access" in user
   * administration. The server identifies the user from the session and stamps the time; without a session it
   * does nothing.
   */
  markActive(): Promise<void>;
  /**
   * Registers a listener that fires when the signed-in user changes (sign-in, sign-out, another account) and
   * returns an unsubscribe function. Session refreshes for the same user must not fire it.
   */
  onAuthStateChange(listener: () => void): () => void;
}

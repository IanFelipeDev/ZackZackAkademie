import type { User } from '../../domain/user';

export interface SignUpData {
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
}

export interface SignUpOutcome {
  /** True when the backend requires the user to click the confirmation email before signing in. */
  readonly needsEmailConfirmation: boolean;
}

export interface AuthGateway {
  signIn(email: string, password: string): Promise<void>;
  signUp(data: SignUpData): Promise<SignUpOutcome>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  requestPasswordReset(email: string, redirectTo: string): Promise<void>;
  updatePassword(newPassword: string): Promise<void>;
  /** Registers a listener for sign-in/sign-out events and returns an unsubscribe function. */
  onAuthStateChange(listener: () => void): () => void;
}

import { InvalidCredentialsError, SamePasswordError } from '../../domain/errors';
import type { User } from '../../domain/user';
import type { AuthGateway } from '../ports/auth-gateway';

interface StoredAccount {
  user: User;
  password: string;
}

/** Test double for AuthGateway. Accounts are added with addAccount, mirroring admin invitations. */
export class InMemoryAuthGateway implements AuthGateway {
  private readonly accounts = new Map<string, StoredAccount>();
  private readonly listeners = new Set<() => void>();
  private currentEmail: string | null = null;
  readonly passwordResetRequests: { email: string; redirectTo: string }[] = [];

  addAccount(user: User, password: string): void {
    this.accounts.set(user.email, { user, password });
  }

  signInAs(email: string): void {
    this.currentEmail = email;
  }

  signIn(email: string, password: string): Promise<void> {
    const account = this.accounts.get(email);
    if (!account || account.password !== password) return Promise.reject(new InvalidCredentialsError());
    this.currentEmail = email;
    this.notify();
    return Promise.resolve();
  }

  signOut(): Promise<void> {
    this.currentEmail = null;
    this.notify();
    return Promise.resolve();
  }

  getCurrentUser(): Promise<User | null> {
    const account = this.currentEmail ? this.accounts.get(this.currentEmail) : undefined;
    return Promise.resolve(account?.user ?? null);
  }

  requestPasswordReset(email: string, redirectTo: string): Promise<void> {
    this.passwordResetRequests.push({ email, redirectTo });
    return Promise.resolve();
  }

  updatePassword(newPassword: string): Promise<void> {
    const account = this.currentEmail ? this.accounts.get(this.currentEmail) : undefined;
    // Mirrors Supabase Auth, which rejects reusing the current password.
    if (account?.password === newPassword) return Promise.reject(new SamePasswordError());
    if (account) {
      account.password = newPassword;
      // Mirrors the clear_temporary_password database trigger.
      account.user = { ...account.user, mustChangePassword: false };
    }
    this.notify();
    return Promise.resolve();
  }

  onAuthStateChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }
}

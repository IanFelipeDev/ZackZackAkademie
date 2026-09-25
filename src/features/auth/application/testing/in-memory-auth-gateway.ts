import { EmailAlreadyRegisteredError, InvalidCredentialsError } from '../../domain/errors';
import type { User } from '../../domain/user';
import type { AuthGateway, SignUpData, SignUpOutcome } from '../ports/auth-gateway';

interface StoredAccount {
  readonly user: User;
  password: string;
}

/** Test double for AuthGateway. Accounts live in memory; every new account is a student. */
export class InMemoryAuthGateway implements AuthGateway {
  private readonly accounts = new Map<string, StoredAccount>();
  private readonly listeners = new Set<() => void>();
  private currentEmail: string | null = null;
  readonly passwordResetRequests: { email: string; redirectTo: string }[] = [];

  constructor(private readonly requireEmailConfirmation = false) {}

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

  signUp(data: SignUpData): Promise<SignUpOutcome> {
    if (this.accounts.has(data.email)) return Promise.reject(new EmailAlreadyRegisteredError());
    const user: User = {
      id: `user-${this.accounts.size + 1}`,
      email: data.email,
      displayName: data.displayName,
      role: 'student',
    };
    this.addAccount(user, data.password);
    if (!this.requireEmailConfirmation) this.currentEmail = data.email;
    this.notify();
    return Promise.resolve({ needsEmailConfirmation: this.requireEmailConfirmation });
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
    if (account) account.password = newPassword;
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

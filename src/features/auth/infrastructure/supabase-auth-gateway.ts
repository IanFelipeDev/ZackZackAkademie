import type { AuthError } from '@supabase/supabase-js';
import { RepositoryError } from '@/shared/infrastructure/repository-error';
import type { AppSupabaseClient } from '@/shared/infrastructure/supabase/client';
import type { AuthGateway } from '../application/ports/auth-gateway';
import { EmailNotConfirmedError, InvalidCredentialsError, WeakPasswordError } from '../domain/errors';
import type { User } from '../domain/user';

function toDomainError(error: AuthError): Error {
  switch (error.code) {
    case 'invalid_credentials':
      return new InvalidCredentialsError({ cause: error });
    case 'email_not_confirmed':
      return new EmailNotConfirmedError({ cause: error });
    case 'weak_password':
      return new WeakPasswordError({ cause: error });
    default:
      return new RepositoryError(`Auth request failed: ${error.message}`, { cause: error });
  }
}

export class SupabaseAuthGateway implements AuthGateway {
  constructor(private readonly client: AppSupabaseClient) {}

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw toDomainError(error);
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw toDomainError(error);
  }

  async getCurrentUser(): Promise<User | null> {
    const { data, error } = await this.client.auth.getSession();
    if (error) throw toDomainError(error);
    const authUser = data.session?.user;
    if (!authUser) return null;

    const { data: profile, error: profileError } = await this.client
      .from('profiles')
      .select('display_name, role')
      .eq('id', authUser.id)
      .single();
    if (profileError) throw new RepositoryError('Failed to load profile', { cause: profileError });

    return {
      id: authUser.id,
      email: authUser.email ?? '',
      displayName: profile.display_name,
      role: profile.role,
    };
  }

  async requestPasswordReset(email: string, redirectTo: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw toDomainError(error);
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await this.client.auth.updateUser({ password: newPassword });
    if (error) throw toDomainError(error);
  }

  onAuthStateChange(listener: () => void): () => void {
    const { data } = this.client.auth.onAuthStateChange((event) => {
      // Token refreshes do not change who is signed in; skip them to avoid needless refetches.
      if (event === 'TOKEN_REFRESHED') return;
      // Supabase warns against awaiting other client calls inside this callback, so defer the listener.
      setTimeout(listener, 0);
    });
    return () => data.subscription.unsubscribe();
  }
}

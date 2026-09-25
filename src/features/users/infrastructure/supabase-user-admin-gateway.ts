import { FunctionsHttpError } from '@supabase/supabase-js';
import type { Role } from '@/shared/domain';
import { RepositoryError } from '@/shared/infrastructure/repository-error';
import type { AppSupabaseClient } from '@/shared/infrastructure/supabase/client';
import type { UserAdminGateway } from '../application/ports/user-admin-gateway';
import { InviteEmailTakenError, UserAdminForbiddenError } from '../domain/errors';
import type { Invitation } from '../domain/invitation';
import type { ManagedUser } from '../domain/managed-user';

const INVITE_FUNCTION = 'invite-user';

/** Reads the `code` field the invite-user Edge Function puts in error responses. */
async function functionErrorCode(error: unknown): Promise<string | null> {
  if (!(error instanceof FunctionsHttpError)) return null;
  try {
    const body: unknown = await (error.context as Response).json();
    if (typeof body === 'object' && body !== null && 'code' in body && typeof body.code === 'string') {
      return body.code;
    }
  } catch {
    // Non-JSON error body: fall through to the generic error.
  }
  return null;
}

export class SupabaseUserAdminGateway implements UserAdminGateway {
  constructor(private readonly client: AppSupabaseClient) {}

  async listUsers(): Promise<ManagedUser[]> {
    const { data, error } = await this.client
      .from('profiles')
      .select('id, email, display_name, role, created_at')
      .order('display_name');
    if (error) throw new RepositoryError('Failed to list users', { cause: error });
    return data.map((row) => ({
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      createdAt: new Date(row.created_at),
    }));
  }

  async invite(invitation: Invitation, redirectTo: string): Promise<void> {
    const response = await this.client.functions.invoke<unknown>(INVITE_FUNCTION, {
      body: {
        email: invitation.email,
        displayName: invitation.displayName,
        role: invitation.role,
        redirectTo,
      },
    });
    // functions-js types the failure's error as `any`; narrow it explicitly.
    const error: unknown = response.error;
    if (!error) return;
    const code = await functionErrorCode(error);
    if (code === 'email_already_registered') throw new InviteEmailTakenError();
    if (code === 'not_admin' || code === 'unauthenticated')
      throw new UserAdminForbiddenError({ cause: error });
    throw new RepositoryError(`Invite failed${code ? ` (${code})` : ''}`, { cause: error });
  }

  async changeRole(userId: string, role: Role): Promise<void> {
    // RLS silently filters rows the caller may not update, so check that one row actually changed.
    const { data, error } = await this.client.from('profiles').update({ role }).eq('id', userId).select('id');
    if (error) throw new RepositoryError('Failed to change role', { cause: error });
    if (data.length === 0) throw new UserAdminForbiddenError();
  }
}

import { FunctionsHttpError } from '@supabase/supabase-js';
import type { Role } from '@/shared/domain';
import { RepositoryError } from '@/shared/infrastructure/repository-error';
import type { AppSupabaseClient } from '@/shared/infrastructure/supabase/client';
import type { UserAdminGateway } from '../application/ports/user-admin-gateway';
import {
  CannotManageOwnAccountError,
  EmailNotConfiguredError,
  InviteDeliveryError,
  InviteEmailTakenError,
  UserAdminForbiddenError,
  UserDeactivatedError,
} from '../domain/errors';
import type { Invitation } from '../domain/invitation';
import { accessStatusOf, type ManagedUser } from '../domain/managed-user';

const INVITE_FUNCTION = 'invite-user';
const MANAGE_FUNCTION = 'manage-user';

/** Reads the `code` field the Edge Functions put in error responses. */
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

function toDomainError(code: string | null, cause: unknown): Error {
  switch (code) {
    case 'email_already_registered':
      return new InviteEmailTakenError();
    case 'email_not_configured':
      return new EmailNotConfiguredError();
    case 'invite_failed':
      return new InviteDeliveryError({ cause });
    case 'user_deactivated':
      return new UserDeactivatedError();
    case 'cannot_manage_self':
      return new CannotManageOwnAccountError();
    case 'not_admin':
    case 'unauthenticated':
      return new UserAdminForbiddenError({ cause });
    default:
      return new RepositoryError(`User admin request failed${code ? ` (${code})` : ''}`, { cause });
  }
}

const toDate = (value: string | null) => (value ? new Date(value) : null);

export class SupabaseUserAdminGateway implements UserAdminGateway {
  constructor(private readonly client: AppSupabaseClient) {}

  async listUsers(): Promise<ManagedUser[]> {
    const { data, error } = await this.client
      .from('profiles')
      .select('id, email, display_name, role, created_at, must_change_password, deactivated_at')
      .order('display_name');
    if (error) throw new RepositoryError('Failed to list users', { cause: error });
    return data.map((row) => ({
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      createdAt: new Date(row.created_at),
      accessStatus: accessStatusOf({
        deactivatedAt: toDate(row.deactivated_at),
        mustChangePassword: row.must_change_password,
      }),
    }));
  }

  invite(invitation: Invitation, loginUrl: string): Promise<void> {
    return this.callFunction(INVITE_FUNCTION, {
      email: invitation.email,
      displayName: invitation.displayName,
      role: invitation.role,
      loginUrl,
    });
  }

  async changeRole(userId: string, role: Role): Promise<void> {
    // RLS silently filters rows the caller may not update, so check that one row actually changed.
    const { data, error } = await this.client.from('profiles').update({ role }).eq('id', userId).select('id');
    if (error) throw new RepositoryError('Failed to change role', { cause: error });
    if (data.length === 0) throw new UserAdminForbiddenError();
  }

  resendAccess(userId: string, loginUrl: string): Promise<void> {
    return this.callFunction(MANAGE_FUNCTION, { action: 'resend_access', userId, loginUrl });
  }

  deactivate(userId: string): Promise<void> {
    return this.callFunction(MANAGE_FUNCTION, { action: 'deactivate', userId });
  }

  reactivate(userId: string): Promise<void> {
    return this.callFunction(MANAGE_FUNCTION, { action: 'reactivate', userId });
  }

  private async callFunction(name: string, body: Record<string, unknown>): Promise<void> {
    const response = await this.client.functions.invoke<unknown>(name, { body });
    // functions-js types the failure's error as `any`; narrow it explicitly.
    const error: unknown = response.error;
    if (!error) return;
    throw toDomainError(await functionErrorCode(error), error);
  }
}

import type { Role } from '@/shared/domain';
import { Invitation } from '../../domain/invitation';
import type { UserAdminGateway } from '../ports/user-admin-gateway';

export interface InviteUserInput {
  readonly email: string;
  readonly displayName: string;
  readonly role: Role;
}

/**
 * Creates an account with the chosen role and emails the person a temporary password, which they must change
 * on first sign-in.
 *
 * @throws {InvalidInvitationError} when the email or name is invalid
 * @throws {InviteEmailTakenError} when the email is already registered
 * @throws {EmailNotConfiguredError} when no email provider is configured
 */
export class InviteUser {
  constructor(private readonly users: UserAdminGateway) {}

  async execute(input: InviteUserInput, loginUrl: string): Promise<Invitation> {
    const invitation = Invitation.create(input);
    await this.users.invite(invitation, loginUrl);
    return invitation;
  }
}

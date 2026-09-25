import { DomainError } from '@/shared/domain';

export type InvitationField = 'email' | 'displayName';

export class InvalidInvitationError extends DomainError {
  readonly code = 'invalid_invitation';

  constructor(readonly field: InvitationField) {
    super(`Invalid invitation ${field}`);
  }
}

export class InviteEmailTakenError extends DomainError {
  readonly code = 'invite_email_taken';

  constructor() {
    super('An account with this email already exists');
  }
}

export class CannotChangeOwnRoleError extends DomainError {
  readonly code = 'cannot_change_own_role';

  constructor() {
    super('Admins cannot change their own role');
  }
}

export class UserAdminForbiddenError extends DomainError {
  readonly code = 'user_admin_forbidden';

  constructor(options?: ErrorOptions) {
    super('Only admins can manage users', options);
  }
}

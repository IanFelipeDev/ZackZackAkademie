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

/** Admins cannot change the role of, resend access to, deactivate or delete their own account. */
export class CannotManageOwnAccountError extends DomainError {
  readonly code = 'cannot_manage_own_account';

  constructor() {
    super('Admins cannot manage their own account');
  }
}

export class UserAdminForbiddenError extends DomainError {
  readonly code = 'user_admin_forbidden';

  constructor(options?: ErrorOptions) {
    super('Only admins can manage users', options);
  }
}

/** No email provider is configured, so no temporary password can be delivered. */
export class EmailNotConfiguredError extends DomainError {
  readonly code = 'email_not_configured';

  constructor() {
    super('Email delivery is not configured');
  }
}

/** The account could not be created or the access email could not be sent. */
export class InviteDeliveryError extends DomainError {
  readonly code = 'invite_delivery_failed';

  constructor(options?: ErrorOptions) {
    super('The access email could not be sent', options);
  }
}

/** Teachers who reviewed submissions cannot be deleted: the feedback belongs to the students' history. */
export class UserHasReviewsError extends DomainError {
  readonly code = 'user_has_reviews';

  constructor() {
    super('The account has given feedback and cannot be deleted');
  }
}

export class UserDeactivatedError extends DomainError {
  readonly code = 'user_deactivated';

  constructor() {
    super('The account is deactivated');
  }
}

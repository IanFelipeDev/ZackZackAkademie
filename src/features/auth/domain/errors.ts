import { DomainError } from '@/shared/domain';

export class InvalidCredentialsError extends DomainError {
  readonly code = 'invalid_credentials';

  constructor(options?: ErrorOptions) {
    super('Email or password is incorrect', options);
  }
}

export class EmailNotConfirmedError extends DomainError {
  readonly code = 'email_not_confirmed';

  constructor(options?: ErrorOptions) {
    super('Email address has not been confirmed yet', options);
  }
}

/** Deactivated by an admin. */
export class AccessBlockedError extends DomainError {
  readonly code = 'access_blocked';

  constructor(options?: ErrorOptions) {
    super('Access to this account is blocked', options);
  }
}

/** The new password equals the current one (e.g. reusing the temporary password on first access). */
export class SamePasswordError extends DomainError {
  readonly code = 'same_password';

  constructor(options?: ErrorOptions) {
    super('The new password must differ from the current one', options);
  }
}

export class WeakPasswordError extends DomainError {
  readonly code = 'weak_password';

  constructor(options?: ErrorOptions) {
    super('Password does not meet the minimum requirements', options);
  }
}

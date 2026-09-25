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

/** Deactivated by an admin, or the temporary password expired unused. */
export class AccessBlockedError extends DomainError {
  readonly code = 'access_blocked';

  constructor(options?: ErrorOptions) {
    super('Access to this account is blocked', options);
  }
}

export class WeakPasswordError extends DomainError {
  readonly code = 'weak_password';

  constructor(options?: ErrorOptions) {
    super('Password does not meet the minimum requirements', options);
  }
}

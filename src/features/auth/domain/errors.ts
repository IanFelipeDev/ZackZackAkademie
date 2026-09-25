import { DomainError } from '@/shared/domain';

export class InvalidCredentialsError extends DomainError {
  readonly code = 'invalid_credentials';

  constructor(options?: ErrorOptions) {
    super('Email or password is incorrect', options);
  }
}

export class EmailAlreadyRegisteredError extends DomainError {
  readonly code = 'email_already_registered';

  constructor(options?: ErrorOptions) {
    super('This email is already registered', options);
  }
}

export class EmailNotConfirmedError extends DomainError {
  readonly code = 'email_not_confirmed';

  constructor(options?: ErrorOptions) {
    super('Email address has not been confirmed yet', options);
  }
}

export class WeakPasswordError extends DomainError {
  readonly code = 'weak_password';

  constructor(options?: ErrorOptions) {
    super('Password does not meet the minimum requirements', options);
  }
}

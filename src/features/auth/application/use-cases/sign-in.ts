import type { AuthGateway } from '../ports/auth-gateway';

export interface SignInInput {
  readonly email: string;
  readonly password: string;
}

/**
 * Starts a session with email and password.
 *
 * @throws {InvalidCredentialsError} when the email/password pair is wrong
 * @throws {EmailNotConfirmedError} when the account still awaits email confirmation
 */
export class SignIn {
  constructor(private readonly auth: AuthGateway) {}

  execute(input: SignInInput): Promise<void> {
    return this.auth.signIn(input.email.trim().toLowerCase(), input.password);
  }
}

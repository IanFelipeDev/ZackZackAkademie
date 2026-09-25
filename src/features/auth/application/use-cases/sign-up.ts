import type { AuthGateway, SignUpData, SignUpOutcome } from '../ports/auth-gateway';

/**
 * Registers a new account. The database always creates it as a `student`;
 * the role is never sent from the client (ARCHITECTURE §7).
 *
 * @throws {EmailAlreadyRegisteredError} when the email is taken
 * @throws {WeakPasswordError} when the backend rejects the password
 */
export class SignUp {
  constructor(private readonly auth: AuthGateway) {}

  execute(input: SignUpData): Promise<SignUpOutcome> {
    return this.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      displayName: input.displayName.trim(),
    });
  }
}

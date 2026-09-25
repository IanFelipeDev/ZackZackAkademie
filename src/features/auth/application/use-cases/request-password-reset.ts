import type { AuthGateway } from '../ports/auth-gateway';

/** Sends a reset link. Succeeds even for unknown emails so accounts cannot be enumerated. */
export class RequestPasswordReset {
  constructor(private readonly auth: AuthGateway) {}

  execute(email: string, redirectTo: string): Promise<void> {
    return this.auth.requestPasswordReset(email.trim().toLowerCase(), redirectTo);
  }
}

import type { AuthGateway } from '../ports/auth-gateway';

export class SignOut {
  constructor(private readonly auth: AuthGateway) {}

  execute(): Promise<void> {
    return this.auth.signOut();
  }
}

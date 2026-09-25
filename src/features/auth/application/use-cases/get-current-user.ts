import type { User } from '../../domain/user';
import type { AuthGateway } from '../ports/auth-gateway';

/** Returns the signed-in user with their profile, or null when there is no session. */
export class GetCurrentUser {
  constructor(private readonly auth: AuthGateway) {}

  execute(): Promise<User | null> {
    return this.auth.getCurrentUser();
  }
}

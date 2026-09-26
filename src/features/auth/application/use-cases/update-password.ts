import { WeakPasswordError } from '../../domain/errors';
import { isStrongPassword } from '../../domain/user';
import type { AuthGateway } from '../ports/auth-gateway';

/**
 * Sets a new password for the user in the current (recovery) session.
 *
 * @throws {WeakPasswordError} when the password fails isStrongPassword
 * @throws {SamePasswordError} when it equals the current password (enforced by Supabase Auth)
 */
export class UpdatePassword {
  constructor(private readonly auth: AuthGateway) {}

  async execute(newPassword: string): Promise<void> {
    if (!isStrongPassword(newPassword)) throw new WeakPasswordError();
    await this.auth.updatePassword(newPassword);
  }
}

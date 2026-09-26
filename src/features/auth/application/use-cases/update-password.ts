import { WeakPasswordError } from '../../domain/errors';
import { PASSWORD_MIN_LENGTH } from '../../domain/user';
import type { AuthGateway } from '../ports/auth-gateway';

/**
 * Sets a new password for the user in the current (recovery) session.
 *
 * @throws {WeakPasswordError} when the password is shorter than PASSWORD_MIN_LENGTH
 * @throws {SamePasswordError} when it equals the current password (enforced by Supabase Auth)
 */
export class UpdatePassword {
  constructor(private readonly auth: AuthGateway) {}

  async execute(newPassword: string): Promise<void> {
    if (newPassword.length < PASSWORD_MIN_LENGTH) throw new WeakPasswordError();
    await this.auth.updatePassword(newPassword);
  }
}

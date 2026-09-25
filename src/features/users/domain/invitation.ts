import type { Role } from '@/shared/domain';
import { InvalidInvitationError } from './errors';

export const DISPLAY_NAME_MIN_LENGTH = 2;
export const DISPLAY_NAME_MAX_LENGTH = 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** An admin's request to give someone access. The Edge Function re-validates it server side. */
export class Invitation {
  private constructor(
    readonly email: string,
    readonly displayName: string,
    readonly role: Role,
  ) {}

  /** @throws {InvalidInvitationError} when the email or display name is invalid */
  static create(props: { email: string; displayName: string; role: Role }): Invitation {
    const email = props.email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) throw new InvalidInvitationError('email');
    const displayName = props.displayName.trim();
    if (displayName.length < DISPLAY_NAME_MIN_LENGTH || displayName.length > DISPLAY_NAME_MAX_LENGTH) {
      throw new InvalidInvitationError('displayName');
    }
    return new Invitation(email, displayName, props.role);
  }
}

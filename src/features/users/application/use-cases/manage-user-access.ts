import { CannotManageOwnAccountError } from '../../domain/errors';
import type { UserAdminGateway } from '../ports/user-admin-gateway';

export interface AccountActionInput {
  readonly actorId: string;
  readonly userId: string;
}

function ensureNotSelf(input: AccountActionInput): void {
  if (input.actorId === input.userId) throw new CannotManageOwnAccountError();
}

/**
 * Emails a new temporary password, e.g. when the first one expired or was lost.
 *
 * @throws {CannotManageOwnAccountError} when the admin targets their own account
 * @throws {UserDeactivatedError} when the account is deactivated (reactivate it first)
 */
export class ResendAccess {
  constructor(private readonly users: UserAdminGateway) {}

  async execute(input: AccountActionInput, loginUrl: string): Promise<void> {
    ensureNotSelf(input);
    await this.users.resendAccess(input.userId, loginUrl);
  }
}

/**
 * Blocks the account without deleting anything: submissions and feedback stay in place.
 *
 * @throws {CannotManageOwnAccountError} when the admin targets their own account
 */
export class DeactivateUser {
  constructor(private readonly users: UserAdminGateway) {}

  async execute(input: AccountActionInput): Promise<void> {
    ensureNotSelf(input);
    await this.users.deactivate(input.userId);
  }
}

/**
 * Permanently deletes the account with its drafts, submissions and the feedback on them. Cannot be undone.
 *
 * @throws {CannotManageOwnAccountError} when the admin targets their own account
 * @throws {UserHasReviewsError} when the account has given feedback (deactivate it instead)
 */
export class DeleteUser {
  constructor(private readonly users: UserAdminGateway) {}

  async execute(input: AccountActionInput): Promise<void> {
    ensureNotSelf(input);
    await this.users.delete(input.userId);
  }
}

/** @throws {CannotManageOwnAccountError} when the admin targets their own account */
export class ReactivateUser {
  constructor(private readonly users: UserAdminGateway) {}

  async execute(input: AccountActionInput): Promise<void> {
    ensureNotSelf(input);
    await this.users.reactivate(input.userId);
  }
}

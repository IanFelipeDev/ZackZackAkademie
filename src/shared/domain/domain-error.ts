/**
 * Base class for business-rule violations. Presentation maps each subclass to a user-facing message,
 * so subclasses carry a stable `code` instead of relying on `message` text.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

import type { AuthGateway } from '../ports/auth-gateway';

/** Heartbeat behind "online now" and "last access" in user administration. */
export class RecordActivity {
  constructor(private readonly auth: AuthGateway) {}

  execute(): Promise<void> {
    return this.auth.markActive();
  }
}

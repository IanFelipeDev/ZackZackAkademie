import type { ManagedUser } from '../../domain/managed-user';
import type { UserAdminGateway } from '../ports/user-admin-gateway';

export class ListUsers {
  constructor(private readonly users: UserAdminGateway) {}

  execute(): Promise<ManagedUser[]> {
    return this.users.listUsers();
  }
}

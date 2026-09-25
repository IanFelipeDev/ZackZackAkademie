import { beforeEach, describe, expect, it } from 'vitest';
import { CannotChangeOwnRoleError, InvalidInvitationError, InviteEmailTakenError } from '../../domain/errors';
import { InMemoryUserAdminGateway } from '../testing/in-memory-user-admin-gateway';
import { ChangeUserRole } from './change-user-role';
import { InviteUser } from './invite-user';
import { ListUsers } from './list-users';

const REDIRECT = 'https://app.example/definir-senha';
let gateway: InMemoryUserAdminGateway;

beforeEach(() => {
  gateway = new InMemoryUserAdminGateway();
  gateway.users.push(
    { id: 'admin-1', email: 'ian@example.com', displayName: 'Ian', role: 'admin', createdAt: new Date() },
    { id: 'student-1', email: 'bia@example.com', displayName: 'Bia', role: 'student', createdAt: new Date() },
  );
});

describe('InviteUser', () => {
  it('normalizes the invitation and sends it with the redirect URL', async () => {
    await new InviteUser(gateway).execute(
      { email: ' Melissa@Example.com ', displayName: ' Melissa ', role: 'teacher' },
      REDIRECT,
    );

    expect(gateway.invitations).toHaveLength(1);
    expect(gateway.invitations[0]?.invitation).toMatchObject({
      email: 'melissa@example.com',
      displayName: 'Melissa',
      role: 'teacher',
    });
    expect(gateway.invitations[0]?.redirectTo).toBe(REDIRECT);
  });

  it.each([
    ['email', { email: 'nope', displayName: 'Ana', role: 'student' as const }],
    ['displayName', { email: 'ana@example.com', displayName: ' A ', role: 'student' as const }],
  ])('rejects an invalid %s without calling the backend', async (field, input) => {
    const result = new InviteUser(gateway).execute(input, REDIRECT);

    await expect(result).rejects.toBeInstanceOf(InvalidInvitationError);
    await expect(result).rejects.toMatchObject({ field });
    expect(gateway.invitations).toHaveLength(0);
  });

  it('reports an email that is already registered', async () => {
    await expect(
      new InviteUser(gateway).execute(
        { email: 'bia@example.com', displayName: 'Bia', role: 'student' },
        REDIRECT,
      ),
    ).rejects.toBeInstanceOf(InviteEmailTakenError);
  });
});

describe('ChangeUserRole', () => {
  it("changes another user's role", async () => {
    await new ChangeUserRole(gateway).execute({ actorId: 'admin-1', userId: 'student-1', role: 'teacher' });

    const users = await new ListUsers(gateway).execute();
    expect(users.find((u) => u.id === 'student-1')?.role).toBe('teacher');
  });

  it('does not let an admin change their own role', async () => {
    await expect(
      new ChangeUserRole(gateway).execute({ actorId: 'admin-1', userId: 'admin-1', role: 'student' }),
    ).rejects.toBeInstanceOf(CannotChangeOwnRoleError);
  });
});

describe('ListUsers', () => {
  it('sorts users by display name', async () => {
    const users = await new ListUsers(gateway).execute();
    expect(users.map((u) => u.displayName)).toEqual(['Bia', 'Ian']);
  });
});

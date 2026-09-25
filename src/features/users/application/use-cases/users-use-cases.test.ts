import { beforeEach, describe, expect, it } from 'vitest';
import {
  CannotManageOwnAccountError,
  InvalidInvitationError,
  InviteEmailTakenError,
  UserDeactivatedError,
} from '../../domain/errors';
import { accessStatusOf, type ManagedUser } from '../../domain/managed-user';
import { InMemoryUserAdminGateway } from '../testing/in-memory-user-admin-gateway';
import { ChangeUserRole } from './change-user-role';
import { InviteUser } from './invite-user';
import { ListUsers } from './list-users';
import { DeactivateUser, ReactivateUser, ResendAccess } from './manage-user-access';

const LOGIN_URL = 'https://app.example/entrar';
const ADMIN = 'admin-1';
const STUDENT = 'student-1';

function buildUser(overrides: Partial<ManagedUser>): ManagedUser {
  return {
    id: 'user',
    email: 'user@example.com',
    displayName: 'User',
    role: 'student',
    createdAt: new Date(),
    accessStatus: 'active',
    temporaryPasswordExpiresAt: null,
    ...overrides,
  };
}

let gateway: InMemoryUserAdminGateway;

beforeEach(() => {
  gateway = new InMemoryUserAdminGateway();
  gateway.users.push(
    buildUser({ id: ADMIN, email: 'ian@example.com', displayName: 'Ian', role: 'admin' }),
    buildUser({ id: STUDENT, email: 'bia@example.com', displayName: 'Bia' }),
  );
});

describe('InviteUser', () => {
  it('normalizes the invitation and emails the temporary password with the login link', async () => {
    await new InviteUser(gateway).execute(
      { email: ' Melissa@Example.com ', displayName: ' Melissa ', role: 'teacher' },
      LOGIN_URL,
    );

    const invited = gateway.users.find((u) => u.email === 'melissa@example.com');
    expect(invited).toMatchObject({
      displayName: 'Melissa',
      role: 'teacher',
      accessStatus: 'pending_first_access',
    });
    expect(gateway.sentEmails).toEqual([{ userId: invited?.id, loginUrl: LOGIN_URL }]);
  });

  it.each([
    ['email', { email: 'nope', displayName: 'Ana', role: 'student' as const }],
    ['displayName', { email: 'ana@example.com', displayName: ' A ', role: 'student' as const }],
  ])('rejects an invalid %s without calling the backend', async (field, input) => {
    const result = new InviteUser(gateway).execute(input, LOGIN_URL);

    await expect(result).rejects.toBeInstanceOf(InvalidInvitationError);
    await expect(result).rejects.toMatchObject({ field });
    expect(gateway.sentEmails).toHaveLength(0);
  });

  it('reports an email that is already registered', async () => {
    await expect(
      new InviteUser(gateway).execute(
        { email: 'bia@example.com', displayName: 'Bia', role: 'student' },
        LOGIN_URL,
      ),
    ).rejects.toBeInstanceOf(InviteEmailTakenError);
  });
});

describe('ChangeUserRole', () => {
  it("changes another user's role", async () => {
    await new ChangeUserRole(gateway).execute({ actorId: ADMIN, userId: STUDENT, role: 'teacher' });
    expect(gateway.users.find((u) => u.id === STUDENT)?.role).toBe('teacher');
  });
});

describe('account access', () => {
  it('deactivates and reactivates another account', async () => {
    await new DeactivateUser(gateway).execute({ actorId: ADMIN, userId: STUDENT });
    expect(gateway.users.find((u) => u.id === STUDENT)?.accessStatus).toBe('deactivated');

    await new ReactivateUser(gateway).execute({ actorId: ADMIN, userId: STUDENT });
    expect(gateway.users.find((u) => u.id === STUDENT)?.accessStatus).toBe('active');
  });

  it('resends access with a fresh temporary password', async () => {
    await new ResendAccess(gateway).execute({ actorId: ADMIN, userId: STUDENT }, LOGIN_URL);

    expect(gateway.users.find((u) => u.id === STUDENT)?.accessStatus).toBe('pending_first_access');
    expect(gateway.sentEmails).toEqual([{ userId: STUDENT, loginUrl: LOGIN_URL }]);
  });

  it('does not resend access to a deactivated account', async () => {
    await new DeactivateUser(gateway).execute({ actorId: ADMIN, userId: STUDENT });

    await expect(
      new ResendAccess(gateway).execute({ actorId: ADMIN, userId: STUDENT }, LOGIN_URL),
    ).rejects.toBeInstanceOf(UserDeactivatedError);
  });

  it.each([
    [
      'change their own role',
      () => new ChangeUserRole(gateway).execute({ actorId: ADMIN, userId: ADMIN, role: 'student' }),
    ],
    ['deactivate themselves', () => new DeactivateUser(gateway).execute({ actorId: ADMIN, userId: ADMIN })],
    ['reactivate themselves', () => new ReactivateUser(gateway).execute({ actorId: ADMIN, userId: ADMIN })],
    [
      'resend their own access',
      () => new ResendAccess(gateway).execute({ actorId: ADMIN, userId: ADMIN }, LOGIN_URL),
    ],
  ])('does not let an admin %s', async (_, action) => {
    await expect(action()).rejects.toBeInstanceOf(CannotManageOwnAccountError);
  });
});

describe('ListUsers', () => {
  it('sorts users by display name', async () => {
    const users = await new ListUsers(gateway).execute();
    expect(users.map((u) => u.displayName)).toEqual(['Bia', 'Ian']);
  });
});

describe('accessStatusOf', () => {
  const now = new Date('2026-09-25T12:00:00Z');
  const base = { deactivatedAt: null, mustChangePassword: false, temporaryPasswordExpiresAt: null };

  it('derives the status from the stored access state', () => {
    expect(accessStatusOf(base, now)).toBe('active');
    expect(accessStatusOf({ ...base, deactivatedAt: now }, now)).toBe('deactivated');
    expect(
      accessStatusOf(
        { ...base, mustChangePassword: true, temporaryPasswordExpiresAt: new Date('2026-10-01T00:00:00Z') },
        now,
      ),
    ).toBe('pending_first_access');
    expect(
      accessStatusOf(
        { ...base, mustChangePassword: true, temporaryPasswordExpiresAt: new Date('2026-09-20T00:00:00Z') },
        now,
      ),
    ).toBe('access_expired');
  });

  it('treats a deactivated account as deactivated even while its first access is pending', () => {
    expect(
      accessStatusOf({ deactivatedAt: now, mustChangePassword: true, temporaryPasswordExpiresAt: now }, now),
    ).toBe('deactivated');
  });
});

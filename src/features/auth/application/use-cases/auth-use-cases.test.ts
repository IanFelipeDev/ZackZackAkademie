import { describe, expect, it } from 'vitest';
import { InvalidCredentialsError, WeakPasswordError } from '../../domain/errors';
import { isRole, isStaff } from '../../domain/role';
import type { User } from '../../domain/user';
import { InMemoryAuthGateway } from '../testing/in-memory-auth-gateway';
import { GetCurrentUser } from './get-current-user';
import { RequestPasswordReset } from './request-password-reset';
import { SignIn } from './sign-in';
import { SignOut } from './sign-out';
import { UpdatePassword } from './update-password';

const ANA: User = { id: 'user-1', email: 'ana@example.com', displayName: 'Ana', role: 'student' };
const PASSWORD = 'secret123';

function setup() {
  const gateway = new InMemoryAuthGateway();
  gateway.addAccount(ANA, PASSWORD);
  return {
    gateway,
    signIn: new SignIn(gateway),
    signOut: new SignOut(gateway),
    getCurrentUser: new GetCurrentUser(gateway),
  };
}

describe('auth use cases', () => {
  it('signs in with a normalized email and signs out again', async () => {
    const { signIn, signOut, getCurrentUser } = setup();

    await signIn.execute({ email: '  ANA@example.com ', password: PASSWORD });
    expect(await getCurrentUser.execute()).toEqual(ANA);

    await signOut.execute();
    expect(await getCurrentUser.execute()).toBeNull();
  });

  it('rejects a wrong password', async () => {
    const { signIn } = setup();

    await expect(signIn.execute({ email: ANA.email, password: 'nope' })).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
  });

  it('requests a password reset with a normalized email', async () => {
    const { gateway } = setup();

    await new RequestPasswordReset(gateway).execute(' Ana@Example.com', 'https://app/redefinir-senha');

    expect(gateway.passwordResetRequests).toEqual([
      { email: 'ana@example.com', redirectTo: 'https://app/redefinir-senha' },
    ]);
  });

  it('rejects a new password shorter than the minimum', async () => {
    await expect(new UpdatePassword(new InMemoryAuthGateway()).execute('short')).rejects.toBeInstanceOf(
      WeakPasswordError,
    );
  });

  it('updates the password of the signed-in user', async () => {
    const { gateway, signIn, signOut } = setup();
    await signIn.execute({ email: ANA.email, password: PASSWORD });

    await new UpdatePassword(gateway).execute('new-secret-1');
    await signOut.execute();

    await expect(signIn.execute({ email: ANA.email, password: 'new-secret-1' })).resolves.toBeUndefined();
  });
});

describe('roles', () => {
  it('recognizes staff roles', () => {
    expect(isStaff('teacher')).toBe(true);
    expect(isStaff('admin')).toBe(true);
    expect(isStaff('student')).toBe(false);
  });

  it('validates role strings', () => {
    expect(isRole('teacher')).toBe(true);
    expect(isRole('superuser')).toBe(false);
  });
});

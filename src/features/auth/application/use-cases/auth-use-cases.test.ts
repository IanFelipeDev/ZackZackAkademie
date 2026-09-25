import { describe, expect, it } from 'vitest';
import { InvalidCredentialsError, WeakPasswordError } from '../../domain/errors';
import { isRole, isStaff } from '../../domain/role';
import { InMemoryAuthGateway } from '../testing/in-memory-auth-gateway';
import { GetCurrentUser } from './get-current-user';
import { RequestPasswordReset } from './request-password-reset';
import { SignIn } from './sign-in';
import { SignOut } from './sign-out';
import { SignUp } from './sign-up';
import { UpdatePassword } from './update-password';

function setup() {
  const gateway = new InMemoryAuthGateway();
  return {
    gateway,
    signUp: new SignUp(gateway),
    signIn: new SignIn(gateway),
    signOut: new SignOut(gateway),
    getCurrentUser: new GetCurrentUser(gateway),
  };
}

describe('auth use cases', () => {
  it('registers new accounts as students with a trimmed display name and normalized email', async () => {
    const { signUp, getCurrentUser } = setup();

    await signUp.execute({ email: '  Ana@Example.com ', password: 'secret123', displayName: '  Ana ' });

    await expect(getCurrentUser.execute()).resolves.toMatchObject({
      email: 'ana@example.com',
      displayName: 'Ana',
      role: 'student',
    });
  });

  it('signs in with normalized email and signs out again', async () => {
    const { signUp, signIn, signOut, getCurrentUser } = setup();
    await signUp.execute({ email: 'ana@example.com', password: 'secret123', displayName: 'Ana' });
    await signOut.execute();

    await signIn.execute({ email: 'ANA@example.com', password: 'secret123' });
    expect(await getCurrentUser.execute()).not.toBeNull();

    await signOut.execute();
    expect(await getCurrentUser.execute()).toBeNull();
  });

  it('rejects a wrong password', async () => {
    const { signUp, signIn } = setup();
    await signUp.execute({ email: 'ana@example.com', password: 'secret123', displayName: 'Ana' });

    await expect(signIn.execute({ email: 'ana@example.com', password: 'nope' })).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
  });

  it('requests a password reset with a normalized email', async () => {
    const gateway = new InMemoryAuthGateway();

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
    const { gateway, signUp, signIn, signOut } = setup();
    await signUp.execute({ email: 'ana@example.com', password: 'secret123', displayName: 'Ana' });

    await new UpdatePassword(gateway).execute('new-secret-1');
    await signOut.execute();

    await expect(
      signIn.execute({ email: 'ana@example.com', password: 'new-secret-1' }),
    ).resolves.toBeUndefined();
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

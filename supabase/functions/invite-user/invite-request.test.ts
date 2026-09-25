import { describe, expect, it } from 'vitest';
import { parseInviteRequest } from './invite-request';

const valid = {
  email: '  Ana@Example.com ',
  displayName: ' Ana ',
  role: 'teacher',
  redirectTo: 'https://zackzack.vercel.app/definir-senha',
};

describe('parseInviteRequest', () => {
  it('normalizes a valid request', () => {
    expect(parseInviteRequest(valid)).toEqual({
      ok: true,
      value: {
        email: 'ana@example.com',
        displayName: 'Ana',
        role: 'teacher',
        redirectTo: 'https://zackzack.vercel.app/definir-senha',
      },
    });
  });

  it.each([
    ['a non-object body', null],
    ['an invalid email', { ...valid, email: 'not-an-email' }],
    ['a too short name', { ...valid, displayName: 'A' }],
    ['an unknown role', { ...valid, role: 'superuser' }],
    ['a redirect to another page', { ...valid, redirectTo: 'https://evil.example/login' }],
    ['a non-http redirect', { ...valid, redirectTo: 'javascript:alert(1)//definir-senha' }],
  ])('rejects %s', (_, body) => {
    expect(parseInviteRequest(body).ok).toBe(false);
  });
});

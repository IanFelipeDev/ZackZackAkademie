import { describe, expect, it } from 'vitest';
import { buildAccessEmail } from './access-email';
import { parseInviteRequest, parseManageRequest } from './requests';
import { generateTemporaryPassword, TEMPORARY_PASSWORD_LENGTH } from './temporary-password';

const LOGIN_URL = 'https://zackzack.vercel.app/entrar';
const USER_ID = '5f0c4a7e-1b2c-4d3e-8f9a-0b1c2d3e4f5a';

describe('generateTemporaryPassword', () => {
  it('has the expected length and every character class', () => {
    for (let run = 0; run < 50; run++) {
      const password = generateTemporaryPassword();
      expect(password).toHaveLength(TEMPORARY_PASSWORD_LENGTH);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[2-9]/);
      expect(password).not.toMatch(/[01OIl]/);
    }
  });

  it('is different every time', () => {
    const passwords = new Set(Array.from({ length: 100 }, () => generateTemporaryPassword()));
    expect(passwords.size).toBe(100);
  });
});

describe('buildAccessEmail', () => {
  const input = {
    displayName: 'Ana <script>',
    email: 'ana@example.com',
    temporaryPassword: 'Ab3xYz9KmN2pQr',
    loginUrl: LOGIN_URL,
  };

  it('contains the credentials and the login link', () => {
    const message = buildAccessEmail(input);
    expect(message.to).toBe('ana@example.com');
    expect(message.html).toContain('Ab3xYz9KmN2pQr');
    expect(message.html).toContain(LOGIN_URL);
    expect(message.html).toContain('diferente desta');
    expect(message.text).toContain('Senha temporária: Ab3xYz9KmN2pQr');
    expect(message.html).toContain('src="https://zackzack.vercel.app/brand/logo-512.png"');
  });

  it('escapes user-provided text in the HTML', () => {
    const { html } = buildAccessEmail(input);
    expect(html).toContain('Ana &lt;script&gt;');
    expect(html).not.toContain('<script>');
  });
});

describe('parseInviteRequest', () => {
  const valid = { email: '  Ana@Example.com ', displayName: ' Ana ', role: 'teacher', loginUrl: LOGIN_URL };

  it('normalizes a valid request', () => {
    expect(parseInviteRequest(valid)).toEqual({
      ok: true,
      value: { email: 'ana@example.com', displayName: 'Ana', role: 'teacher', loginUrl: LOGIN_URL },
    });
  });

  it.each([
    ['a non-object body', null],
    ['an invalid email', { ...valid, email: 'not-an-email' }],
    ['a too short name', { ...valid, displayName: 'A' }],
    ['an unknown role', { ...valid, role: 'superuser' }],
    ['a login URL for another page', { ...valid, loginUrl: 'https://evil.example/phishing' }],
    ['a non-http login URL', { ...valid, loginUrl: 'javascript:alert(1)//entrar' }],
  ])('rejects %s', (_, body) => {
    expect(parseInviteRequest(body).ok).toBe(false);
  });
});

describe('parseManageRequest', () => {
  it('does not need a login URL to deactivate', () => {
    expect(parseManageRequest({ action: 'deactivate', userId: USER_ID })).toEqual({
      ok: true,
      value: { action: 'deactivate', userId: USER_ID, loginUrl: null },
    });
  });

  it('accepts a known action for a user id', () => {
    expect(parseManageRequest({ action: 'deactivate', userId: USER_ID, loginUrl: LOGIN_URL })).toEqual({
      ok: true,
      value: { action: 'deactivate', userId: USER_ID, loginUrl: LOGIN_URL },
    });
  });

  it.each([
    ['an unknown action', { action: 'delete', userId: USER_ID, loginUrl: LOGIN_URL }],
    ['a malformed user id', { action: 'deactivate', userId: 'abc', loginUrl: LOGIN_URL }],
    ['resend_access without a login URL', { action: 'resend_access', userId: USER_ID }],
  ])('rejects %s', (_, body) => {
    expect(parseManageRequest(body).ok).toBe(false);
  });
});

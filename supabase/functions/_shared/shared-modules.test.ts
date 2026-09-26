import { describe, expect, it } from 'vitest';
import { buildAccessEmail } from './access-email';
import { buildProviderRequest, parseSender } from './email-providers';
import { isAllowedLoginUrl, parseInviteRequest, parseManageRequest, parseSiteOrigins } from './requests';
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

describe('site origins', () => {
  it('parses the comma-separated secret into origins, skipping junk', () => {
    expect(parseSiteOrigins(' https://zackzack.vercel.app/ ,http://localhost:5173,ftp://x, ,nope')).toEqual([
      'https://zackzack.vercel.app',
      'http://localhost:5173',
    ]);
    expect(parseSiteOrigins(undefined)).toEqual([]);
  });

  it('only allows login links to a configured site', () => {
    const origins = ['https://zackzack.vercel.app'];
    expect(isAllowedLoginUrl('https://zackzack.vercel.app/entrar', origins)).toBe(true);
    expect(isAllowedLoginUrl('https://evil.example/entrar', origins)).toBe(false);
    expect(isAllowedLoginUrl('https://zackzack.vercel.app.evil.example/entrar', origins)).toBe(false);
    expect(isAllowedLoginUrl('https://zackzack.vercel.app/entrar', [])).toBe(false);
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

describe('email providers', () => {
  const message = {
    to: 'ana@example.com',
    subject: 'Assunto',
    html: '<p>Oi</p>',
    text: 'Oi',
  };

  it('parses the sender with and without a display name', () => {
    expect(parseSender('Zack Zack Akademie <escola@gmail.com>')).toEqual({
      name: 'Zack Zack Akademie',
      email: 'escola@gmail.com',
    });
    expect(parseSender('escola@gmail.com')).toEqual({ name: null, email: 'escola@gmail.com' });
    expect(parseSender('not an address')).toBeNull();
  });

  it('builds a Brevo request with the API key header', () => {
    const sender = { name: 'Zack Zack Akademie', email: 'escola@gmail.com' };
    const request = buildProviderRequest('brevo', 'xkeysib-123', sender, message);

    expect(request.url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(request.headers['api-key']).toBe('xkeysib-123');
    expect(JSON.parse(request.body)).toEqual({
      sender,
      to: [{ email: 'ana@example.com' }],
      subject: 'Assunto',
      htmlContent: '<p>Oi</p>',
      textContent: 'Oi',
    });
  });

  it('builds a Resend request with a bearer token', () => {
    const request = buildProviderRequest(
      'resend',
      're_123',
      { name: null, email: 'acesso@escola.com' },
      message,
    );

    expect(request.url).toBe('https://api.resend.com/emails');
    expect(request.headers.Authorization).toBe('Bearer re_123');
    expect(JSON.parse(request.body)).toMatchObject({ from: 'acesso@escola.com', to: ['ana@example.com'] });
  });
});

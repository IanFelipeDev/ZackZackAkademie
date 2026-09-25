// Pure request validation for the invite-user Edge Function. No Deno or npm imports, so Vitest can test it.

export const INVITABLE_ROLES = ['student', 'teacher', 'admin'] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

/** The page that lets an invited user choose a password. Must be in the Auth redirect allow-list. */
export const ACCEPT_INVITE_PATH = '/definir-senha';

const DISPLAY_NAME_MIN_LENGTH = 2;
const DISPLAY_NAME_MAX_LENGTH = 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface InviteRequest {
  readonly email: string;
  readonly displayName: string;
  readonly role: InvitableRole;
  readonly redirectTo: string;
}

export type ParseResult = { ok: true; value: InviteRequest } | { ok: false; error: string };

function isInvitableRole(value: unknown): value is InvitableRole {
  return typeof value === 'string' && (INVITABLE_ROLES as readonly string[]).includes(value);
}

function isAcceptInviteUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.pathname === ACCEPT_INVITE_PATH;
  } catch {
    return false;
  }
}

export function parseInviteRequest(body: unknown): ParseResult {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'Body must be a JSON object' };
  const { email, displayName, role, redirectTo } = body as Record<string, unknown>;

  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!EMAIL_PATTERN.test(normalizedEmail)) return { ok: false, error: 'Invalid email' };

  const name = typeof displayName === 'string' ? displayName.trim() : '';
  if (name.length < DISPLAY_NAME_MIN_LENGTH || name.length > DISPLAY_NAME_MAX_LENGTH) {
    return { ok: false, error: 'Invalid display name' };
  }

  if (!isInvitableRole(role)) return { ok: false, error: 'Invalid role' };
  if (typeof redirectTo !== 'string' || !isAcceptInviteUrl(redirectTo)) {
    return { ok: false, error: 'Invalid redirect URL' };
  }

  return { ok: true, value: { email: normalizedEmail, displayName: name, role, redirectTo } };
}

// Pure request validation shared by the Edge Functions. No Deno or npm imports, so Vitest can test it.

export const INVITABLE_ROLES = ['student', 'teacher', 'admin'] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

/** Login page linked from the access email. */
export const LOGIN_PATH = '/entrar';

const DISPLAY_NAME_MIN_LENGTH = 2;
const DISPLAY_NAME_MAX_LENGTH = 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

export interface InviteRequest {
  readonly email: string;
  readonly displayName: string;
  readonly role: InvitableRole;
  readonly loginUrl: string;
}

export const MANAGE_ACTIONS = ['resend_access', 'deactivate', 'reactivate'] as const;
export type ManageAction = (typeof MANAGE_ACTIONS)[number];

export interface ManageRequest {
  readonly action: ManageAction;
  readonly userId: string;
  /** Required for resend_access, which emails a login link; ignored otherwise. */
  readonly loginUrl: string | null;
}

function asRecord(body: unknown): Record<string, unknown> | null {
  return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : null;
}

function parseLoginUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    const isHttp = url.protocol === 'https:' || url.protocol === 'http:';
    return isHttp && url.pathname === LOGIN_PATH ? url.toString() : null;
  } catch {
    return null;
  }
}

function includes<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value);
}

export function parseInviteRequest(body: unknown): ParseResult<InviteRequest> {
  const record = asRecord(body);
  if (!record) return { ok: false, error: 'Body must be a JSON object' };

  const email = typeof record.email === 'string' ? record.email.trim().toLowerCase() : '';
  if (!EMAIL_PATTERN.test(email)) return { ok: false, error: 'Invalid email' };

  const displayName = typeof record.displayName === 'string' ? record.displayName.trim() : '';
  if (displayName.length < DISPLAY_NAME_MIN_LENGTH || displayName.length > DISPLAY_NAME_MAX_LENGTH) {
    return { ok: false, error: 'Invalid display name' };
  }

  if (!includes(INVITABLE_ROLES, record.role)) return { ok: false, error: 'Invalid role' };
  const loginUrl = parseLoginUrl(record.loginUrl);
  if (!loginUrl) return { ok: false, error: 'Invalid login URL' };

  return { ok: true, value: { email, displayName, role: record.role, loginUrl } };
}

export function parseManageRequest(body: unknown): ParseResult<ManageRequest> {
  const record = asRecord(body);
  if (!record) return { ok: false, error: 'Body must be a JSON object' };
  if (!includes(MANAGE_ACTIONS, record.action)) return { ok: false, error: 'Invalid action' };
  if (typeof record.userId !== 'string' || !UUID_PATTERN.test(record.userId)) {
    return { ok: false, error: 'Invalid user id' };
  }
  const loginUrl = parseLoginUrl(record.loginUrl);
  if (record.action === 'resend_access' && !loginUrl) return { ok: false, error: 'Invalid login URL' };
  return { ok: true, value: { action: record.action, userId: record.userId, loginUrl } };
}

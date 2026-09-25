import { FunctionsHttpError } from '@supabase/supabase-js';
import { beforeAll, describe, expect, it } from 'vitest';
import { adminClient, anonClient, createUser, type TestUser } from './supabase-test-env';

const REDIRECT_TO = 'http://localhost:5173/definir-senha';

let admin: TestUser;
let teacher: TestUser;
let student: TestUser;

beforeAll(async () => {
  [admin, teacher, student] = await Promise.all([createUser('admin'), createUser('teacher'), createUser()]);
});

async function roleOf(userId: string) {
  const { data } = await adminClient.from('profiles').select('role').eq('id', userId).single();
  return data?.role;
}

async function invite(
  caller: TestUser,
  email: string,
  role: string,
): Promise<{ data: unknown; error: unknown }> {
  // functions-js types the failure's error as `any`; expose both fields as unknown.
  const response = await caller.client.functions.invoke<unknown>('invite-user', {
    body: { email, displayName: 'Convidada', role, redirectTo: REDIRECT_TO },
  });
  return { data: response.data, error: response.error as unknown };
}

function statusOf(error: unknown): number | null {
  return error instanceof FunctionsHttpError ? (error.context as Response).status : null;
}

describe('role management (RLS)', () => {
  it('lets an admin list every profile with its email', async () => {
    const { data } = await admin.client.from('profiles').select('id, email').eq('id', student.id).single();
    expect(data?.email).toMatch(/@example\.test$/);
  });

  it("lets an admin change another user's role", async () => {
    const other = await createUser();
    await admin.client.from('profiles').update({ role: 'teacher' }).eq('id', other.id);
    expect(await roleOf(other.id)).toBe('teacher');
  });

  it('does not let an admin change their own role', async () => {
    const { data } = await admin.client
      .from('profiles')
      .update({ role: 'student' })
      .eq('id', admin.id)
      .select('id');
    expect(data).toHaveLength(0);
    expect(await roleOf(admin.id)).toBe('admin');
  });

  it('does not let teachers change roles', async () => {
    await teacher.client.from('profiles').update({ role: 'admin' }).eq('id', student.id);
    expect(await roleOf(student.id)).toBe('student');
  });

  it('does not let users edit the mirrored email', async () => {
    const { error } = await student.client
      .from('profiles')
      .update({ email: 'spoofed@example.test' })
      .eq('id', student.id);
    expect(error).not.toBeNull();
  });
});

describe('self sign-up', () => {
  it('is disabled: accounts only come from admin invitations', async () => {
    const { error } = await anonClient().auth.signUp({
      email: `self-${crypto.randomUUID()}@example.test`,
      password: 'some-password-123',
    });
    expect(error).not.toBeNull();
  });
});

describe('invite-user Edge Function (works with sign-up disabled)', () => {
  it('invites a user with the chosen role', async () => {
    const email = `invitee-${crypto.randomUUID()}@example.test`;

    const { data, error } = await invite(admin, email, 'teacher');

    expect(error).toBeNull();
    const userId = (data as { userId: string }).userId;
    const { data: profile } = await adminClient
      .from('profiles')
      .select('email, display_name, role')
      .eq('id', userId)
      .single();
    expect(profile).toEqual({ email, display_name: 'Convidada', role: 'teacher' });
  });

  it('rejects an email that already has an account', async () => {
    const email = `dup-${crypto.randomUUID()}@example.test`;
    await invite(admin, email, 'student');

    const { error } = await invite(admin, email, 'student');

    expect(statusOf(error)).toBe(409);
  });

  it('refuses callers who are not admins', async () => {
    const { error } = await invite(teacher, `nope-${crypto.randomUUID()}@example.test`, 'admin');
    expect(statusOf(error)).toBe(403);
  });

  it('validates the request', async () => {
    const { error } = await invite(admin, 'not-an-email', 'student');
    expect(statusOf(error)).toBe(400);
  });
});

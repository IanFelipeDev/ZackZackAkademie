import { FunctionsHttpError } from '@supabase/supabase-js';
import { beforeAll, describe, expect, it } from 'vitest';
import { adminClient, anonClient, createUser, firstExerciseId, type TestUser } from './supabase-test-env';

const LOGIN_URL = 'http://localhost:5173/entrar';

let admin: TestUser;
let teacher: TestUser;
let student: TestUser;

beforeAll(async () => {
  [admin, teacher, student] = await Promise.all([createUser('admin'), createUser('teacher'), createUser()]);
});

async function profileOf(userId: string) {
  const { data } = await adminClient
    .from('profiles')
    .select('role, email, display_name, must_change_password, deactivated_at')
    .eq('id', userId)
    .single();
  return data;
}

async function callFunction(
  caller: TestUser,
  name: 'invite-user' | 'manage-user',
  body: Record<string, unknown>,
): Promise<{ data: unknown; error: unknown }> {
  // functions-js types the failure's error as `any`; expose both fields as unknown.
  const response = await caller.client.functions.invoke<unknown>(name, { body });
  return { data: response.data, error: response.error as unknown };
}

function statusOf(error: unknown): number | null {
  return error instanceof FunctionsHttpError ? (error.context as Response).status : null;
}

/** A user whose password the test knows, to check what sign-in does. */
async function createUserWithPassword(password: string) {
  const email = `known-${crypto.randomUUID()}@example.test`;
  const { data, error } = await adminClient.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  return { id: data.user.id, email };
}

async function signIn(email: string, password: string) {
  const client = anonClient();
  const result = await client.auth.signInWithPassword({ email, password });
  return { client, error: result.error };
}

describe('role management (RLS)', () => {
  it('lets an admin list every profile with its email', async () => {
    const { data } = await admin.client.from('profiles').select('email').eq('id', student.id).single();
    expect(data?.email).toMatch(/@example\.test$/);
  });

  it("lets an admin change another user's role but not their own", async () => {
    const other = await createUser();
    await admin.client.from('profiles').update({ role: 'teacher' }).eq('id', other.id);
    const { data } = await admin.client
      .from('profiles')
      .update({ role: 'student' })
      .eq('id', admin.id)
      .select('id');

    expect((await profileOf(other.id))?.role).toBe('teacher');
    expect(data).toHaveLength(0);
    expect((await profileOf(admin.id))?.role).toBe('admin');
  });

  it('does not let teachers change roles', async () => {
    await teacher.client.from('profiles').update({ role: 'admin' }).eq('id', student.id);
    expect((await profileOf(student.id))?.role).toBe('student');
  });

  it('does not let users edit the server-managed columns', async () => {
    const attempts = await Promise.all([
      student.client.from('profiles').update({ email: 'spoofed@example.test' }).eq('id', student.id),
      student.client.from('profiles').update({ must_change_password: false }).eq('id', student.id),
      student.client.from('profiles').update({ deactivated_at: null }).eq('id', student.id),
    ]);
    attempts.forEach(({ error }) => expect(error).not.toBeNull());
  });
});

describe('self sign-up', () => {
  it('is disabled: accounts only come from admins', async () => {
    const { error } = await anonClient().auth.signUp({
      email: `self-${crypto.randomUUID()}@example.test`,
      password: 'some-password-123',
    });
    expect(error).not.toBeNull();
  });
});

describe('invite-user Edge Function', () => {
  it('creates the account with the chosen role and a pending temporary password', async () => {
    const email = `invitee-${crypto.randomUUID()}@example.test`;

    const { data, error } = await callFunction(admin, 'invite-user', {
      email,
      displayName: 'Convidada',
      role: 'teacher',
      loginUrl: LOGIN_URL,
    });

    expect(error).toBeNull();
    const profile = await profileOf((data as { userId: string }).userId);
    expect(profile).toMatchObject({
      email,
      display_name: 'Convidada',
      role: 'teacher',
      must_change_password: true,
    });
    expect(JSON.stringify(data)).not.toMatch(/password/i);
  });

  it('rejects an email that already has an account', async () => {
    const body = {
      email: `dup-${crypto.randomUUID()}@example.test`,
      displayName: 'Dup',
      role: 'student',
      loginUrl: LOGIN_URL,
    };
    await callFunction(admin, 'invite-user', body);

    const { error } = await callFunction(admin, 'invite-user', body);

    expect(statusOf(error)).toBe(409);
  });

  it('refuses callers who are not admins and validates the request', async () => {
    const asTeacher = await callFunction(teacher, 'invite-user', {
      email: `nope-${crypto.randomUUID()}@example.test`,
      displayName: 'Nope',
      role: 'admin',
      loginUrl: LOGIN_URL,
    });
    const invalid = await callFunction(admin, 'invite-user', {
      email: 'x',
      displayName: 'X',
      role: 'student',
      loginUrl: LOGIN_URL,
    });

    expect(statusOf(asTeacher.error)).toBe(403);
    expect(statusOf(invalid.error)).toBe(400);
  });
});

describe('temporary passwords', () => {
  it('clears the first-access flag when the user changes the password', async () => {
    const user = await createUserWithPassword('Temp0rary22xyz');
    await adminClient.from('profiles').update({ must_change_password: true }).eq('id', user.id);

    const { client } = await signIn(user.email, 'Temp0rary22xyz');
    await client.auth.updateUser({ password: 'my-own-password-1' });

    expect((await profileOf(user.id))?.must_change_password).toBe(false);
  });

  it('keeps the temporary password valid until the first sign-in, however long it takes', async () => {
    const user = await createUserWithPassword('Temp0rary22xyz');
    await adminClient.from('profiles').update({ must_change_password: true }).eq('id', user.id);

    const { error } = await signIn(user.email, 'Temp0rary22xyz');

    expect(error).toBeNull();
    expect((await profileOf(user.id))?.must_change_password).toBe(true);
  });

  it('rejects reusing the temporary password as the new one', async () => {
    const user = await createUserWithPassword('Temp0rary22xyz');
    await adminClient.from('profiles').update({ must_change_password: true }).eq('id', user.id);

    const { client } = await signIn(user.email, 'Temp0rary22xyz');
    const { error } = await client.auth.updateUser({ password: 'Temp0rary22xyz' });

    expect(error?.code).toBe('same_password');
    expect((await profileOf(user.id))?.must_change_password).toBe(true);
  });
});

describe('manage-user Edge Function', () => {
  it('deactivates an account: sign-in blocked and permissions gone, history kept', async () => {
    const user = await createUserWithPassword('Password-123');
    const before = await signIn(user.email, 'Password-123');
    expect(before.error).toBeNull();

    const { error } = await callFunction(admin, 'manage-user', { action: 'deactivate', userId: user.id });

    expect(error).toBeNull();
    expect((await profileOf(user.id))?.deactivated_at).not.toBeNull();
    expect((await signIn(user.email, 'Password-123')).error?.code).toBe('user_banned');
    // The session opened before deactivation can no longer act as a student.
    const { error: submitError } = await before.client.from('writing_submissions').insert({
      exercise_id: await firstExerciseId(student.client),
      student_id: user.id,
      attempt_number: 1,
      content: 'x',
    });
    expect(submitError).not.toBeNull();
  });

  it('reactivates an account', async () => {
    const user = await createUserWithPassword('Password-123');
    await callFunction(admin, 'manage-user', { action: 'deactivate', userId: user.id });

    await callFunction(admin, 'manage-user', { action: 'reactivate', userId: user.id });

    expect((await profileOf(user.id))?.deactivated_at).toBeNull();
    expect((await signIn(user.email, 'Password-123')).error).toBeNull();
  });

  it('resends access: new temporary password, the old one stops working', async () => {
    const user = await createUserWithPassword('Old-password-1');

    const { error } = await callFunction(admin, 'manage-user', {
      action: 'resend_access',
      userId: user.id,
      loginUrl: LOGIN_URL,
    });

    expect(error).toBeNull();
    expect((await profileOf(user.id))?.must_change_password).toBe(true);
    expect((await signIn(user.email, 'Old-password-1')).error?.code).toBe('invalid_credentials');
  });

  it('refuses to act on the admin themself or for non-admins', async () => {
    const onSelf = await callFunction(admin, 'manage-user', { action: 'deactivate', userId: admin.id });
    const asTeacher = await callFunction(teacher, 'manage-user', {
      action: 'deactivate',
      userId: student.id,
    });

    expect(statusOf(onSelf.error)).toBe(400);
    expect(statusOf(asTeacher.error)).toBe(403);
    expect((await profileOf(student.id))?.deactivated_at).toBeNull();
  });
});

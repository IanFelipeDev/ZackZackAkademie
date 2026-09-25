import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/shared/infrastructure/supabase/database.types';

/**
 * Integration tests run only against a disposable local stack (`supabase start`, done in CI).
 * They must never point at the hosted project, so the URL is required to be local.
 */
function requireEnv(name: string): string {
  const value = process.env[name]?.replace(/^"|"$/g, '');
  if (!value) throw new Error(`Missing ${name}. Run \`supabase status -o env\` against a local stack.`);
  return value;
}

export const API_URL = requireEnv('API_URL');
if (!/^http:\/\/(127\.0\.0\.1|localhost)/.test(API_URL)) {
  throw new Error(`Refusing to run integration tests against ${API_URL}; use the local Supabase stack.`);
}
const ANON_KEY = requireEnv('ANON_KEY');
const SERVICE_ROLE_KEY = requireEnv('SERVICE_ROLE_KEY');

export type TestClient = SupabaseClient<Database>;

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } } as const;

export const adminClient: TestClient = createClient<Database>(API_URL, SERVICE_ROLE_KEY, clientOptions);

export function anonClient(): TestClient {
  return createClient<Database>(API_URL, ANON_KEY, clientOptions);
}

export interface TestUser {
  readonly id: string;
  readonly client: TestClient;
}

const PASSWORD = 'integration-test-password';

/** Creates a confirmed user, optionally promotes it (as admin would), and returns a signed-in client. */
export async function createUser(
  role: Database['public']['Enums']['app_role'] = 'student',
): Promise<TestUser> {
  const email = `${role}-${crypto.randomUUID()}@example.test`;
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: `Test ${role}` },
  });
  if (error) throw error;
  if (role !== 'student') {
    const { error: roleError } = await adminClient.from('profiles').update({ role }).eq('id', data.user.id);
    if (roleError) throw roleError;
  }
  const client = anonClient();
  const { error: signInError } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signInError) throw signInError;
  return { id: data.user.id, client };
}

export async function firstExerciseId(client: TestClient): Promise<string> {
  const { data, error } = await client.from('exercises').select('id').limit(1).single();
  if (error) throw error;
  return data.id;
}

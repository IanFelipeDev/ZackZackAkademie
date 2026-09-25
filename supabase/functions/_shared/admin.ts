import { createClient } from 'npm:@supabase/supabase-js@2';
import { json } from './http.ts';

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

/** Service-role client. Bypasses RLS, so every handler must call requireAdmin first. */
export const adminClient = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Resolves the caller from the Authorization header and checks, server side, that they are an active admin.
 * Returns the caller id, or the error Response to send back.
 */
export async function requireAdmin(request: Request): Promise<{ callerId: string } | Response> {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { code: 'unauthenticated' });

  const { data, error } = await adminClient.auth.getUser(token);
  if (error || !data.user) return json(401, { code: 'unauthenticated' });

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role, deactivated_at')
    .eq('id', data.user.id)
    .single();
  if (profile?.role !== 'admin' || profile.deactivated_at !== null) return json(403, { code: 'not_admin' });

  return { callerId: data.user.id };
}

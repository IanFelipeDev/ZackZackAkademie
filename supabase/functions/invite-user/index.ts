// Invites a user by email and assigns their role. Only admins may call it.
// Runs on Supabase Edge Functions (Deno); the service role key never leaves the server.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { parseInviteRequest } from './invite-request.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

const admin = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function isCallerAdmin(authorization: string | null): Promise<boolean | null> {
  const token = authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile } = await admin.from('profiles').select('role').eq('id', data.user.id).single();
  return profile?.role === 'admin';
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return json(405, { code: 'method_not_allowed' });

  const isAdmin = await isCallerAdmin(request.headers.get('Authorization'));
  if (isAdmin === null) return json(401, { code: 'unauthenticated' });
  if (!isAdmin) return json(403, { code: 'not_admin' });

  const parsed = parseInviteRequest(await request.json().catch(() => null));
  if (!parsed.ok) return json(400, { code: 'invalid_request', message: parsed.error });
  const { email, displayName, role, redirectTo } = parsed.value;

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { display_name: displayName },
    redirectTo,
  });
  if (error?.code === 'email_exists' || error?.status === 422) {
    return json(409, { code: 'email_already_registered' });
  }
  if (error || !data.user) {
    console.error('invite failed', error);
    return json(502, { code: 'invite_failed' });
  }

  // The on_auth_user_created trigger already created the profile as a student.
  const { error: roleError } = await admin.from('profiles').update({ role }).eq('id', data.user.id);
  if (roleError) {
    console.error('role update failed', roleError);
    return json(500, { code: 'role_update_failed', userId: data.user.id });
  }

  return json(200, { userId: data.user.id });
});

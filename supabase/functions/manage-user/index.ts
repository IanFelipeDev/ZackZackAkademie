// Account actions for admins: resend first access (new temporary password), deactivate, reactivate.
// Deactivation bans sign-in and removes role permissions (app_current_role) but keeps all history.
import { buildAccessEmail } from '../_shared/access-email.ts';
import { adminClient, requireAdmin } from '../_shared/admin.ts';
import { isEmailConfigured, sendEmail } from '../_shared/email-transport.ts';
import { json, preflight, readJson } from '../_shared/http.ts';
import { parseManageRequest } from '../_shared/requests.ts';
import { generateTemporaryPassword, temporaryPasswordExpiry } from '../_shared/temporary-password.ts';

/** Supabase has no permanent ban; 100 years is what its dashboard uses. */
const PERMANENT_BAN = '876000h';

interface TargetProfile {
  readonly display_name: string;
  readonly email: string | null;
  readonly deactivated_at: string | null;
}

async function resendAccess(userId: string, profile: TargetProfile, loginUrl: string): Promise<Response> {
  if (profile.deactivated_at) return json(409, { code: 'user_deactivated' });
  if (!profile.email) return json(409, { code: 'user_without_email' });
  if (!isEmailConfigured()) return json(503, { code: 'email_not_configured' });

  const temporaryPassword = generateTemporaryPassword();
  const expiresAt = temporaryPasswordExpiry();

  // Also lifts a ban left by an expired temporary password. Changing the password fires the
  // clear_temporary_password trigger, so the flag is set again right after.
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: temporaryPassword,
    ban_duration: 'none',
  });
  if (error) {
    console.error('password reset failed', error.message);
    return json(502, { code: 'resend_failed' });
  }
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ must_change_password: true, temporary_password_expires_at: expiresAt.toISOString() })
    .eq('id', userId);
  if (profileError) return json(500, { code: 'resend_failed' });

  try {
    await sendEmail(
      buildAccessEmail({
        displayName: profile.display_name,
        email: profile.email,
        temporaryPassword,
        loginUrl,
        expiresAt,
      }),
    );
  } catch (sendError) {
    console.error('access email failed', sendError instanceof Error ? sendError.message : sendError);
    return json(502, { code: 'invite_failed' });
  }
  return json(200, { userId });
}

async function setActive(userId: string, isActive: boolean): Promise<Response> {
  // Profile first: app_current_role() stops granting permissions immediately, even for live sessions.
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ deactivated_at: isActive ? null : new Date().toISOString() })
    .eq('id', userId);
  if (profileError) return json(500, { code: 'update_failed' });

  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: isActive ? 'none' : PERMANENT_BAN,
  });
  if (error) {
    console.error('ban update failed', error.message);
    return json(502, { code: 'update_failed' });
  }
  return json(200, { userId });
}

Deno.serve(async (request) => {
  const early = preflight(request);
  if (early) return early;

  const caller = await requireAdmin(request);
  if (caller instanceof Response) return caller;

  const parsed = parseManageRequest(await readJson(request));
  if (!parsed.ok) return json(400, { code: 'invalid_request', message: parsed.error });
  const { action, userId, loginUrl } = parsed.value;
  if (userId === caller.callerId) return json(400, { code: 'cannot_manage_self' });

  const { data: profile } = await adminClient
    .from('profiles')
    .select('display_name, email, deactivated_at')
    .eq('id', userId)
    .maybeSingle();
  if (!profile) return json(404, { code: 'user_not_found' });

  switch (action) {
    case 'resend_access':
      // parseManageRequest guarantees a login URL for this action.
      return loginUrl ? resendAccess(userId, profile, loginUrl) : json(400, { code: 'invalid_request' });
    case 'deactivate':
      return setActive(userId, false);
    case 'reactivate':
      return setActive(userId, true);
  }
});

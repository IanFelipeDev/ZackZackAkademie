// Account actions for admins: resend first access (new temporary password, the old one stops working),
// deactivate, reactivate, delete.
// Deactivation bans sign-in and removes role permissions (app_current_role) but keeps all history.
// Deletion is permanent (ADR-0007): the profile, drafts, submissions and the feedback on them go with the account.
import { buildAccessEmail } from '../_shared/access-email.ts';
import { adminClient, requireAdmin } from '../_shared/admin.ts';
import { isEmailConfigured, sendEmail } from '../_shared/email-transport.ts';
import { json, preflight, readJson } from '../_shared/http.ts';
import { isAllowedLoginUrl, parseManageRequest, parseSiteOrigins } from '../_shared/requests.ts';
import { generateTemporaryPassword } from '../_shared/temporary-password.ts';

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
  const siteOrigins = parseSiteOrigins(Deno.env.get('SITE_ORIGINS'));
  if (!isEmailConfigured() || siteOrigins.length === 0) return json(503, { code: 'email_not_configured' });
  if (!isAllowedLoginUrl(loginUrl, siteOrigins)) {
    return json(400, { code: 'invalid_request', message: 'Login URL is not an allowed site' });
  }

  const temporaryPassword = generateTemporaryPassword();

  // Changing the password fires the clear_temporary_password trigger, so the flag is set again right after.
  const { error } = await adminClient.auth.admin.updateUserById(userId, { password: temporaryPassword });
  if (error) {
    console.error('password reset failed', error.message);
    return json(502, { code: 'resend_failed' });
  }
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ must_change_password: true })
    .eq('id', userId);
  if (profileError) return json(500, { code: 'resend_failed' });

  try {
    await sendEmail(
      buildAccessEmail({
        displayName: profile.display_name,
        email: profile.email,
        temporaryPassword,
        loginUrl,
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

async function countGivenBy(table: 'feedback' | 'speaking_assessments', userId: string) {
  return adminClient.from(table).select('id', { count: 'exact', head: true }).eq('teacher_id', userId);
}

const RECORDINGS_BUCKET = 'speaking-recordings';

/** Removes every Sprechen recording in the user's folder (`<user id>/…`); the practices go with the account. */
async function deleteRecordings(userId: string): Promise<boolean> {
  const bucket = adminClient.storage.from(RECORDINGS_BUCKET);
  for (;;) {
    const { data, error } = await bucket.list(userId, { limit: 100 });
    if (error) return false;
    if (data.length === 0) return true;
    const { error: removeError } = await bucket.remove(data.map((file) => `${userId}/${file.name}`));
    if (removeError) return false;
  }
}

async function deleteAccount(userId: string): Promise<Response> {
  // feedback.teacher_id and speaking_assessments.teacher_id have no cascade: a teacher's reviews and scores
  // belong to the students' history, so keep them.
  const [feedback, assessments] = await Promise.all([
    countGivenBy('feedback', userId),
    countGivenBy('speaking_assessments', userId),
  ]);
  if (feedback.error || assessments.error) return json(500, { code: 'delete_failed' });
  if (feedback.count || assessments.count) return json(409, { code: 'user_has_reviews' });

  // Recordings first: if this fails the account still exists and the admin can simply retry.
  if (!(await deleteRecordings(userId))) {
    console.error('recording deletion failed', userId);
    return json(502, { code: 'delete_failed' });
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    console.error('user deletion failed', error.message);
    return json(502, { code: 'delete_failed' });
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
    case 'delete':
      return deleteAccount(userId);
  }
});

// Creates an account with a temporary password and emails it. Only active admins may call it.
// The password is generated here, sent only by email and never returned, logged or stored in plain text.
import { buildAccessEmail } from '../_shared/access-email.ts';
import { adminClient, requireAdmin } from '../_shared/admin.ts';
import { isEmailConfigured, sendEmail } from '../_shared/email-transport.ts';
import { json, preflight, readJson } from '../_shared/http.ts';
import { parseInviteRequest } from '../_shared/requests.ts';
import { generateTemporaryPassword, temporaryPasswordExpiry } from '../_shared/temporary-password.ts';

async function discardUser(userId: string): Promise<void> {
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) console.error('could not roll back user', userId, error.message);
}

Deno.serve(async (request) => {
  const early = preflight(request);
  if (early) return early;

  const caller = await requireAdmin(request);
  if (caller instanceof Response) return caller;

  const parsed = parseInviteRequest(await readJson(request));
  if (!parsed.ok) return json(400, { code: 'invalid_request', message: parsed.error });
  const { email, displayName, role, loginUrl } = parsed.value;

  // Refuse before creating anything, so no account exists with a password nobody received.
  if (!isEmailConfigured()) return json(503, { code: 'email_not_configured' });

  const temporaryPassword = generateTemporaryPassword();
  const expiresAt = temporaryPasswordExpiry();

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (error?.code === 'email_exists' || error?.status === 422) {
    return json(409, { code: 'email_already_registered' });
  }
  if (error || !data.user) {
    console.error('create user failed', error?.message);
    return json(502, { code: 'invite_failed' });
  }
  const userId = data.user.id;

  // The on_auth_user_created trigger already created the profile as a student.
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ role, must_change_password: true, temporary_password_expires_at: expiresAt.toISOString() })
    .eq('id', userId);
  if (profileError) {
    console.error('profile update failed', profileError.message);
    await discardUser(userId);
    return json(500, { code: 'invite_failed' });
  }

  try {
    await sendEmail(buildAccessEmail({ displayName, email, temporaryPassword, loginUrl, expiresAt }));
  } catch (sendError) {
    console.error('access email failed', sendError instanceof Error ? sendError.message : sendError);
    await discardUser(userId);
    return json(502, { code: 'invite_failed' });
  }

  return json(200, { userId });
});

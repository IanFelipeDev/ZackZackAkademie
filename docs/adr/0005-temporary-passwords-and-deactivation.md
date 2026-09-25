# ADR-0005: Temporary passwords for first access, and deactivation instead of deletion

- Status: Accepted
- Date: 2026-09-25
- Supersedes the invitation link of ADR-0004 (the Edge Function and admin checks stay).

## Context

The school wants a familiar onboarding: the admin creates the account and the person receives an email with
their login and a first-access password, which they must replace on first sign-in. Nobody, including the admin,
may see anyone's password. Admins also need to cancel accounts.

## Decision

**First access**

- `invite-user` generates a random 14-character password (CSPRNG, no look-alike characters), creates the user
  with it, marks the profile `must_change_password` with `temporary_password_expires_at` = now + 7 days, and
  emails it. The password is never returned, logged or stored in plain text; Supabase keeps only its hash.
- If the email cannot be sent, the new account is deleted, so no account exists with a password nobody received.
  If no email provider is configured, the function refuses before creating anything (`email_not_configured`).
- The flag is cleared by a database trigger on `auth.users.encrypted_password`, not by the client, so a
  student cannot skip the change. Clients cannot write the flag at all (column-level grants).
- The app routes any user with the flag to `/trocar-senha` before any other page (`RequireRole`).
- `pg_cron` runs `expire_temporary_passwords()` hourly: accounts whose temporary password expired unused are
  banned in Auth, which refuses sign-in server side. "Reenviar acesso" (`manage-user`, `resend_access`) issues a
  new temporary password, invalidates the old one and lifts that ban.
- Email goes through a small transport in the Edge Functions (`_shared/email-transport.ts`): Resend by default
  (`RESEND_API_KEY`, `EMAIL_FROM` secrets), or `log` for the CI stack, which never logs the body.

**Cancelling accounts**

- Accounts are **deactivated**, not deleted: deleting cascades to the student's submissions and feedback, and a
  teacher who gave feedback cannot be deleted at all (foreign key). `manage-user` sets
  `profiles.deactivated_at` and bans the user in Auth; `reactivate` reverses both.
- `app_current_role()` returns null for deactivated profiles, so every role-based RLS policy stops granting
  access immediately, even to a session opened before the deactivation. The app also signs such sessions out.
- Admins cannot deactivate, reactivate or resend access to their own account (use case and Edge Function).

## Consequences

- The temporary password sits in the recipient's mailbox until changed; the 7-day expiry and forced change limit
  that window. The invitation link it replaces did not have this exposure, which was accepted for familiarity.
- Permanent deletion (e.g. an LGPD erasure request) is not implemented; it needs its own flow deciding what
  happens to submissions and feedback.
- `supabase/functions/_shared/{admin,email-transport}.ts` and the `index.ts` files use Deno APIs and are
  excluded from the app's ESLint/tsc; the pure modules next to them are linted, type-checked and unit-tested.

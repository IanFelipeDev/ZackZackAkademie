# ADR-0004: Admin user invitations through an Edge Function

- Status: Accepted
- Date: 2026-09-25

## Context

Admins need to create accounts for students, teachers and other admins and send them their access by email.
Creating users and sending invites requires the Supabase service role key, which must never reach the browser
(ARCHITECTURE §8).

## Decision

- A Supabase Edge Function `invite-user` holds the privileged part. It verifies the caller's JWT, checks that the
  caller's profile is `admin`, validates the request (`invite-request.ts`, a pure module covered by Vitest), calls
  `auth.admin.inviteUserByEmail`, and sets the chosen role on the profile created by the signup trigger.
- The invite email links to `/definir-senha`, where the invited person chooses a password (same screen as
  password recovery, in "invite" mode). The pt-BR email template lives in `supabase/templates/invite.html`.
- Listing users and changing roles do not need the function: RLS already lets admins read all profiles and update
  other users' roles. Admins can never change their **own** role (policy `admin manages other users` plus the
  `ChangeUserRole` use case), so the platform cannot lose its last admin by accident.
- `profiles.email` mirrors `auth.users.email` via triggers, because `auth.users` is not exposed to the client.
  Clients may update only `display_name` and `role` (column-level grants), and RLS still decides whose.

- There is no self sign-up. The sign-up page and use case were removed, and sign-ups are disabled in Supabase
  Auth (`enable_signup = false` locally; the "Allow new users to sign up" switch on the hosted project), because a
  hidden page alone would not stop direct API calls with the public key. Admin invitations still work.

## Consequences

- Deploying needs one extra step: `npm run functions:deploy` (bundled server side with `--use-api`, no Docker).
- Real invitations require custom SMTP in the Supabase dashboard; the built-in sender is only meant for testing.
- The first admin still has to be promoted once with SQL, since nobody can invite before an admin exists.

# ADR-0006: Security hardening after the first review

- Status: Accepted
- Date: 2026-09-26
- Refines ADR-0005 (first access) and ARCHITECTURE §9 (RLS).

## Context

A review of RLS, the Edge Functions and the deployment found no critical issue, but several rules were enforced
only by the UI or trusted values sent by the client.

## Decision

- **First access is enforced by the database.** `app_current_role()` returns no role while
  `must_change_password` is set, so a user on the temporary password can read their own profile and change the
  password, nothing else, even when calling the API directly. `RequireRole` keeps redirecting to `/trocar-senha`
  for the UX.
- **Submissions are stamped by the server.** A `before insert` trigger sets `created_at = now()` and
  `attempt_number = max + 1` for that student and exercise; whatever the client sends is ignored. The client still
  computes the number, so the domain model is unchanged.
- **Students write only for exercises they can see.** The insert policy on `writing_submissions` and the check of
  `writing_drafts` require the exercise to be visible under RLS (published lesson).
- **`anon` has no table privileges**, including on tables created later (default privileges for `postgres`).
- **The access email links only to our own site.** The Edge Functions accept a `loginUrl` only if its origin is in
  the `SITE_ORIGINS` secret (comma-separated). Without it, they refuse with `email_not_configured`, like a missing
  email provider.
- **Passwords need letters and digits** (minimum 8), in the app (`isStrongPassword`) and in Supabase Auth
  (`password_requirements = "letters_digits"`, set in the dashboard for the hosted project).
- **Security headers** in `vercel.json`: a CSP (self, Google Fonts, `*.supabase.co`), `frame-ancestors 'none'` /
  `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.

## Consequences

- An admin created with a temporary password has no admin rights until the first password change.
- Adding an external script, font or API host requires updating the CSP in `vercel.json`.
- Deploying the functions requires the `SITE_ORIGINS` secret (Vercel URL, plus `http://localhost:5173` for dev).

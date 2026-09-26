# Next steps

Status on 2026-09-26. Update this file as items are done.

## Done

- Phase 0 setup (Vite, TypeScript strict, Tailwind, ESLint layer boundaries, Vitest, CI), Supabase schema + RLS.
- Goethe B2 Schreiben module: practice page, drafts, submission history, teacher review.
- Auth without self sign-up. Admin user management at `/admin/usuarios`: create access with a temporary password
  (valid until first sign-in, must be changed, reuse rejected), resend access, deactivate/reactivate, change roles.
- Hosted Supabase (`cphpixxnogjxxoypbetg`): migrations 0001–0007 applied, Edge Functions `invite-user` and
  `manage-user` deployed, public sign-up disabled, site URL `http://localhost:5173`, password minimum 8.
- Access email designed from the school's template (`supabase/functions/_shared/access-email.ts`).

## Blocking: email delivery

"Criar acesso" and "Reenviar acesso" refuse with `email_not_configured` until one of these is set up
(no own domain yet, no budget for one):

1. **Brevo** (code ready, `EMAIL_TRANSPORT=brevo`): sign-up blocked because the phone number is already used by
   too many accounts. Options: another school member's phone (with consent) or Brevo support.
2. **Gmail SMTP with an app password** (not implemented yet): needs a school Gmail with 2-step verification and an
   app password. Implementation must confirm Supabase Edge Functions can reach `smtp.gmail.com:465`.
3. Later, with a `.com.br` domain (about R$ 40/year): switch to Resend (`EMAIL_TRANSPORT=resend`).

Then: set the secrets (`npx supabase secrets set …`, see README), send a test email, and also configure
**Authentication → Emails → SMTP Settings** so password-recovery emails work.

## Deploy

- Import the GitHub repo in Vercel (preset Vite) with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Then update Supabase Auth: site URL = Vercel URL, redirect URLs += `https://<vercel-domain>/redefinir-senha`.
  The access email's logo only renders once the site is public (`/brand/logo-512.png`).

## Verify in CI

- The `database` job (migrations replayed from scratch, RLS and Edge Function integration tests with the `log`
  email transport) has never run before the first push. Fix whatever it reports.

## Resume here: security hardening (ADR-0006)

Code committed and pushed (`9f22bee`, 2026-09-26). Not yet applied to the hosted project. In order:

1. Check the CI run of `9f22bee` in GitHub → Actions (repo is private; `gh` is not installed here). The
   `database` job runs the new integration tests (flagged users have no role, server-stamped submissions,
   hidden exercises, `SITE_ORIGINS`). Fix whatever fails.
2. `npm run db:push` (migration `20260926000008_security_hardening`), then `npm run functions:deploy`.
3. Dashboard → Authentication → Sign In / Providers → Email: password requirement "letters and digits".
4. Once the Vercel URL exists: set the `SITE_ORIGINS` secret (see README). Until then invites refuse with
   `email_not_configured`, which email delivery blocks anyway.

## Security cleanup (after the Vercel URL is set in Supabase)

- Revoke the Supabase access token used during setup (supabase.com/dashboard/account/tokens).
- Revoke the exposed secret API key (Project Settings → API Keys).
- Reset the database password (Project Settings → Database).

## Later phases (not started)

- Google sign-in, AI-assisted correction (Edge Function), other Stitch modules (Lesen, Hören, Sprechen,
  Flashcards), exam-code pairs ("Simulado #B2-04"), permanent account deletion flow (LGPD).

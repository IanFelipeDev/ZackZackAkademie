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
- Mobile layout (bottom nav bar on phones) and installable web app (manifest, no service worker / offline).

## Blocking: email delivery

"Criar acesso" and "Reenviar acesso" refuse with `email_not_configured` until one of these is set up
(no own domain yet, no budget for one):

1. **Brevo** (code ready, `EMAIL_TRANSPORT=brevo`): sign-up blocked because the phone number is already used by
   too many accounts. Options: another school member's phone (with consent) or Brevo support.
2. **Gmail SMTP with an app password** (chosen; `EMAIL_TRANSPORT=smtp`, implemented 2026-09-26): the school
   Gmail has 2-step verification and an app password; `EMAIL_TRANSPORT`, `SMTP_USER`, `SMTP_PASSWORD`,
   `EMAIL_FROM` secrets set 2026-09-27. Still to do: `functions:deploy` (after CI), then a test invite to confirm
   Edge Functions reach `smtp.gmail.com:465`.
3. Later, with a `.com.br` domain (about R$ 40/year): switch to Resend (`EMAIL_TRANSPORT=resend`).

Then: set the secrets (`npx supabase secrets set …`, see README), send a test email, and also configure
**Authentication → Emails → SMTP Settings** so password-recovery emails work.

## Deploy

- Done 2026-09-26: Vercel project `zack_zack_akademie`, live at https://zackzackakademie.vercel.app;
  `SITE_ORIGINS` secret set to that URL + `http://localhost:5173`.
- Still to do: Supabase Auth → URL Configuration: site URL = https://zackzackakademie.vercel.app, redirect URLs +=
  `https://zackzackakademie.vercel.app/redefinir-senha`.

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
4. ~~Set the `SITE_ORIGINS` secret~~ (done 2026-09-26).

## Security cleanup (after the Vercel URL is set in Supabase)

- Revoke the Supabase access token used during setup (supabase.com/dashboard/account/tokens).
- Revoke the exposed secret API key (Project Settings → API Keys).
- Reset the database password (Project Settings → Database).

## Later phases (not started)

- Google sign-in, AI-assisted correction (Edge Function), other Stitch modules (Lesen, Hören, Sprechen,
  Flashcards), exam-code pairs ("Simulado #B2-04"), permanent account deletion flow (LGPD).

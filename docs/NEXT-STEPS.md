# Next steps

Status on 2026-09-27. Update this file as items are done.

## Done

- Phase 0 setup (Vite, TypeScript strict, Tailwind, ESLint layer boundaries, Vitest, CI), Supabase schema + RLS.
- Goethe B2 Schreiben module: practice page, drafts, submission history, teacher review (teachers and admins
  both review at `/revisoes`).
- Auth without self sign-up. Admin user management at `/admin/usuarios`: create access with a temporary password
  (valid until first sign-in, must be changed, reuse rejected), resend access, deactivate/reactivate, delete
  (ADR-0007), change roles.
- Hosted Supabase (`cphpixxnogjxxoypbetg`): migrations 0001–0012 applied (0009–0012 on 2026-09-29) (0008 security hardening pushed 2026-09-27; anonymous
  requests to every table now get HTTP 401), public sign-up disabled, password
  minimum 8. Edge Functions `invite-user` and `manage-user` redeployed 2026-09-27 from `b5a119f` (SMTP transport,
  `SITE_ORIGINS` check, account deletion), at the user's request before the CI result was known.
- Access email designed from the school's template (`supabase/functions/_shared/access-email.ts`).
- Mobile layout (bottom nav bar on phones) and installable web app (manifest, no service worker / offline).
- Vercel project `zack_zack_akademie`, live at https://zackzackakademie.vercel.app, deploys `main` automatically;
  `SITE_ORIGINS` secret and Supabase Auth URL Configuration point to it.
- 2026-09-27: the admin's forgotten password was reset through the SQL Editor (temporary password +
  `must_change_password`), since no recovery email can be sent yet.

## Resume here

0. **Feedback history, Sprechen, dashboard, presence, landing page, neutral login, animation skills**
   (2026-09-29): live. Migrations 0009–0012 applied, `invite-user`/`manage-user` redeployed, `main` 45dfb9f pushed
   and deployed by Vercel (landing checked in production). Still to do: check that CI run in GitHub → Actions; its
   `database` job runs the new RLS and Edge Function tests for the first time. The Sprechen topics in
   `…11_sprechen_b2_content.sql` were written for the app; the teacher should review them, as well as the landing
   page texts (`landing-content.ts`). Sprechen timing as the teacher asked: Teil 1 5:00 (1:00 / 3:00 / 1:00), Teil 2 2:30 (0:30 / 1:30 / 0:30).
1. **Test email**: "Reenviar acesso" on an account with a reachable inbox. Expected: "Nova senha temporária
   enviada…" and the email arrives (check spam). `invite_delivery_failed` → read the `manage-user` logs (Gmail
   refused); still `email_not_configured` → check the `EMAIL_TRANSPORT`/`SMTP_*`/`EMAIL_FROM`/`SITE_ORIGINS` values.
2. **CI**: check the runs of `9f22bee` and `b5a119f` in GitHub → Actions (repo is private; `gh` is not installed
   here). The `database` job (migrations replayed from scratch, RLS and Edge Function integration tests with the
   `log` transport, incl. the new delete tests) has never been confirmed green. Fix whatever fails.
3. Dashboard → Authentication → Sign In / Providers → Email: password requirement "letters and digits".
4. Dashboard → Authentication → Emails → SMTP Settings: same Gmail + app password (smtp.gmail.com:465), so
   "Esqueci minha senha" sends recovery emails.
5. Create the teacher's account (role Professor, or Admin if she also manages users) and the students'.

## Open ideas

- "Redefinir senha" for already active accounts: same flow as "Reenviar acesso" but a password-reset version of
  the email instead of the welcome text (proposed 2026-09-27, not decided).

## Email providers

- Current: Gmail SMTP with an app password (`EMAIL_TRANSPORT=smtp`, port 465 only).
- Brevo (code ready, `EMAIL_TRANSPORT=brevo`): sign-up was blocked (phone number used by too many accounts).
- Later, with a `.com.br` domain (about R$ 40/year): Resend (`EMAIL_TRANSPORT=resend`).

## Security cleanup

- Revoke the Supabase access token used during setup (supabase.com/dashboard/account/tokens).
- Revoke the exposed secret API key (Project Settings → API Keys).
- Reset the database password (Project Settings → Database).

## Later phases (not started)

- Google sign-in, AI-assisted correction (Edge Function), other Stitch modules (Lesen, Hören,
  Flashcards), student voice recording for Sprechen, exam-code pairs ("Simulado #B2-04"), LGPD erasure for teachers who gave feedback.

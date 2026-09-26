# Zack Zack Akademie

Web platform for learning German (A1–B2) for the students of Melissa's classes. The first module is a trainer for
the **Goethe-Zertifikat B2 Schreiben** exam: students pick a real exam topic (Teil 1 forum post or Teil 2 formal
email), write against the clock with the Leitpunkte checklist and Redemittel, and send the text to the teacher,
who reviews it with a comment and a score.

Stack: React 19 + TypeScript + Vite, TanStack Query, React Router, Tailwind CSS 4, Supabase (Postgres, Auth, RLS),
hosted on Vercel. Architecture and rules: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Setup

```bash
npm install
cp .env.example .env   # fill in the publishable key from Supabase → Project Settings → API
npm run dev            # http://localhost:5173
```

| Variable                 | Value                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | `https://<project-ref>.supabase.co`                                                |
| `VITE_SUPABASE_ANON_KEY` | the **publishable** key (`sb_publishable_…`). Never the service role / secret key. |

## Scripts

| Command                                                 | What it does                                                             |
| ------------------------------------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`                                           | Dev server                                                               |
| `npm run build`                                         | Type-check and production build                                          |
| `npm run lint` / `npm run typecheck` / `npm run format` | ESLint (incl. layer boundaries), `tsc`, Prettier                         |
| `npm test`                                              | Unit and component tests (Vitest, in-memory adapters, no backend needed) |
| `npm run test:coverage`                                 | Same, with the ≥ 90 % threshold on domain/application                    |
| `npm run test:integration`                              | RLS tests against a **local** Supabase stack (runs in CI)                |
| `npm run db:push`                                       | Apply new migrations to the hosted project                               |
| `npm run db:types:remote`                               | Regenerate `database.types.ts` from the hosted project                   |
| `npm run functions:deploy`                              | Deploy the `invite-user` Edge Function (bundled server side, no Docker)  |

## Database

Migrations live in `supabase/migrations/`. There is no local Docker setup; changes go straight to the hosted
project and CI replays every migration on a throwaway stack.

```bash
npx supabase login                                        # once, opens the browser
npx supabase link --project-ref cphpixxnogjxxoypbetg      # once, asks for the database password
npm run db:push                                           # applies pending migrations
npm run db:types:remote                                   # then commit the regenerated types
```

## Users and roles

Admins manage accounts at **/admin/usuarios**:

- **Criar acesso**: name, email and role (student, teacher or admin). The person receives an email with a
  temporary password that stays valid until their first sign-in, when they must choose a different password of
  their own. Nobody sees the temporary password.
- **Reenviar acesso**: emails a new temporary password (the old one stops working).
- **Desativar / Reativar**: cancels access immediately while keeping the person's history. Accounts are never
  deleted from this screen (see ADR-0005).
- Change roles. Admins cannot change, deactivate or resend access to their own account.

There is **no self sign-up**: accounts only come from admins. Keep
**Authentication → Sign In / Providers → Allow new users to sign up** turned **off** in the Supabase dashboard;
otherwise anyone with the public key could still create an account through the API, even without a sign-up page.

### First admin (once)

Nobody can invite before an admin exists. Create your account in **Authentication → Users → Add user → Create
new user** (tick "Auto Confirm User"), then run in the Supabase SQL editor:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

### Edge Functions and email

```bash
npm run functions:deploy   # invite-user + manage-user; after `supabase login`, again whenever supabase/functions changes
```

The access email is sent by the Edge Functions through [Brevo](https://brevo.com) or [Resend](https://resend.com)
(`supabase/functions/_shared/email-transport.ts`). Set the secrets once:

```bash
# Brevo (free, 300/day; the sender can be a single verified address such as a Gmail, no domain needed)
npx supabase secrets set --project-ref cphpixxnogjxxoypbetg EMAIL_TRANSPORT=brevo BREVO_API_KEY=xkeysib-xxx "EMAIL_FROM=Zack Zack Akademie <escola@gmail.com>"

# Resend (needs a verified domain)
npx supabase secrets set --project-ref cphpixxnogjxxoypbetg EMAIL_TRANSPORT=resend RESEND_API_KEY=re_xxx "EMAIL_FROM=Zack Zack Akademie <acesso@your-domain>"
```

The sender must be verified at the provider. Until the secrets exist, "Criar acesso" refuses with a clear message
and creates nothing. The email body lives in `supabase/functions/_shared/access-email.ts`. Emails sent from a
free address (Gmail) through a provider land in spam or "Promotions" more often; a domain fixes that later.

For Supabase's own emails (password recovery), also configure **Authentication → Emails → SMTP Settings** with the
same provider; the built-in sender is for testing only.

## Auth settings (Supabase dashboard → Authentication → URL Configuration)

- **Site URL**: the Vercel production URL.
- **Redirect URLs**: `https://<vercel-domain>/redefinir-senha` and `http://localhost:5173/redefinir-senha`
  (password recovery links land there).

## Deploy (Vercel)

Import the GitHub repo in Vercel (framework preset: Vite) and set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` in the project's environment variables. `vercel.json` rewrites every path to
`index.html` so client-side routes work on reload.

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

Admins manage accounts at **/admin/usuarios**: invite someone by name and email as student, teacher or admin
(they get an email with a link to create their password) and change other users' roles. Admins cannot change
their own role. People can also sign up by themselves; they always start as students.

### First admin (once)

Nobody can invite before an admin exists. Sign up normally, then run in the Supabase SQL editor:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

### Invitations: Edge Function and email

```bash
npm run functions:deploy   # after `supabase login`; deploy again whenever supabase/functions changes
```

In the Supabase dashboard:

- **Authentication → Emails → SMTP Settings**: configure a real SMTP provider (e.g. Resend). The built-in
  sender is for testing only and does not deliver invitations to arbitrary addresses.
- **Authentication → Emails → Templates → Invite user**: subject `Seu acesso à Zack Zack Akademie`, body from
  `supabase/templates/invite.html`.

## Auth settings (Supabase dashboard → Authentication → URL Configuration)

- **Site URL**: the Vercel production URL.
- **Redirect URLs**: `https://<vercel-domain>/redefinir-senha`, `https://<vercel-domain>/definir-senha` and the
  same two paths on `http://localhost:5173` (password recovery and invitation links land there).

## Deploy (Vercel)

Import the GitHub repo in Vercel (framework preset: Vite) and set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` in the project's environment variables. `vercel.json` rewrites every path to
`index.html` so client-side routes work on reload.

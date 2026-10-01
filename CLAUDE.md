# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`docs/ARCHITECTURE.md` is the binding spec (layers, schema, RLS, naming, testing). Read it before structural
changes; record deviations as an ADR in `docs/adr/`. `docs/NEXT-STEPS.md` tracks project status and open items
(email delivery, Vercel deploy, first CI run); update it when an item is done. `docs/glossary.md` fixes the
domain terms, which are spelled the same in code, database and docs (e.g. Leitpunkte = `guidingPoints` /
`guiding_points`, Redemittel = `UsefulPhrase` / `useful_phrases`); use it when naming new things.

## Commands

```bash
npm run dev                 # Vite dev server on :5173 (.env from .env.example: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY = the publishable sb_publishable_… key, never the secret key)
npm test                    # unit + component tests (Vitest project "unit", jsdom, in-memory adapters); test:watch too
npx vitest run --project unit src/features/writing/domain/writing-domain.test.ts   # single file
npx vitest run --project unit -t "rejects an empty submission"                      # single test by name
npm run test:coverage       # enforces ≥ 90 % on src/**/domain and src/**/application
npm run lint                # ESLint, including the layer rules (boundaries/dependencies)
npm run typecheck           # tsc -b --noEmit (app + node configs + tests/integration)
npm run format              # Prettier; CI runs format:check
npm run build
npm run test:integration    # RLS tests; ONLY against a local Supabase stack (CI does this)
npm run db:push             # apply supabase/migrations to the hosted project
npm run db:types:remote     # regenerate src/shared/infrastructure/supabase/database.types.ts
npm run functions:deploy    # deploy invite-user + manage-user (--use-api, no Docker)
```

Never run Docker or `supabase start` on the developer machine. Migrations go straight to the hosted project with
`db:push` (hosted project ref `cphpixxnogjxxoypbetg`; needs a one-time `npx supabase login` + `npx supabase link`,
same for `functions:deploy`); the `database` CI job starts a throwaway stack, replays all migrations and runs `tests/integration`.
`tests/integration/supabase-test-env.ts` refuses non-local URLs on purpose. `db:types` (local stack) and
`test:e2e` (no Playwright config or specs yet) are not usable here. The CI `checks` job runs `format:check`, `lint`,
`typecheck`, `test:coverage`, `build`; run the same before pushing.

App-level flows are tested in `src/app/app-flows.test.tsx` via `src/app/testing/render-app.tsx` (in-memory
adapters behind the real container and routes); use cases are tested with the in-memory adapters directly. Those live in each feature's
`application/testing/in-memory-*.ts` and are excluded from coverage, like everything under `testing/`.

## Architecture

Feature-first, layered inside each feature (`src/features/{auth,writing,feedback,speaking,flashcards,users}/{domain,application,infrastructure,presentation}`,
plus `dashboard` and `landing`, which only have a presentation layer; `dashboard` reads the other features through
their public API),
plus `src/shared/{domain,infrastructure,ui}` and `src/app`.

- **Dependency rule is enforced by ESLint** (`eslint.config.js`, `eslint-plugin-boundaries` + `no-restricted-imports`):
  domain → shared/domain only; application → own domain; infrastructure → own domain/application + shared
  infrastructure; presentation → own domain/application/presentation, `shared/ui`, `@/app/context/container-context`,
  and other features only through their `src/features/<name>/index.ts` public API. Domain/application may not
  import React, TanStack, Supabase or any `@/features/*` path. Only `infrastructure/` and `src/app/container.ts`
  may import `@supabase/*`. If two features need something, move it to `shared/` (e.g. `countWords`).
- **Composition root**: `src/app/container.ts` (routes in `src/app/routes.tsx`). `createSupabaseAdapters(client)` builds the adapters (one per
  port); `createContainer(adapters)` wires use cases. Presentation gets use cases via `useContainer()` and calls
  `useCase.execute(...)` inside TanStack Query `useQuery`/`useMutation`. Adding a use case = port method →
  Supabase adapter → in-memory test double → entry in `createContainer`.
- **Read models**: list/detail screens use DTOs from `application/read-models.ts` (e.g. `SubmissionSummary`),
  built by infrastructure mappers from PostgREST embedded selects (`writing-mappers.ts`), typed with
  `.overrideTypes<Row[], { merge: false }>()`.
- **Errors**: domain errors extend `DomainError` with a stable `code`; each feature's presentation maps codes to
  pt-BR messages (`*-error-message.ts`). Infrastructure wraps unexpected failures in `RepositoryError`.
- **Auth**: `AuthProvider` exposes `useAuth()`/`useSignedInUser()`; on any auth event it calls
  `queryClient.resetQueries()` so no cached data survives a user switch. `RequireRole` is UX only; RLS is the real
  boundary. `/` is the public landing page (ADR-0011; texts in `landing-content.ts`). Students own `/painel` (their home: performance dashboard), `/treino` and `/meus-textos`; teacher/admin own `/revisoes` (queue) and `/revisoes/historico`
  (corrected texts; feedback can be revised there, overwriting the old version) and `/avaliacoes-orais`
  (Sprechen scores); students also own `/sprechen` (`?prova=telc&teil=1..3` for telc, Goethe by default) and `/flashcards` (vocabulary, ADR-0013); admin owns
  `/admin/usuarios`. `Role` lives in `shared/domain` because several features need it.
- **User admin** (ADR-0004, ADR-0005, ADR-0007): listing users and changing roles go straight to `profiles` under RLS.
  Online status / last access (ADR-0010): `usePresenceHeartbeat` in `AppLayout` calls `auth.recordActivity`
  every 2 min while the tab is visible; admins see it in `/admin/usuarios` (online = seen in the last 5 min).
  Anything needing the service role key goes through Edge Functions: `invite-user` (create account with a
  temporary password and email it) and `manage-user` (`resend_access`, `deactivate`, `reactivate`, `delete`). Shared code is in
  `supabase/functions/_shared/`: pure modules (`requests`, `temporary-password`, `access-email`, `email-providers`,
  `http`) are linted and Vitest-tested (`shared-modules.test.ts`, part of `npm test`); Deno-only files (`admin.ts`,
  `email-transport.ts`, every `index.ts`) are excluded from ESLint/tsc. Email goes out via the `EMAIL_TRANSPORT`
  secret (`resend` default | `brevo` | `smtp` (Gmail app password, port 465 only) | `log`, the latter for local stacks/CI and never logs the body); without
  configured secrets (including `SITE_ORIGINS`, the only origins the email's `loginUrl` may point to) the
  functions refuse with `email_not_configured` and create nothing.
  Admins never act on their own account. Deactivation is the reversible default; `delete` is permanent
  (cascades to drafts, submissions and feedback on them) and refused with `user_has_reviews` for anyone who gave feedback.
- **First access**: `profiles.must_change_password` is set by the functions and cleared only by a trigger on
  password change; `RequireRole` sends flagged users to `/trocar-senha` (`ResetPasswordPage mode="first-access"`).
  The temporary password does not expire; reusing it as the new password is rejected by Supabase Auth
  (`same_password` → `SamePasswordError`). Deactivated profiles, and flagged ones until they change the password, get no role from
  `app_current_role()`. There is deliberately **no self sign-up** (no page, no use
  case, `enable_signup = false`); don't reintroduce one. Never return, log or store temporary passwords.
- **Writing page**: `WritingPracticePage` (URL params `teil`, `tema`) → `DraftLoader` (fetches the draft with
  `gcTime: 0`) → `WritingSession` keyed by exercise id, so switching topics resets all local state.
  Drafts autosave via `useDraftAutosave` (1.5 s debounce); submitting creates an immutable attempt and deletes the draft.

## Database

- `supabase/migrations/`: `…01_initial_schema` and `…02_rls` follow ARCHITECTURE §7/§9 (helper is
  `app_current_role()`, not `current_role()`); `…03_schreiben` adds task type, Leitpunkte, Redemittel and drafts
  (ADR-0002, ADR-0003); `…04_schreiben_b2_content` holds the 40 exam topics and Redemittel as idempotent inserts;
  `…05_user_admin` mirrors emails onto profiles and restricts role changes (ADR-0004); `…06_user_access` adds
  temporary passwords and deactivation; `…07` removes the temporary-password expiry again (ADR-0005); `…08_security_hardening` (ADR-0006): no role
  while `must_change_password`, server-stamped `created_at`/`attempt_number` on submissions, writes only for
  visible exercises, no `anon` grants; `…09_feedback_edits` (ADR-0008): staff may update only `comment`/`score` of
  feedback, `updated_at` is stamped by a trigger; `…10_sprechen` + `…11_sprechen_b2_content` (ADR-0009): topics,
  immutable practices, revisable assessments (20 initial topics); `…12_user_presence` (ADR-0010): admin-only
  `user_presence`, written only through the `touch_presence()` RPC; `…13_sprechen_teacher_topics`: the teacher's
  27 Teil 1 and 31 Teil 2 topics replace the placeholders (unpublished, not deleted; students still see topics
  they practised, new practices only on published topics); `…14_telc_task_types` + `…15_telc_sprechen` +
  `…16_telc_sprechen_content` (ADR-0012): `exam` (goethe | telc) on topics, telc parts `experience`/`discussion`/
  `planning`, Teil 2 texts and Teil 1 Nachfragen; queries by part must filter by exam too; `…17_flashcards` + `…18_flashcards_b2_content` (ADR-0013): 810
  vocabulary cards and one mark per student and card (`known` | `review`, upserted, never deleted).
- New migrations continue the numbering: `YYYYMMDD` + six-digit sequence (next: `YYYYMMDD000019_<name>.sql`).
- Every new table: enable RLS, add policies, add cases to `tests/integration/rls.test.ts`, grant to `authenticated`.
  Edge Function behaviour is covered by `tests/integration/user-admin.test.ts`.
- `database.types.ts` is generated; regenerate after each migration instead of editing by hand.

## Conventions

- Code, comments, commits, docs: English. All user-facing text: pt-BR. Study content (topics, Redemittel): German.
- Files are kebab-case, including components (`writing-session.tsx` exports `WritingSession`).
- `vercel.json` sets a strict CSP (self, Google Fonts, `*.supabase.co`); new external hosts must be added there.
- Passwords: minimum 8 with letters and digits (`isStrongPassword`), mirrored in Supabase Auth settings.
- UI follows the Stitch "Literary Academy" design: tokens are in `src/index.css` (`@theme`), fonts EB Garamond /
  Manrope / JetBrains Mono, Material Symbols via `<Icon name="…" />`. Reuse `shared/ui` components.
- Motion follows the vendored skills in `.claude/skills` (Emil Kowalski): CSS only, animate `transform`/`opacity`/
  `clip-path`, strong curves `--ease-strong-out`/`--ease-strong-in-out` from `index.css`, hover motion behind
  `(hover: hover) and (pointer: fine)`, no infinite loops. The global reduced-motion rule in `index.css` stays.
- Navigation per role is defined once in `src/app/app-layout.tsx` (`STUDENT_NAV`/`TEACHER_NAV`/`ADMIN_NAV`);
  `AppHeader` renders it as the header nav from `md` up (between `md` and `lg` only the logo
  and the nav, and the user's name only from `xl`, so the five student items fit) and as a fixed bottom bar on phones (no `backdrop-filter`
  on the header, it would break the fixed bar). Installable via `public/manifest.webmanifest`; there is deliberately
  no service worker / offline mode. Form fields stay at 16px so iOS does not zoom on focus.
- Conventional Commits; a Husky pre-commit hook runs lint-staged. `main` is protected: work on `feat/*`, `fix/*`,
  `docs/*` or `chore/*` branches (CONTRIBUTING.md).
- AI-based correction is deliberately out of scope for now (it lived in the original `schreiben.html`); teachers review.

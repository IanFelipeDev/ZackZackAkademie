# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`docs/ARCHITECTURE.md` is the binding spec (layers, schema, RLS, naming, testing). Read it before structural
changes; record deviations as an ADR in `docs/adr/`.

## Commands

```bash
npm run dev                 # Vite dev server on :5173 (needs .env, see .env.example)
npm test                    # unit + component tests (Vitest project "unit", jsdom, in-memory adapters)
npx vitest run --project unit src/features/writing/domain/writing-domain.test.ts   # single file
npx vitest run --project unit -t "rejects an empty submission"                      # single test by name
npm run test:coverage       # enforces ≥ 90 % on src/**/domain and src/**/application
npm run lint                # ESLint, including the layer rules (boundaries/dependencies)
npm run typecheck           # tsc -b (app + node configs + tests/integration)
npm run format              # Prettier; CI runs format:check
npm run build
npm run test:integration    # RLS tests; ONLY against a local Supabase stack (CI does this)
npm run db:push             # apply supabase/migrations to the hosted project
npm run db:types:remote     # regenerate src/shared/infrastructure/supabase/database.types.ts
npm run functions:deploy    # deploy invite-user + manage-user (--use-api, no Docker)
```

Never run Docker or `supabase start` on the developer machine. Migrations go straight to the hosted project with
`db:push`; the `database` CI job starts a throwaway stack, replays all migrations and runs `tests/integration`.
`tests/integration/supabase-test-env.ts` refuses non-local URLs on purpose.

## Architecture

Feature-first, layered inside each feature (`src/features/{auth,writing,feedback,users}/{domain,application,infrastructure,presentation}`),
plus `src/shared/{domain,infrastructure,ui}` and `src/app`.

- **Dependency rule is enforced by ESLint** (`eslint.config.js`, `eslint-plugin-boundaries` + `no-restricted-imports`):
  domain → shared/domain only; application → own domain; infrastructure → own domain/application + shared
  infrastructure; presentation → own domain/application/presentation, `shared/ui`, `@/app/context/container-context`,
  and other features only through their `src/features/<name>/index.ts` public API. Domain/application may not
  import React, TanStack, Supabase or any `@/features/*` path. Only `infrastructure/` and `src/app/container.ts`
  may import `@supabase/*`. If two features need something, move it to `shared/` (e.g. `countWords`).
- **Composition root**: `src/app/container.ts`. `createSupabaseAdapters(client)` builds the adapters (one per
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
  boundary. Students own `/treino` and `/meus-textos`; teacher/admin own `/revisoes`; admin owns
  `/admin/usuarios`. `Role` lives in `shared/domain` because several features need it.
- **User admin** (ADR-0004, ADR-0005): listing users and changing roles go straight to `profiles` under RLS.
  Anything needing the service role key goes through Edge Functions: `invite-user` (create account with a
  temporary password and email it) and `manage-user` (`resend_access`, `deactivate`, `reactivate`). Shared code is in
  `supabase/functions/_shared/`: pure modules (`requests`, `temporary-password`, `access-email`) are linted and
  Vitest-tested; Deno-only files (`admin.ts`, `email-transport.ts`, every `index.ts`) are excluded from ESLint/tsc.
  Admins never act on their own account. Accounts are deactivated, never deleted.
- **First access**: `profiles.must_change_password` is set by the functions and cleared only by a trigger on
  password change; `RequireRole` sends flagged users to `/trocar-senha` (`ResetPasswordPage mode="first-access"`).
  Unused temporary passwords are banned hourly by `pg_cron` (`expire_temporary_passwords()`). Deactivated
  profiles get no role from `app_current_role()`. There is deliberately **no self sign-up** (no page, no use
  case, `enable_signup = false`); don't reintroduce one. Never return, log or store temporary passwords.
- **Writing page**: `WritingPracticePage` (URL params `teil`, `tema`) → `DraftLoader` (fetches the draft with
  `gcTime: 0`) → `WritingSession` keyed by exercise id, so switching topics resets all local state.
  Drafts autosave via `useDraftAutosave` (1.5 s debounce); submitting creates an immutable attempt and deletes the draft.

## Database

- `supabase/migrations/`: `…01_initial_schema` and `…02_rls` follow ARCHITECTURE §7/§9 (helper is
  `app_current_role()`, not `current_role()`); `…03_schreiben` adds task type, Leitpunkte, Redemittel and drafts
  (ADR-0002, ADR-0003); `…04_schreiben_b2_content` holds the 40 exam topics and Redemittel as idempotent inserts;
  `…05_user_admin` mirrors emails onto profiles and restricts role changes (ADR-0004); `…06_user_access` adds
  temporary passwords, deactivation and the expiry cron job (ADR-0005).
- Every new table: enable RLS, add policies, add cases to `tests/integration/rls.test.ts`, grant to `authenticated`.
- `database.types.ts` is generated; regenerate after each migration instead of editing by hand.

## Conventions

- Code, comments, commits, docs: English. All user-facing text: pt-BR. Study content (topics, Redemittel): German.
- Files are kebab-case, including components (`writing-session.tsx` exports `WritingSession`).
- UI follows the Stitch "Literary Academy" design: tokens are in `src/index.css` (`@theme`), fonts EB Garamond /
  Manrope / JetBrains Mono, Material Symbols via `<Icon name="…" />`. Reuse `shared/ui` components.
- Conventional Commits; a Husky pre-commit hook runs lint-staged.
- AI-based correction is deliberately out of scope for now (it lived in the original `schreiben.html`); teachers review.

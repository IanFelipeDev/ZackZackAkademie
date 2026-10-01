# Deutsch Lernen Platform — Architecture & Engineering Guide

> Web platform for learning German from **A1 to B2** (CEFR), built with **React** and **Supabase (Free Tier)**.
> This document defines the architecture, folder structure, data model, security rules and engineering standards for the project.
> **All code, comments, commits and documentation must be written in English.**

---

## Table of Contents

1. [Scope](#1-scope)
2. [Tech Stack](#2-tech-stack)
3. [Supabase Free Tier Constraints](#3-supabase-free-tier-constraints)
4. [Clean Architecture](#4-clean-architecture)
5. [Folder Structure](#5-folder-structure)
6. [Domain Model](#6-domain-model)
7. [Database Schema](#7-database-schema)
8. [Authentication & Roles](#8-authentication--roles)
9. [Row Level Security (RLS)](#9-row-level-security-rls)
10. [Storage (Audio)](#10-storage-audio)
11. [Clean Code Standards](#11-clean-code-standards)
12. [Testing Strategy](#12-testing-strategy)
13. [Documentation Standards](#13-documentation-standards)
14. [Git Workflow](#14-git-workflow)
15. [Roadmap](#15-roadmap)

---

## 1. Scope

### In scope (MVP)

| Feature             | Description                                                                  |
| ------------------- | ---------------------------------------------------------------------------- |
| Authentication      | Email/password sign-up and sign-in via Supabase Auth                         |
| Roles               | `student`, `teacher`, `admin`                                                |
| Content             | Levels (A1–B2) → Units → Lessons → Exercises                                 |
| Reading content     | Written texts (Markdown) per lesson                                          |
| Pronunciation audio | Reference audio files for words/phrases                                      |
| Writing practice    | Students submit written answers; every attempt is stored                     |
| Feedback            | Teachers review submissions and leave feedback                               |
| Progress            | Students see their attempts and lesson completion                            |
| Speaking practice   | Timed Sprechen practice per topic; teachers give scores (no audio, ADR-0009) |

### Out of scope (MVP)

- Recording and storing student audio (storage-heavy on the free tier — see Roadmap)
- Real-time chat, payments, mobile apps
- Automatic AI grading (candidate for a later phase)

---

## 2. Tech Stack

| Layer              | Choice                                      | Reason                                  |
| ------------------ | ------------------------------------------- | --------------------------------------- |
| Language           | TypeScript (strict mode)                    | Type safety across layers               |
| Build tool         | Vite                                        | Fast dev server, simple config          |
| UI                 | React 18+                                   | Component model                         |
| Routing            | React Router                                | Route guards per role                   |
| Server state       | TanStack Query                              | Caching, retries, loading states        |
| Forms / validation | React Hook Form + Zod                       | Schemas shared between UI and domain    |
| Styling            | Tailwind CSS                                | Utility-first, consistent design tokens |
| Backend            | Supabase (Postgres, Auth, Storage)          | Managed BaaS, free tier                 |
| Tests              | Vitest + React Testing Library + Playwright | Unit, component and E2E                 |
| Lint / format      | ESLint + Prettier                           | Enforced in CI                          |
| CI                 | GitHub Actions                              | Lint, type-check, test on every PR      |
| Hosting            | Vercel / Netlify / Cloudflare Pages         | Free static hosting                     |

---

## 3. Supabase Free Tier Constraints

Design decisions must respect the free tier. **Verify current limits at <https://supabase.com/pricing>, they change over time.** Historically:

| Resource             | Approximate limit         | Impact on design                                               |
| -------------------- | ------------------------- | -------------------------------------------------------------- |
| Database             | ~500 MB                   | Store text only in Postgres; never store binary data in tables |
| File storage         | ~1 GB                     | Compress audio (Opus/MP3, mono, 64 kbps); ~1 MB/min            |
| Monthly active users | ~50,000                   | Enough for MVP                                                 |
| Project inactivity   | Paused after ~7 days idle | Use a scheduled ping or accept manual resume                   |
| Backups              | No point-in-time recovery | Export schema/seed via migrations in the repo                  |

**Rules derived from these limits:**

- Audio lives in **Storage**, the database stores only the **path**.
- Writing attempts are plain text with a max length (e.g., 5,000 chars) enforced by a DB `check` constraint.
- Every schema change is a **migration file** in the repo (Supabase CLI), so the project can be rebuilt from scratch.

---

## 4. Clean Architecture

### 4.1 Layers

```
┌──────────────────────────────────────────────┐
│  Presentation  (React pages, components,     │
│                 hooks, routes)               │
├──────────────────────────────────────────────┤
│  Application   (use cases, DTOs, ports)      │
├──────────────────────────────────────────────┤
│  Domain        (entities, value objects,     │
│                 business rules, errors)      │
└──────────────────────────────────────────────┘
        ▲
        │ implements ports
┌──────────────────────────────────────────────┐
│  Infrastructure (Supabase repositories,      │
│                  storage adapters, mappers)  │
└──────────────────────────────────────────────┘
```

### 4.2 The Dependency Rule

Dependencies point **inward only**:

- `domain` imports **nothing** from other layers (no React, no Supabase).
- `application` imports only from `domain`.
- `infrastructure` implements interfaces (ports) declared in `application`.
- `presentation` calls use cases; it **never** calls Supabase directly.

Enforce it with `eslint-plugin-boundaries` or `eslint-plugin-import` (`no-restricted-paths`).

### 4.3 Responsibilities

| Layer          | Contains                                                                                        | Must NOT contain            |
| -------------- | ----------------------------------------------------------------------------------------------- | --------------------------- |
| Domain         | `WritingSubmission` entity, `CefrLevel` value object, rules like "a submission cannot be empty" | HTTP, SQL, JSX              |
| Application    | `SubmitWritingAttempt` use case, `SubmissionRepository` interface                               | Supabase client, UI state   |
| Infrastructure | `SupabaseSubmissionRepository`, row ↔ entity mappers                                            | Business rules              |
| Presentation   | Pages, components, `useSubmitWriting` hook                                                      | Business rules, raw queries |

### 4.4 Example flow — submitting a writing attempt

```
WritingExercisePage (presentation)
  → useSubmitWriting() hook
    → SubmitWritingAttempt.execute(input)       (application)
      → WritingSubmission.create(...)            (domain validates)
      → submissionRepository.save(submission)    (port)
        → SupabaseSubmissionRepository.save()    (infrastructure)
          → supabase.from('writing_submissions').insert(...)
```

### 4.5 Code sketch

```ts
// domain/entities/writing-submission.ts
export class WritingSubmission {
  private constructor(
    readonly id: string,
    readonly exerciseId: string,
    readonly studentId: string,
    readonly content: string,
    readonly attemptNumber: number,
    readonly createdAt: Date,
  ) {}

  static readonly MAX_LENGTH = 5000;

  static create(props: Omit<WritingSubmissionProps, 'id' | 'createdAt'>): WritingSubmission {
    const content = props.content.trim();
    if (content.length === 0) throw new EmptySubmissionError();
    if (content.length > WritingSubmission.MAX_LENGTH) throw new SubmissionTooLongError();
    return new WritingSubmission(
      crypto.randomUUID(),
      props.exerciseId,
      props.studentId,
      content,
      props.attemptNumber,
      new Date(),
    );
  }
}
```

```ts
// application/ports/submission-repository.ts
export interface SubmissionRepository {
  save(submission: WritingSubmission): Promise<void>;
  countAttempts(exerciseId: string, studentId: string): Promise<number>;
  listByStudent(studentId: string): Promise<WritingSubmission[]>;
}
```

```ts
// application/use-cases/submit-writing-attempt.ts
export class SubmitWritingAttempt {
  constructor(private readonly submissions: SubmissionRepository) {}

  async execute(input: SubmitWritingInput): Promise<WritingSubmission> {
    const previous = await this.submissions.countAttempts(input.exerciseId, input.studentId);
    const submission = WritingSubmission.create({ ...input, attemptNumber: previous + 1 });
    await this.submissions.save(submission);
    return submission;
  }
}
```

```ts
// infrastructure/supabase/repositories/supabase-submission-repository.ts
export class SupabaseSubmissionRepository implements SubmissionRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async save(submission: WritingSubmission): Promise<void> {
    const { error } = await this.client
      .from('writing_submissions')
      .insert(SubmissionMapper.toRow(submission));
    if (error) throw new RepositoryError('Failed to save submission', { cause: error });
  }
  // ...
}
```

### 4.6 Dependency injection

Use a single **composition root** (`src/app/container.ts`) that builds repositories and use cases, exposed to React through a context provider. This keeps tests able to swap Supabase for in-memory fakes.

---

## 5. Folder Structure

Feature-first at the top, layered inside each feature. Shared kernel for cross-feature code.

```
german-platform/
├── docs/
│   ├── ARCHITECTURE.md          # this file
│   ├── adr/                     # Architecture Decision Records
│   │   └── 0001-use-supabase.md
│   └── glossary.md              # domain terms (Lesson, Unit, Attempt...)
├── supabase/
│   ├── migrations/              # versioned SQL (schema + RLS)
│   ├── seed.sql                 # sample levels, units, lessons
│   └── config.toml
├── src/
│   ├── app/
│   │   ├── container.ts         # composition root (DI)
│   │   ├── providers.tsx        # QueryClient, Auth, Container providers
│   │   └── router.tsx           # routes + role guards
│   ├── features/
│   │   ├── auth/
│   │   │   ├── domain/          # User, Role
│   │   │   ├── application/     # SignIn, SignUp, GetCurrentUser + ports
│   │   │   ├── infrastructure/  # SupabaseAuthGateway
│   │   │   └── presentation/    # LoginPage, RequireRole, useAuth
│   │   ├── curriculum/          # levels, units, lessons, texts
│   │   ├── pronunciation/       # audio assets, player
│   │   ├── writing/             # exercises, submissions, attempts
│   │   ├── feedback/            # teacher review
│   │   └── progress/            # student dashboard
│   ├── shared/
│   │   ├── domain/              # base errors, Result type, CefrLevel
│   │   ├── infrastructure/
│   │   │   └── supabase/
│   │   │       ├── client.ts    # single Supabase client instance
│   │   │       └── database.types.ts  # generated types (do not edit)
│   │   └── ui/                  # Button, Card, AudioPlayer, Layout
│   └── main.tsx
├── tests/
│   └── e2e/                     # Playwright specs
├── .env.example
├── .eslintrc.cjs
├── README.md
└── CONTRIBUTING.md
```

**Rule:** a feature may import from `shared/`, never from another feature's internals. If two features need the same thing, promote it to `shared/`.

---

## 6. Domain Model

```
CefrLevel (A1, A2, B1, B2)
  └── Unit (e.g., "A1.3 – Family")
        └── Lesson
              ├── reading text (Markdown)
              ├── AudioAsset[]      (word/phrase + audio path)
              └── Exercise[]        (writing prompt)
                    └── WritingSubmission[]  (one per attempt, per student)
                          └── Feedback (0..1, written by teacher)
```

### Ubiquitous language (keep names identical in code, DB and docs)

| Term                 | Meaning                                                   |
| -------------------- | --------------------------------------------------------- |
| Level                | CEFR level: A1, A2, B1, B2                                |
| Unit                 | Thematic group of lessons inside a level                  |
| Lesson               | Smallest teaching unit: text + audio + exercises          |
| Exercise             | A writing prompt the student answers                      |
| Submission / Attempt | One answer to an exercise; attempts are never overwritten |
| Feedback             | Teacher's review of a submission                          |

---

## 7. Database Schema

```sql
-- supabase/migrations/0001_initial_schema.sql

create type app_role as enum ('student', 'teacher', 'admin');
create type cefr_level as enum ('A1', 'A2', 'B1', 'B2');

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  role        app_role not null default 'student',
  created_at  timestamptz not null default now()
);

create table units (
  id          uuid primary key default gen_random_uuid(),
  level       cefr_level not null,
  position    int not null,
  title       text not null,
  unique (level, position)
);

create table lessons (
  id          uuid primary key default gen_random_uuid(),
  unit_id     uuid not null references units(id) on delete cascade,
  position    int not null,
  title       text not null,
  content_md  text not null default '',
  is_published boolean not null default false,
  unique (unit_id, position)
);

create table audio_assets (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references lessons(id) on delete cascade,
  german_text text not null,           -- "das Brötchen"
  translation text,                    -- "bread roll"
  ipa         text,                    -- optional phonetic transcription
  storage_path text not null unique    -- "a1/unit-03/brotchen.mp3"
);

create table exercises (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references lessons(id) on delete cascade,
  prompt      text not null,
  min_words   int,
  max_words   int
);

create table writing_submissions (
  id             uuid primary key default gen_random_uuid(),
  exercise_id    uuid not null references exercises(id) on delete cascade,
  student_id     uuid not null references profiles(id) on delete cascade,
  attempt_number int not null check (attempt_number > 0),
  content        text not null check (char_length(content) between 1 and 5000),
  created_at     timestamptz not null default now(),
  unique (exercise_id, student_id, attempt_number)
);

create table feedback (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references writing_submissions(id) on delete cascade,
  teacher_id    uuid not null references profiles(id),
  comment       text not null,
  score         int check (score between 0 and 100),
  created_at    timestamptz not null default now()
);

create index on writing_submissions (student_id, created_at desc);
create index on writing_submissions (exercise_id);
```

Later migrations extend this schema; the migrations are the source of truth. Notable additions: Schreiben task
types, Leitpunkte, Redemittel and drafts (0003, ADR-0002/0003), revisable feedback with `updated_at` (0009,
ADR-0008) and the Sprechen tables `speaking_topics`, `speaking_practices` and `speaking_assessments` (0010,
ADR-0009), extended for telc with `exam`, `source_text` and `follow_up_questions` (0014–0015, ADR-0012), and the
vocabulary tables `flashcards` and `flashcard_marks` (0017, ADR-0013).

### Auto-create profile on sign-up

```sql
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Student'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

> New users are **always** `student`. Only an `admin` can promote someone (never trust a role sent by the client).

Generate TypeScript types after every migration:

```bash
supabase gen types typescript --local > src/shared/infrastructure/supabase/database.types.ts
```

---

## 8. Authentication & Roles

### Permissions matrix

| Action                                | student | teacher | admin |
| ------------------------------------- | :-----: | :-----: | :---: |
| Read published lessons, texts, audio  |   ✅    |   ✅    |  ✅   |
| Submit writing attempts               |   ✅    |   ❌    |  ❌   |
| Read own submissions                  |   ✅    |    —    |   —   |
| Read all submissions                  |   ❌    |   ✅    |  ✅   |
| Write feedback                        |   ❌    |   ✅    |  ✅   |
| Create/edit lessons, exercises, audio |   ❌    |   ✅    |  ✅   |
| Change user roles                     |   ❌    |   ❌    |  ✅   |

### Where authorization happens

1. **Database (source of truth):** RLS policies (section 9). This is the real security boundary.
2. **Frontend (UX only):** route guards hide pages the user cannot use. They do **not** protect data.

```tsx
// features/auth/presentation/require-role.tsx
export function RequireRole({ allowed, children }: RequireRoleProps) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowed.includes(user.role)) return <Navigate to="/forbidden" replace />;
  return children;
}
```

### Secrets

- Frontend uses only the **anon (public) key** via `VITE_SUPABASE_ANON_KEY`.
- The **service_role key must never** be in the frontend, the repo, or `.env` committed files.
- Commit `.env.example`, never `.env`.

---

## 9. Row Level Security (RLS)

Enable RLS on **every** table. No table is left open.

```sql
-- supabase/migrations/0002_rls.sql

-- Helper: current user's role (security definer avoids recursive RLS on profiles)
create function public.current_role()
returns app_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

alter table profiles            enable row level security;
alter table units               enable row level security;
alter table lessons             enable row level security;
alter table audio_assets        enable row level security;
alter table exercises           enable row level security;
alter table writing_submissions enable row level security;
alter table feedback            enable row level security;

-- Profiles
create policy "read own profile or staff reads all" on profiles for select
  using (id = auth.uid() or current_role() in ('teacher', 'admin'));
create policy "update own display name" on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));
create policy "admin manages roles" on profiles for update
  using (current_role() = 'admin');

-- Curriculum: authenticated users read published content, staff manage it
create policy "read published lessons" on lessons for select
  using (auth.role() = 'authenticated' and (is_published or current_role() in ('teacher','admin')));
create policy "staff manage lessons" on lessons for all
  using (current_role() in ('teacher', 'admin'))
  with check (current_role() in ('teacher', 'admin'));
-- Repeat the same read/manage pattern for units, audio_assets, exercises.

-- Submissions
create policy "student inserts own attempt" on writing_submissions for insert
  with check (student_id = auth.uid() and current_role() = 'student');
create policy "student reads own, staff reads all" on writing_submissions for select
  using (student_id = auth.uid() or current_role() in ('teacher', 'admin'));
-- No update/delete policies: attempts are immutable history.

-- Feedback
create policy "staff writes feedback" on feedback for insert
  with check (teacher_id = auth.uid() and current_role() in ('teacher', 'admin'));
create policy "student reads feedback on own submissions" on feedback for select
  using (
    current_role() in ('teacher', 'admin')
    or exists (select 1 from writing_submissions s
               where s.id = feedback.submission_id and s.student_id = auth.uid())
  );
```

**Checklist for every new table:** enable RLS → write select/insert/update/delete policies → test with each role.

---

## 10. Storage (Audio)

| Bucket                | Access                                           | Content                       |
| --------------------- | ------------------------------------------------ | ----------------------------- |
| `pronunciation-audio` | Read: authenticated users · Write: teacher/admin | Reference pronunciation files |

### Conventions

- Path: `{level}/{unit-slug}/{word-slug}.mp3` (lowercase, ASCII, no umlauts: `ä→ae`, `ö→oe`, `ü→ue`, `ß→ss`).
- Format: MP3 or Opus, **mono, 64 kbps**, max ~15 seconds per file.
- Max upload size enforced in bucket settings (e.g., 1 MB).
- Serve via **signed URLs** (short expiry) or public bucket if content is not sensitive; cache URLs with TanStack Query.

```sql
create policy "authenticated reads audio" on storage.objects for select
  using (bucket_id = 'pronunciation-audio' and auth.role() = 'authenticated');
create policy "staff uploads audio" on storage.objects for insert
  with check (bucket_id = 'pronunciation-audio' and public.current_role() in ('teacher','admin'));
```

**Storage budget:** 1 GB ÷ ~100 KB per clip ≈ 10,000 clips. Track usage in the Supabase dashboard.

---

## 11. Clean Code Standards

### Naming

| Element                      | Convention                     | Example                               |
| ---------------------------- | ------------------------------ | ------------------------------------- |
| Files                        | kebab-case                     | `submit-writing-attempt.ts`           |
| React components             | PascalCase                     | `WritingEditor.tsx` → `WritingEditor` |
| Hooks                        | camelCase with `use`           | `useSubmitWriting`                    |
| Classes / types / interfaces | PascalCase, no `I` prefix      | `SubmissionRepository`                |
| Variables / functions        | camelCase, verbs for functions | `countAttempts()`                     |
| Booleans                     | `is/has/can/should` prefix     | `isPublished`, `canSubmit`            |
| Constants                    | UPPER_SNAKE_CASE               | `MAX_SUBMISSION_LENGTH`               |
| DB tables/columns            | snake_case, plural tables      | `writing_submissions.created_at`      |

### Rules

- **Single Responsibility:** one use case per file; one component does one thing.
- **Small functions:** aim for < 20 lines; extract when a comment is needed to explain a block.
- **No magic values:** use named constants and enums.
- **Explicit errors:** custom error classes (`EmptySubmissionError`), never `throw 'string'`.
- **No `any`:** TypeScript `strict: true`; use `unknown` and narrow.
- **Components without logic:** business rules live in domain/use cases; components render and delegate.
- **Guard clauses** instead of nested `if/else`.
- **Comments explain _why_, not _what_.** Code should explain _what_.
- **No dead code** or commented-out blocks in `main`.
- **Immutability by default:** `readonly`, `const`, no mutation of props/state.

### Tooling (enforced in CI)

```jsonc
// tsconfig.json (excerpt)
{ "compilerOptions": { "strict": true, "noUncheckedIndexedAccess": true, "noImplicitReturns": true } }
```

- ESLint: `@typescript-eslint/recommended-type-checked`, `react-hooks`, `boundaries` (layer rules)
- Prettier: single source of formatting truth
- Husky + lint-staged: lint and format before commit

---

## 12. Testing Strategy

| Level       | Tool                    | Target               | What to test                                              |
| ----------- | ----------------------- | -------------------- | --------------------------------------------------------- |
| Unit        | Vitest                  | domain + application | Entity rules, use cases with in-memory repositories       |
| Component   | React Testing Library   | presentation         | Rendering, user interaction, error states                 |
| Integration | Vitest + local Supabase | infrastructure       | Repositories and **RLS per role**                         |
| E2E         | Playwright              | critical flows       | Sign-up → open lesson → submit writing → teacher feedback |

- Domain and application layers target **≥ 90% coverage**; they have no external dependencies, so it's cheap.
- Test names describe behavior: `it('rejects an empty submission')`.
- Run Supabase locally with `supabase start` for integration tests; never test against production.

---

## 13. Documentation Standards

All documentation is in **English**.

| Artifact     | Location                  | Content                                                |
| ------------ | ------------------------- | ------------------------------------------------------ |
| README       | `/README.md`              | What it is, setup, scripts, env vars                   |
| Architecture | `/docs/ARCHITECTURE.md`   | This document                                          |
| ADRs         | `/docs/adr/NNNN-title.md` | One decision per file: context, decision, consequences |
| Glossary     | `/docs/glossary.md`       | Domain terms (section 6)                               |
| Contributing | `/CONTRIBUTING.md`        | Branching, commits, PR checklist                       |
| Code docs    | TSDoc on public APIs      | Use cases, ports, shared UI components                 |
| Changelog    | `/CHANGELOG.md`           | Generated from Conventional Commits                    |

### ADR template

```md
# ADR-0001: Use Supabase as backend

- Status: Accepted
- Date: YYYY-MM-DD

## Context

Need auth, relational DB and file storage with zero cost for MVP.

## Decision

Use Supabase Free Tier (Postgres + Auth + Storage), with RLS as the authorization boundary.

## Consequences

- No custom backend to maintain.

* Free tier limits (storage, project pausing); business rules must be mirrored in RLS.
```

### TSDoc example

```ts
/**
 * Stores a new writing attempt for a student.
 * Attempts are immutable; each call creates a new attempt number.
 *
 * @throws {EmptySubmissionError} when content is blank
 * @throws {SubmissionTooLongError} when content exceeds MAX_LENGTH
 */
```

---

## 14. Git Workflow

- Branches: `main` (protected) · `feat/*` · `fix/*` · `docs/*` · `chore/*`
- **Conventional Commits:** `feat(writing): store attempt number per exercise`
- PRs require: passing CI (lint, type-check, tests), updated docs/ADR when architecture changes, new migration when schema changes.

### PR checklist

- [ ] Layer boundaries respected (no Supabase import outside `infrastructure`)
- [ ] RLS policies added/updated for any new table
- [ ] DB types regenerated
- [ ] Tests added for new behavior
- [ ] Docs updated (README / ADR / glossary)

---

## 15. Roadmap

| Phase                   | Deliverables                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 0 — Setup               | Repo, Vite + TS, ESLint/Prettier, CI, Supabase project, migrations 0001–0002                                          |
| 1 — Auth                | Sign-up/in, profiles, role guards, admin role management                                                              |
| 2 — Curriculum          | Levels/units/lessons, Markdown reader, teacher content editor                                                         |
| 3 — Pronunciation       | Audio upload (staff), audio player (students)                                                                         |
| 4 — Writing             | Exercises, submissions, attempt history                                                                               |
| 5 — Feedback & progress | Teacher review queue, student dashboard                                                                               |
| Later                   | Student voice recording (watch storage), AI-assisted writing feedback via Edge Function, spaced repetition vocabulary |

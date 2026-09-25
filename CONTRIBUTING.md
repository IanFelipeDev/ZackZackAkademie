# Contributing

## Branches and commits

- `main` is protected; work on `feat/*`, `fix/*`, `docs/*` or `chore/*`.
- [Conventional Commits](https://www.conventionalcommits.org/): `feat(writing): store attempt number per exercise`.
- Code, comments, commits and docs are in **English**. Text shown to users is in **Portuguese (pt-BR)**;
  study content is in German.
- The pre-commit hook runs ESLint and Prettier on staged files (Husky + lint-staged).

## PR checklist

- [ ] Layer boundaries respected (ESLint `boundaries/dependencies` passes; no Supabase import outside `infrastructure`)
- [ ] RLS policies added/updated for any new table, with a case in `tests/integration/rls.test.ts`
- [ ] New migration for schema changes; `database.types.ts` regenerated
- [ ] Tests added for new behavior (use cases with in-memory adapters, flows in `src/app/app-flows.test.tsx`)
- [ ] Docs updated (README / ADR / glossary)

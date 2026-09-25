# ADR-0001: Use Supabase as backend

- Status: Accepted
- Date: 2026-09-25

## Context

The platform needs authentication, a relational database and file storage with zero cost for the MVP, and the
team has no capacity to run a custom backend.

## Decision

Use the Supabase Free Tier (Postgres + Auth + Storage), with Row Level Security as the authorization boundary.
The frontend is a static Vite build hosted on Vercel and talks to Supabase directly with the publishable (anon) key.

Every schema change is a migration in `supabase/migrations/`, applied to the hosted project with
`supabase db push`. Nobody runs Docker locally; CI starts a disposable local stack to replay all migrations and
run the RLS integration tests.

## Consequences

- No custom backend to maintain; hosting is free (Vercel + Supabase free tiers).
- Business rules that protect data must be mirrored in RLS, not only in the frontend.
- The RLS helper is `app_current_role()` rather than `current_role()` (ARCHITECTURE §9), because
  `current_role` is a reserved SQL keyword in Postgres.
- Free-tier limits apply (storage, project pausing after inactivity).

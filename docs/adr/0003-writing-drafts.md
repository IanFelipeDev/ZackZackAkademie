# ADR-0003: Separate mutable drafts from immutable submissions

- Status: Accepted
- Date: 2026-09-25

## Context

Writing attempts are immutable history (ARCHITECTURE §6, §9: no update/delete policies). The Stitch design,
however, has "Entwurf speichern", autosave and "Continuar escrevendo", which need text that changes while the
student works.

## Decision

Add a `writing_drafts` table with one row per (student, exercise), overwritten on every save (upsert) and
deleted when the student submits or clears it. Students have full CRUD on their own drafts only; staff cannot
see drafts. Content is capped at the same 5,000 characters as submissions.

## Consequences

- Submissions stay append-only; drafts never show up in teacher review.
- Autosave writes at most once per pause in typing (1.5 s debounce), which keeps request volume low on the free tier.

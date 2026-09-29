# ADR-0011: Public landing page

- Status: Accepted
- Date: 2026-09-29

## Context

The site root only redirected to the login. The school needs a public page that presents Melissa's classes and
leads visitors to a free advisory meeting. The design comes from a Stitch sketch (Tailwind CDN, images on
Google hosts, looping animations), which cannot ship as-is under the site's CSP.

## Decision

- `/` renders `LandingPage` (`src/features/landing`, presentation only, lazy-loaded) for everyone. Signed-in
  users get a "Minha área" button (`homePathFor`); the app header's logo now leads to the user's own home, and the
  PWA `start_url` is `/entrar`, which redirects signed-in users to their home.
- The main call to action opens WhatsApp with a prefilled message; there is still no self sign-up.
- Only features that exist are listed as available; planned ones (Lesen, Hören, flashcards, planner, class
  materials, curated links) appear under "Em breve". Unverifiable claims from the sketch (quality seal, C1/TestDaF
  preparation) were dropped; levels are stated as A1–B2 throughout.
- Images are served from `public/` (logo reused from `public/brand`, Melissa's photo with her consent, the class
  banner) so the CSP stays `img-src 'self'`.
- Motion follows the vendored animation skills (`.claude/skills`): CSS only, `transform`/`opacity`/`clip-path`,
  strong curves as tokens (`--ease-strong-out`, `--ease-strong-in-out`), a staggered hero entrance, one-time scroll
  reveals, press feedback, hover lift gated to fine pointers, and reduced motion honoured. The sketch's infinite
  loops (floating badges, pulsing CTA, shimmer) were removed: constant motion competes with reading and has no
  purpose on a page read top to bottom.
- Texts live in `landing-content.ts` so wording can change without touching layout.

## Consequences

- When a planned feature ships, move it from `PLATFORM_COMING` to `PLATFORM_AVAILABLE`.
- Melissa's photo is 512 px wide; a larger original would look sharper on high-density screens.

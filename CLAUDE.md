# CLAUDE.md

Guidance for working in this repo.

## What this is
**Mumotor** — an AI/no-code **website builder for driving instructors** (one teacher = one site).
Flow: wizard `/builder` → pick 1 of 9 presets → generate → live preview → publish → hosted at
`GET /site/{slug}` (prod `{slug}.mumotor.com`). Then operate from `/dashboard`. Trilingual HE/AR/EN + RTL.

> The folder, packages, branding, domain, and GitHub repo are all **mumotor**. (Renamed from the old
> `otto-il` codename in June 2026.) The Postgres role/db are still `otto` / `otto_driving` — internal
> only, left unchanged to avoid touching the local database.

## Monorepo layout
- `packages/backend` — Express 4 + Prisma 5 + PostgreSQL, Redis (optional), node-cron. `@mumotor/backend`.
- `packages/frontend` — React 18 + Vite 5 + TanStack Query + React Router + Tailwind. `@mumotor/frontend`.
- Published teacher sites are served by the backend at `GET /site/:slug` (Redis-cached HTML).

## Run locally
```bash
npm install
# Postgres must be running on :5432 (Homebrew service or `npm run db:up` for Docker)
npm run db:migrate && npm run db:seed
npm run dev            # API :4000 + web :5173
```
- Demo teacher: `teacher@mumotor.local` / `password123` · admin: `admin@mumotor.local`
- Published demo: `http://localhost:4000/site/davids-driving` · enroll code `DRIVE2026`
- DB: `postgresql://otto:otto@localhost:5432/otto_driving` (role/db name unchanged from the old codename).

## Design system (June 2026 — trust-blue corporate + glass)
Redesigned from the old "oxblood clay / AI-template" look to a calm, professional, big-tech feel:
flat trust-blue palette + tasteful glassmorphism. The **token names were kept and only their values
changed**, so the thousands of `*-sun-*` / `*-sand-*` classes never needed renaming.
- Tokens live in `packages/frontend/tailwind.config.js`; global CSS in `src/index.css`. Palette meanings now:
  **`sand` = neutral slate** (navy ink `#0F172A` + light surfaces/borders), **`sun` = blue** (`#2563EB`,
  the PRIMARY brand colour / main CTA), **`ember` = red** (danger only), **`accent` = orange** (`#F97316`,
  one restrained highlight — never a competing CTA), `dawn`/`brand` are back-compat aliases.
- Buttons: `btn-primary` = solid blue (main CTA), `btn-sun` = solid navy (dark alternate), `btn-secondary`
  = frosted glass, `btn-danger` = red. One primary CTA per screen; radius is `rounded-lg` (not pills).
- **Glassmorphism**: `body` has a faint blue ambient wash so frost refracts. Shared primitives are frosted
  by default — `.card`, `.input`, `.pill`, `.btn-secondary`, the Modal. Use `.glass` for light sticky
  chrome (navs, sidebars, dropdowns, floating panels) and `.glass-dark` for navy/overlay surfaces. Keep
  primary CTAs and dense body text solid for legibility — glass goes on chrome, not on text blocks.
- Typography: one clean sans (**Plus Jakarta Sans**, loaded in `index.html`). No serif display. Headings are
  `font-semibold tracking-tight text-sand-900`. The old `.font-display`, gradient-text (`.text-sunrise`,
  `.text-clay-accent*`), glow (`.sun-glow`), grain (`.bg-grain`), shimmer (`.shine`) and `ring-sunrise`
  are flattened to no-ops/solids in `index.css` — kept only so stray references still resolve; don't use them.
- Logo: flat monogram "M" lettermark in an ink squircle + lowercase `mumotor` wordmark
  (`components/Logo.tsx`, `invert` for dark surfaces); favicon `public/favicon.svg` matches. No icon/illustration.
- The old cinematic video intro gate is **removed**: `CinematicHero.tsx` is now a calm static hero and
  `lib/useIntro.ts` is a no-op (no `mm_intro_seen`, no phases, nav always visible). `lib/audio.ts` and the
  `public/media/hero-car.*` clips are unused/left in place.

## Conventions
- Generation is **deterministic** (presets + builder in `backend/src/services/ai/`), not a freeform AI call.
- After editing `tailwind.config.js`, the Vite dev server can serve **stale CSS** — restart it (and clear
  `packages/frontend/node_modules/.vite`) to pick up token changes.
- Typecheck before shipping: `npm run typecheck --workspace @mumotor/frontend`.

## Testing
- Backend: `cd packages/backend && NODE_ENV=test ENABLE_CRON=false npx tsx watch src/index.ts`, then `npm test`.
- Frontend E2E: Playwright lives in `packages/frontend/node_modules` (not browser-installed globally);
  run scripts from the repo root so the local `playwright` package resolves.

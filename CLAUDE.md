# CLAUDE.md

Guidance for working in this repo.

## What this is
**Mumotor** — an AI/no-code **website builder for driving instructors** (one teacher = one site).
Flow: wizard `/builder` → pick 1 of 9 presets → generate → live preview → publish → hosted at
`GET /site/{slug}` (prod `{slug}.mumotor.com`). Then operate from `/dashboard`. Trilingual HE/AR/EN + RTL.

> The on-disk folder is still named `otto-il` (the original DriveSawa/Otto codename). It's only the
> local directory name — the package, branding, domain, and GitHub repo are all **mumotor**. Renaming
> the folder is optional and breaks absolute paths / running dev servers, so it's left as-is.

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

## Design system (June 2026 — dark oxblood clay)
- Tokens live in `packages/frontend/tailwind.config.js` (palettes `sand`/`sun`/`ember`/`brand`/`dawn`)
  and hardcoded accents in `src/index.css`. **`sun` = the clay primary** (`#7E3B32`); the token name is
  kept (not "clay") so the thousands of `*-sun-*` classes across the app didn't need renaming.
- Headline accents: `.text-clay-accent` (for light backgrounds) and `.text-clay-accent-light`
  (for dark backgrounds) — pick the variant that contrasts with its surface.
- Landing intro: `components/hero/CinematicHero.tsx` + `lib/useIntro.ts` (session gate `mm_intro_seen`,
  phases `gate → driving → revealed`). The intro is **silent** — there is no engine sound. Real
  driving-lesson clip in `public/media/hero-car.{mp4,webm}` + poster; it's paused on the poster until
  the visitor presses Start. Nav + page content stay hidden until `revealed`.
- Logo: steering-wheel mark on a clay tile in `components/Logo.tsx`; favicon `public/favicon.svg`.
- `lib/audio.ts` (procedural Web Audio engine) is **no longer used** — kept but unreferenced.

## Conventions
- Generation is **deterministic** (presets + builder in `backend/src/services/ai/`), not a freeform AI call.
- After editing `tailwind.config.js`, the Vite dev server can serve **stale CSS** — restart it (and clear
  `packages/frontend/node_modules/.vite`) to pick up token changes.
- Typecheck before shipping: `npm run typecheck --workspace @mumotor/frontend`.

## Testing
- Backend: `cd packages/backend && NODE_ENV=test ENABLE_CRON=false npx tsx watch src/index.ts`, then `npm test`.
- Frontend E2E: Playwright lives in `packages/frontend/node_modules` (not browser-installed globally);
  run scripts from the repo root so the local `playwright` package resolves.

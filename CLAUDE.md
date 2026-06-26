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

## Design system (June 2026 — Apple-style minimal)
Redesigned to a premium, **near-monochrome, Apple-style minimal** look (lots of whitespace, almost no
colour, oversized type). Replaced the earlier "oxblood clay" and the rejected "trust-blue + glass" passes.
The **token names were kept and only their values changed**, so the thousands of `*-sun-*` / `*-sand-*`
classes never needed renaming.
- Tokens live in `packages/frontend/tailwind.config.js`; global CSS in `src/index.css`. Palette meanings now:
  **`sand` = the monochrome greyscale** — `sand-50` `#F5F5F7` (Apple light grey, section bands), `sand-500/600`
  muted text, `sand-900` `#1D1D1F` near-black ink, `sand-950` `#000`. **`sun` = the ONE accent, Apple blue
  `#0071E3`** — use sparingly (primary CTA, links, active state, focus). **`ember` = red** (danger only).
  `accent`/`dawn`/`brand` = neutral/blue back-compat aliases (no loud colour).
- Buttons are **Apple pills** (`rounded-full`): `btn-primary` = blue pill (main CTA), `btn-sun` = near-black
  pill (dark alt), `btn-secondary` = soft grey pill, `btn-ghost` = blue "Learn more ›" text link, `btn-danger`
  = red. One primary CTA per screen.
- **Mostly flat, solid surfaces.** Body is pure white (no colour wash). `.card`/`.input`/`.pill` are clean
  solid (white / `border-sand-200`). Glassmorphism is reserved for the **translucent sticky nav/topbar only**
  via `.glass` (`bg-white/80 backdrop-blur-xl`); `.glass-dark` exists for the rare dark overlay. Dark sections
  use SOLID `bg-black`/`bg-sand-900` with white text + `text-sand-400` secondary — not translucent glass.
- Typography: **system-first stack** (`-apple-system`/SF Pro on Macs, **Inter** fallback loaded in `index.html`).
  No serif. Headings big & tight: `font-semibold tracking-tight text-sand-900` (hero/section titles run
  `text-4xl`→`text-6xl`). The legacy `.font-display`, gradient-text (`.text-sunrise`, `.text-clay-accent*`),
  glow (`.sun-glow`), grain (`.bg-grain`), shimmer (`.shine`), `ring-sunrise` are flattened to no-ops/solids
  in `index.css` — kept only so stray references resolve; don't use them.
- Logo: monogram "M" lettermark in a white squircle, the **M a blue gradient (light→dark, `#5EA8F2`→`#0047AB`)**
  (`components/Logo.tsx`, `invert` for dark surfaces); favicon `public/favicon.svg` matches. No illustration/icon.
- Landing extras (`pages/Landing.tsx`): a fixed creative background (`components/Background.tsx` — soft blue
  aurora orbs + faint `.bg-grid-fine`, scroll-parallax, reduced-motion safe); a real driving-lesson **video**
  hero (`public/media/hero-car.*`) + photos (`public/img/hero-drive.jpg`, `instructor.jpg`); **scroll-driven 3D**
  via `ScrollTilt` in `components/motion.tsx`; **glass buttons** (`.btn-glass`/`.btn-glass-dark`, and `.btn-secondary`
  is glass) + glass nav. A dark "Everything a driving instructor's site needs" section lists driving-specific
  essentials (packages/pricing, manual & automatic, areas covered, reviews, booking, WhatsApp).
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

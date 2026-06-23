# DriveSawa

**An AI/no-code website builder built exclusively for driving instructors.** A teacher answers a short wizard, picks one of 9 premium templates, and DriveSawa **generates and hosts** a complete, trilingual (Hebrew / Arabic / English) website at `your-name.drivesawa.com`. They edit it visually, publish it, then run their whole business — student enrollment, lesson booking, daily codes, schedule reports, and bulk email — from one dashboard.

One teacher = one website. Booking-first. Built for bilingual Israel (Arabic + Jewish communities).

```
Build → Edit → Publish → Operate
wizard   visual editor   /site/{slug}   dashboard
```

---

## Table of contents
- [Highlights](#highlights)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Quick start (local)](#quick-start-local)
- [The core flow](#the-core-flow)
- [Deployment (Railway + Vercel)](#deployment-railway--vercel)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [API surface](#api-surface)
- [Internationalization](#internationalization)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Notes & deviations](#notes--deviations)

---

## Highlights

- **Website generator** — 9 distinct, light-themed premium presets + a deterministic builder that assembles a complete, self-contained, responsive site (hero · stats · how-it-works · about · lessons · gallery · reviews · FAQ · contact · CTA) with photographic imagery and working **Enroll / Book** CTAs.
- **Builder wizard** — welcome → about → lessons & hours → contact → pick design → generate → live preview → publish.
- **Visual editor** — live preview with viewport switching, preset + color theming, inline content fields, autosave, and one-click publish.
- **Operational dashboard** — students (search/filter/paginate, pause/finish/delete), today's schedule, daily enrollment codes, bulk email, reviews, publishing, billing, settings.
- **Public student flow** — code enrollment, self-service lesson booking (advance window, same-day cutoff, breaks, no double-booking), magic-link login, self-pause.
- **Automated jobs** — 09:00 "booking open" emails, 20:00 teacher schedule report, ~2h lesson reminders.
- **Trilingual + RTL** — HE / AR / EN with a language switcher; generated sites are fully translated and RTL-aware.
- **Secure** — JWT auth + ownership checks, salted+hashed codes, timing-safe comparisons, rate limiting, transactional booking, one-time website-scoped magic links.

---

## Architecture

```
Browser ──► React SPA (Vite, :5173)  ── /api ─►  Express API (:4000)
                                                   ├─► PostgreSQL (Prisma)
                                                   ├─► Redis (magic tokens, rate limits, site cache) — optional
                                                   ├─► Email (SMTP, console fallback)
                                                   └─► node-cron (reminders / daily emails)
Published teacher sites:  GET /site/{slug}  (Redis-cached HTML)  →  {slug}.drivesawa.com in prod
```

Redis and SMTP are optional locally (in-memory KV + console-email fallbacks), so the app runs with just PostgreSQL.

---

## Tech stack

| Layer | Choice |
|---|---|
| Language | TypeScript (strict) |
| API | Express 4, Zod, JWT, bcrypt |
| ORM / DB | Prisma 5 + PostgreSQL (~16 models) |
| Cache | Redis (ioredis) + in-memory fallback |
| Email | Nodemailer (console fallback) |
| Jobs | node-cron |
| Frontend | React 18, Vite 5, TanStack Query, React Router, Tailwind CSS |
| i18n | i18next + react-i18next (HE/AR/EN, RTL) |
| Deploy | Railway (API + Postgres + Redis), Vercel (SPA), Docker |

---

## Quick start (local)

**Prerequisites:** Node ≥ 20, PostgreSQL ≥ 14 (running), Redis (optional).

```bash
npm install
cp .env.example packages/backend/.env          # adjust DATABASE_URL if needed
createdb otto_driving                           # or: docker compose up -d
npm run db:migrate                              # apply migrations
npm run db:seed                                 # demo teacher, site, students, codes
npm run dev                                     # API :4000 + web :5173
```

Open **http://localhost:5173**.

- **Build a site:** http://localhost:5173/builder
- **Teacher dashboard:** teacher@otto.local / password123
- **Published demo site:** http://localhost:4000/site/davids-driving
- **Enroll (code `DRIVE2026`):** http://localhost:5173/p/davids-driving/enroll

---

## The core flow

1. **`/builder`** — the teacher fills the wizard and picks a preset; `POST /api/ai/v2/generate-website` returns a live HTML preview.
2. **Publish** — creates a `Website` (status `DRAFT`), syncs booking settings, then `POST /api/websites/:id/publish` regenerates the HTML with the real slug, snapshots a version, caches it in Redis, and flips status to `PUBLISHED`.
3. **Serve** — `GET /site/:slug` returns the published HTML (→ `{slug}.drivesawa.com` via wildcard DNS in prod).
4. **Edit** — `/editor/:id` re-generates a live preview as the teacher tweaks content/colors/preset, autosaves, and republishes.
5. **Operate** — students enroll + book on the live site; the teacher manages everything from `/dashboard`.

---

## Deployment (Railway + Vercel)

> Real deploys require **your** Railway and Vercel accounts. Everything below is wired and ready; run the commands from the monorepo root.

### Backend → Railway
- Provisions: Backend (Docker) + PostgreSQL + Redis.
- `Dockerfile` (root, multi-stage) and `railway.toml` are included. `NODE_ENV=staging`. Railway assigns `PORT` (the app reads it from env).
- Set env vars on the service (see below). Then:
  ```bash
  railway up --detach
  railway run npm run db:deploy --workspace @otto/backend   # migrations as a separate step
  ```
- Wildcard DNS `*.drivesawa.com` → the service enables per-teacher subdomains; `GET /site/:slug` serves each.

### Frontend → Vercel
- Root directory override: `packages/frontend` (SPA rewrite in `packages/frontend/vercel.json`).
- Set `VITE_API_URL=https://<backend>/api` and `VITE_SITE_BASE=https://<backend>`. Then:
  ```bash
  npx vercel --prod --yes
  ```

---

## Environment variables

See `.env.example` (root). Required: `DATABASE_URL`, `JWT_SECRET`. Optional integrations (the app runs without them): `REDIS_URL`, `SMTP_*`, `STRIPE_*`, `GROQ/OPENAI/...` AI keys, `S3_*`, `PEXELS_API_KEY`. Locale: `BUSINESS_TIMEZONE` (default `Asia/Jerusalem`), `DEFAULT_LOCALE` (`he`).

---

## Scripts

Root: `npm run dev` · `npm run build` · `npm run db:migrate` · `npm run db:seed` · `docker compose up -d`
Backend: `npm test` (integration suite) · `npm run db:reset` · `npm run db:deploy` (migrate deploy) · `npm run test:cron`
Frontend: `npm run dev` · `npm run build` · `node e2e/capture.mjs <tag>` (screenshot sweep) · `node e2e/wizard.mjs` (builder E2E)

---

## API surface

`/api` prefix. Highlights:

- **Auth** — `POST /auth/register|login`, `GET/PATCH /auth/me`, `POST /auth/change-password`
- **Generation** — `GET /ai/v2/quick-templates`, `POST /ai/v2/generate-website`
- **Websites** — CRUD `/websites`, `POST /websites/:id/publish|unpublish`
- **Driving school (17 endpoints)** — teacher: settings, students, daily-report, daily-code, bulk-email; public: enroll, check-enrollment, public-availability, book-lesson, daily-code/validate, validate-magic-link, self-deactivate, public-settings
- **Reviews / Subscriptions** — `/reviews`, `/subscriptions`
- **Site serving** — `GET /site/:slug` (root)

---

## Internationalization

i18next with HE / AR / EN and full RTL (`dir` toggled per language). A language switcher appears in the marketing site, dashboard, and student pages. **Generated sites are fully translated** (nav, sections, default services/FAQs/reviews) and render RTL for Hebrew/Arabic. Fallback chain: requested → English.

---

## Testing

- **Backend integration suite (70 assertions)** — auth, ownership, settings, codes, enrollment, availability, booking (double-book / breaks / advance / cutoff / past), student management, daily report, bulk email, self-deactivate, magic links.
  ```bash
  # server in test mode (rate limiting bypassed for the suite)
  cd packages/backend && NODE_ENV=test ENABLE_CRON=false npx tsx watch src/index.ts
  # then, in another terminal:
  cd packages/backend && npm test
  ```
- **Builder E2E (Playwright)** — `node packages/frontend/e2e/wizard.mjs` drives wizard → generate → publish and verifies the live site.
- **Visual sweep** — `node packages/frontend/e2e/capture.mjs <tag>` screenshots every page (desktop + mobile).

---

## Project structure

```
packages/
  backend/
    prisma/schema.prisma          # ~16 models
    prisma/migrations/            # SQL migrations (railway migrate deploy)
    src/
      routes/                     # auth, websites, drivingSchool (17), aiGeneration, reviews, subscriptions, siteServing
      services/
        ai/                       # templatePresets (9), templateBuilder, templateStrings (HE/AR/EN), generator
        auth, email, jobs, scheduling
      middleware, utils, lib, config
    test/                         # integration + cron checks
  frontend/
    src/
      pages/  builder/ editor/ dashboard/ public/ auth/ Landing
      components/  Logo, LanguageSwitcher, motion, ui, layout, PublicShell
      lib/  api, auth, i18n, wizard, types, utils
    e2e/                          # Playwright harness
Dockerfile · railway.toml · packages/frontend/vercel.json · docker-compose.yml
```

---

## Notes & deviations

- **Express (not Fastify)** + React Query — the original reference lists Fastify/BullMQ/Zustand; this build keeps a battle-tested Express/Prisma/React-Query core (node-cron for jobs, local state for the wizard) for the same behavior without a rewrite.
- **Billing is demo-mode** (plans switch without payment) until `STRIPE_SECRET_KEY` is set.
- **Generation is deterministic** (presets + builder), not a freeform AI call — predictable, fast, on-brand. AI keys only power optional bio enhancement.
- **Scheduling math is timezone-aware** (UTC internally; set `BUSINESS_TIMEZONE`).
- **App-shell i18n** covers the public-facing surfaces (landing, generated sites, student shells) fully; deeper internal dashboard strings fall back to English and are extensible via `src/lib/i18n.ts`.
```

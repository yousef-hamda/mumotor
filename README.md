# Mumotor

**An AI/no-code website builder built exclusively for driving instructors.** A teacher answers a short wizard, picks one of **18 premium, distinct templates**, and Mumotor **generates, lets them visually customize, and hosts** a complete, trilingual (Hebrew / Arabic / English) website. They then run their whole business — student enrollment, lesson booking, daily codes, schedule reports, bulk email, reviews — from one dashboard.

One teacher = one website. Booking-first. Built for bilingual Israel (Arabic + Jewish communities).

```
Build  →  Customize  →  Publish  →  Operate
wizard    inline editor   /p/{slug}    dashboard
```

---

## Table of contents
- [Highlights](#highlights)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Quick start (local)](#quick-start-local)
- [The core flow](#the-core-flow)
- [Templates & the Customize editor](#templates--the-customize-editor)
- [Multi-tenant data isolation](#multi-tenant-data-isolation)
- [Deployment (Railway)](#deployment-railway)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [API surface](#api-surface)
- [Internationalization](#internationalization)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Notes & deviations](#notes--deviations)

---

## Highlights

- **Brand & landing** — a premium, near-monochrome **Apple-style minimal** design system (Tailwind tokens `sand` = greyscale, `sun` = the one accent Apple-blue `#0071E3`, `ember` = danger; `tailwind.config.js` + `index.css`; system/SF-Pro font with an Inter fallback). The marketing page (`pages/Landing.tsx`) has a fixed aurora background, a real driving-lesson video hero, scroll-driven 3D tilt, glass nav, and a dark "everything a driving instructor's site needs" section. Gradient-`M` monogram logo (`components/Logo.tsx`).
- **18 distinct website templates**, each with its own world, palette, typefaces and a signature scroll interaction — the **`mumotor`** brand template (Apple-minimal, with an on-card accent-colour picker) plus **13 signature designs**: `meridian` (topographic survey with a route line that draws itself), `bezel` (a machined instrument whose stat dials sweep), `solari` (a split-flap departures board), `cadence` (kinetic variable-font typography), `circuit` (motorsport telemetry — a car laps a hand-drawn circuit as you scroll), `press` (letterpress type debossed into cotton paper), `reel` (35mm cinema with a scroll-scrubbed filmstrip), `slate` (a chalkboard whose road-diagrams draw themselves), `folio` (a glossy magazine, full-bleed cover photography), `primary` (Bauhaus geometry), `gallery` (a museum exhibition with a spotlight that follows your scroll), `gilt` (foil-stamped luxury), `sumi` (sumi-e ink wash with a brushed enso), and four kept originals (`obsidian`, `grid-ink`, `open-road`, `easy-lane`). Every template is **full-width desktop** (fills the frame, full-bleed nav/bands), a self-contained responsive long-scroll site (hero · stats · packages · about · areas · reviews · gallery · FAQ · booking · contact) rendered from a shared `TemplateData` contract, and defaults to real driving-lesson photography.
- **Builder wizard** — welcome → business info → driving setup (lesson **plans**, **manual/automatic/both**, per-day hours, breaks, booking window, instructor photo) → contact & socials → **pick template + logo** → live preview (with a switcher across all 6) → publish. An **Auto-fill sample** button populates demo data.
- **Inline visual Customize editor** — full-screen live site, no side panel. Click anything to edit: **text** (type inline + Text/Fill colour), **icons** (swap from the full lucide icon library), **images** (upload or find on Unsplash), **background & colours** (a "Colours" panel), and **lists** (add/remove packages/FAQs/areas/stats inline). Undo / Redo / Reset; persists only on **Save**.
- **Operational dashboard** — overview (live student/booking counts per site), Driving Teacher (rotating + static enrollment code, students with search/filter/pause/finish/delete, a **Today/Tomorrow schedule** (add an active student into a free slot, cancel a booking — the student is emailed — and an on-demand "Email me the schedule"), email a group **or specific students**, full booking/hours/profile settings), reviews (approve/delete), publishing (customize/edit/visit/unpublish), billing, account (profile, password, **delete a website**).
- **Public student flow (themed to match each template)** — one-time-code enrollment, then a **student account** at `/p/:slug/account` reachable from a **"My account" button in every template's nav**: sign in with **email only** (the code is only for first enrollment), see a **next-lesson highlight**, book **tomorrow's** lesson (slots shown as **start–end**, e.g. "08:00 – 09:00", with an "arrive 5 min early" note), **chat with the instructor**, and edit profile. To change or cancel a lesson students contact the instructor (only the teacher cancels). The enroll/book/account/review pages adopt the teacher's chosen template palette, font, light/dark and RTL — and are **fully localized to the site's language** (HE/AR/EN, digits stay Latin); a logged-in student booking again **skips the email step** (`TemplatedShell`). **Double-booking is impossible** (DB partial unique index).
- **Teacher chat inbox** — `/dashboard/messages`: two-way messaging with each student (polling), plus a **"Copy link"** button on the overview to share the site with students.
- **Automated jobs** — "booking open" emails, teacher schedule report, lesson reminders (node-cron).
- **Trilingual + RTL, everywhere** — HE / AR / EN with a language switcher. The **entire app** follows it: the marketing landing, the **builder wizard**, the **dashboard** (every page), the **auth pages**, the **Customize** toolbar, the **student pages**, and **all 12 generated templates** — RTL-aware, numbers kept in Latin digits. The wizard's "website language" defaults to the app language.
- **Multi-tenant & secure** — every site's data is isolated by `websiteId` (cascade deletes + indexes); JWT auth (**algorithm-pinned HS256**, `kind`-typed, **session revocation via `tokenVersion`** on password change/reset) + ownership checks, separate student session tokens (kind-scoped, per-site), Bearer-only transport (no CSRF), salted/hashed codes, timing-safe comparisons, weak-password denylist, **spoof-resistant rate limiting** (`req.ip`) with a global backstop, transactional booking + DB-level no-double-booking, one-time website-scoped magic links, required prod `JWT_SECRET`, CORS allowlist, magic-byte-validated uploads, bounded request payloads.
- **Responsive on every device (phone · tablet · desktop), automatically** — the whole product adapts to the device with zero user toggle: all 12 templates, the entire student flow, the teacher dashboard, the builder, the Customize editor, and the marketing/auth site. Touch devices get ≥44px tap targets and ≥16px inputs (no iOS zoom); data tables collapse to cards on phones; the landing and dashboard have proper mobile menus; **the Customize editor is fully touch-usable** (tap-to-edit, ▲/▼ reorder). Touch/phone rules are scoped (`@media (pointer:coarse)`, `coarse:`/`touch:` Tailwind variants + `lib/useDevice.ts`) so the **laptop/desktop rendering is unchanged**. RTL (HE/AR) mirrors correctly; no page ever scrolls horizontally.
- **Installable as an app (PWA) — Mumotor *and* every teacher site** — both can be added to the phone/iPad/desktop home screen and launch full-screen (no browser chrome), each with its own name, icon and status-bar colour. Because the whole product is one SPA, each published teacher site serves a **dynamic per-teacher Web App Manifest** (`GET /site/:slug/manifest.webmanifest` + a generated accent-tinted icon) so installing an instructor's site becomes *their* app, not "Mumotor"; the client swaps the manifest/icon/title per route (`lib/pwa.ts`). A lean hand-rolled **service worker** (`public/sw.js`) makes repeat visits fast and works offline as an app shell, while **never** caching API/booking data or the dynamic manifest. An unobtrusive **"Install app"** affordance appears in the dashboard/landing and as a themed pill on each site (with an iOS "Add to Home Screen" hint); it hides once installed. Safe-area handling keeps installed apps clear of the notch — with **no change to desktop rendering**.
- **Free-month trial + one-website pricing (Stripe-ready)** — every teacher gets **one website free for the first month**; after that, keeping it online (or adding more) is **₪199/month per website**. A single account-state helper (`services/billing/accountState.ts`) gates website creation (a 2nd site returns `402`), an hourly cron freezes a lapsed free site (`SUSPENDED` → a themed "paused" page) and emails the teacher in their own language, and paying reactivates everything automatically (already wired to the Stripe webhook — set `STRIPE_*` to switch payments on). The dashboard shows a trial banner and, once lapsed, a subscribe-to-reactivate lock screen.
- **Landing demo video (trilingual, language-aware)** — the homepage's **"Watch the demo"** opens a ~42s cinematic product film that follows the teacher's journey: pick a design → add your details → publish → share your enroll link → students book → the daily schedule email → the free-month offer. It **plays in the site's language** — English, Hebrew, or Arabic (RTL), each with localized captions *and* localized product screenshots (`public/media/marketing.{en,he,ar}.*`, selected by `i18n.language`). Built with a GSAP-driven frame-stepped renderer over the real UI. (Earlier cuts archived under `marketing/video-archive/`.)

---

## Architecture

```
Browser ──► React SPA (Vite, :5173)  ── /api ─►  Express API (:4000)
                                                   ├─► PostgreSQL (Prisma, ~16 models)
                                                   ├─► Redis (magic tokens, rate limits, site cache) — optional
                                                   ├─► Email (SMTP, console fallback)
                                                   └─► node-cron (reminders / daily emails)
Published teacher sites:  GET /p/{slug}   (React, applies the teacher's customization)
                          GET /site/{slug} (deterministic cached HTML — still generated on publish, not user-facing)
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
| Frontend | React 18, Vite 5, TanStack Query, React Router, Tailwind CSS, Framer Motion, lucide-react |
| i18n | i18next + react-i18next (HE/AR/EN, RTL) |
| Deploy | Railway (API + Postgres + Redis, Docker); optional Vercel for the SPA |

---

## Quick start (local)

**Prerequisites:** Node ≥ 20, PostgreSQL ≥ 14 (running on :5432), Redis (optional).

```bash
npm install
# Postgres must be running. Default local URL: postgresql://otto:otto@localhost:5432/otto_driving
# (role/db are still named `otto`/`otto_driving` from the old codename — internal only.)
npm run db:migrate              # apply migrations
npm run db:seed                 # demo teacher, site, students, codes, sample bookings
npm run dev                     # API :4000 + web :5173
```

Open **http://localhost:5173**.

- **Build a site:** http://localhost:5173/builder
- **Browse templates:** http://localhost:5173/templates
- **Teacher dashboard:** `teacher@mumotor.local` / `password123` · **Admin:** `admin@mumotor.local`
- **Published demo site (React):** http://localhost:5173/p/davids-driving
- **Enroll (code `DRIVE2026`):** http://localhost:5173/p/davids-driving/enroll

> Re-run `npm run db:seed` any time to refresh demo data (the seed creates sample bookings for *tomorrow*, which the integration tests rely on).

---

## The core flow

1. **`/builder`** — the teacher fills the wizard and picks a template + logo; the preview renders the selected template **live with their real data**.
2. **Customize** *(optional)* — `/customize/:id` opens the inline editor over the live site to tweak text, icons, colours, images, and lists.
3. **Publish** — creates/updates a `Website`, syncs booking settings, snapshots a version, regenerates the cached HTML, and flips status to `PUBLISHED`.
4. **Serve** — `GET /p/:slug` renders the chosen template (applying the saved customization). The path form works out of the box; per-teacher subdomains (`{slug}.mumotor.com`) are optional via wildcard DNS.
5. **Operate** — students enroll + book on the live site; the teacher manages everything from `/dashboard`.

---

## Templates & the Customize editor

**Templates** live in `packages/frontend/src/templates/<slug>/` (`index.tsx` + `<slug>.css`, every selector namespaced under `.tmpl-<slug>`, own palette/fonts). All 18 render from one `TemplateData` shape via `TemplateRender.tsx`; `fromWizard.ts` maps the teacher's wizard answers and the public settings onto that shape. Every template card (gallery + builder) shows a bespoke **animated concept preview** (`templates/TemplateConcept.tsx`) of its real look — not a stock photo. The builder flow is **Business → Setup → Templates (browse gallery) → Design**: clicking a card jumps to a live Design step where the chosen template renders instantly and a selector lets you switch between all 18 on the fly.

**Customize mode** (`components/customize/CustomizeMode.tsx`, opened from the builder preview or the dashboard route `/customize/:id`) is a full-screen live editor with **no side panel**. It writes a small, serializable overrides layer and persists **only on Save**:

```ts
Customization {
  fields?:  Record<path, value>                 // text / image url / list arrays / icon names
  theme?:   Record<cssVar, value>               // template colour slots (background, accent, …)
  styles?:  Record<path, {color?, background?}> // per-element text colour + button fill
  copy?:    Record<key, string>                 // overrides for otherwise-hardcoded headings/subtitles
  icons?:   Record<key, lucideName>             // swapped icons
}
```

What you can edit by clicking the live site (every editable element carries `data-edit` + `data-edit-type`):

- **Text** — element becomes `contentEditable`; a popover offers **Text** and **Fill** colour. *Every* heading/subtitle is editable (hardcoded strings are wired through `data.copy`).
- **Icons** — a searchable, categorized **full lucide icon library** picker (`templates/DynamicIcon.tsx`); the chosen icon name is stored in `data.icons`.
- **Images** — upload or find a photo on Unsplash (backend proxy), or paste a URL.
- **Background & colours** — a **"Colours"** toolbar panel maps to each template's CSS colour slots (so it's discoverable without hunting for the exact pixel); you can also click any empty background area.
- **Lists** — packages / FAQs / areas / stats show inline **add (+) / remove (🗑)** controls on hover; list text edits write the whole-array override.
- **Buttons never navigate in edit mode** — any link/button click is intercepted so you edit its text + colour instead of triggering it.

Undo / Redo / Reset are in the toolbar; hovering shows a dashed outline on every editable region. On **Save** the customization is written to the wizard config (pre-publish) or `website.configuration.customization` (post-publish), and the public `/p/:slug` site reflects it.

---

## Multi-tenant data isolation

Each site is an isolated tenant and its data grows independently:

- `Website` belongs to a `User` (`onDelete: Cascade`). **Every** domain table — `SiteSettings, Page, Service, ClientEnrollment, DailyCode, BulkEmail, Booking, Review, Media, Domain, WebsiteVersion` — carries a `websiteId` FK with `onDelete: Cascade` + `@@index([websiteId])`. One site's students/bookings/reviews never bleed into another.
- Teacher routes are **ownership-gated** (`website.userId !== req.user.id` ⇒ 403; even enrollment lookups are scoped by `websiteId`).
- **Delete a website**: `DELETE /api/websites/:id` requires body `{ "confirm": "DELETE" }` (else `400 CONFIRM_REQUIRED`); it cascades away **all** of that site's rows and clears the `site:<slug>` cache. The dashboard exposes this as a danger-zone that makes you type `DELETE`.

---

## Deployment (Railway)

> Real deploys require **your** accounts. Everything below is wired and ready; run from the monorepo root.

One Railway service runs **everything**: the API, the published sites, uploads (`/uploads`), **and the built React SPA** (the root `Dockerfile` builds the frontend and Express serves it). No Vercel required.

- Provision on Railway: this service (Docker) + **PostgreSQL** + **Redis** plugins (`railway.toml` included).
- Set service variables (point public-URL vars at the **same** Railway domain):
  ```bash
  APP_URL=https://<your-app>.up.railway.app
  FRONTEND_URL=https://<your-app>.up.railway.app    # same origin
  DATABASE_URL / REDIS_URL   → from the Railway Postgres/Redis plugins
  JWT_SECRET=<long random string>
  ```
- Deploy + migrate:
  ```bash
  railway up --detach
  railway run npm run db:deploy --workspace @mumotor/backend    # prisma migrate deploy
  ```
- Going live is **just** pointing `DATABASE_URL` at Railway Postgres — the Prisma datasource is `url = env("DATABASE_URL")`, no code change.

*Optional split:* host the SPA on Vercel (`packages/frontend`, `vercel.json` SPA rewrite, `VITE_API_URL` / `VITE_SITE_BASE` pointing at the Railway backend). The backend serves the SPA too, so this is purely for CDN/edge.

---

## Environment variables

See `.env.example` (root). Required: `DATABASE_URL`, `JWT_SECRET`. Optional (the app runs without them): `REDIS_URL`, `SMTP_*`, `STRIPE_*`, AI keys, `S3_*`, `UNSPLASH_ACCESS_KEY` (powers the in-editor "find photo"). Locale: `BUSINESS_TIMEZONE` (default `Asia/Jerusalem`), `DEFAULT_LOCALE` (`he`).

---

## Scripts

- **Root:** `npm run dev` · `npm run build` · `npm run db:migrate` · `npm run db:seed` · `docker compose up -d`
- **Backend:** `npm test` (integration suite, needs a running API) · `npm run db:reset` · `npm run db:deploy` (migrate deploy) · `npm run test:cron`
- **Frontend:** `npm run dev` · `npm run build` · `npm run typecheck` · `npm test` (vitest unit) · `node e2e/features.e2e.mjs` (full E2E)

---

## API surface

`/api` prefix. Highlights:

- **Auth** — `POST /auth/register|login`, `GET/PATCH /auth/me`, `POST /auth/change-password`
- **Generation** — `GET /ai/v2/quick-templates`, `POST /ai/v2/generate-website`
- **Websites** — CRUD `/websites`, `POST /websites/:id/publish|unpublish`, **`DELETE /websites/:id`** (typed-`DELETE` confirm, cascades)
- **Driving school** — teacher: settings, students (list/search/toggle/finish/delete), daily-report, daily-code, bulk-email; public: enroll, check-enrollment, public-availability, book-lesson, daily-code/validate, validate-magic-link, self-deactivate, public-settings (returns the template, locale, bio, logo, contact, socials)
- **Reviews / Subscriptions** — `/reviews`, `/subscriptions` (real Stripe Checkout + webhook when keys set; demo otherwise)
- **Media / Photos** — `POST /websites/:id/media` (upload → `/uploads`, S3-ready), `GET /photos/search` (Unsplash proxy for the editor)
- **Notifications / Admin** — `/notifications`, `/admin/*` (role-gated)
- **Site serving** — React `GET /p/:slug` (frontend) · deterministic `GET /site/:slug` (backend, cached)

---

## Internationalization

i18next with HE / AR / EN and full RTL (`dir` toggled per language). A language switcher appears in the marketing site, dashboard, and student pages. **Generated sites are fully translated** and render RTL for Hebrew/Arabic. Fallback chain: requested → English.

---

## Testing

All green: **unit 26/26 · integration 74/74 · E2E 90/90 (0 console errors)**, both packages typecheck-clean, production build OK. Verified responsive at 360/375/390/768/1024/1280 in EN + HE (no horizontal overflow anywhere; desktop unchanged).

```bash
# Frontend unit (vitest)
npm test --workspace @mumotor/frontend

# Backend integration (needs a running API on :4000)
cd packages/backend && NODE_ENV=test ENABLE_CRON=false npx tsx watch src/index.ts   # terminal 1
npm test --workspace @mumotor/backend                                                # terminal 2

# Frontend E2E (Playwright/chromium are vendored in node_modules — run from repo root)
WEB=http://localhost:5173 node packages/frontend/e2e/features.e2e.mjs
```

The integration suite covers auth, ownership, settings, codes, enrollment, availability, booking (double-book / breaks / advance / cutoff / past), student management, daily report, bulk email, self-deactivate, magic links. The E2E covers the template gallery, builder wizard, live preview, the full inline Customize flow (text, **icon library swap**, **button fill**, **copy text**, background/**Colours** panel, list add/remove, Save → persistence), and the published site.

> **Gotchas:** the integration "tomorrow excludes booked 09:00/10:00" check needs a **fresh** `npm run db:seed` (the seed books *its* tomorrow, which drifts day-to-day). Don't run the integration suite twice within 60s — enroll/book are rate-limited (you'd see a transient `RATE_LIMITED` cascade, not a regression).

---

## Project structure

```
packages/
  backend/
    prisma/schema.prisma          # ~16 models; every domain table keyed by websiteId (cascade)
    prisma/migrations/            # SQL migrations (railway migrate deploy)
    src/
      routes/                     # auth, websites (incl. DELETE), drivingSchool, aiGeneration,
                                  #   reviews, subscriptions, media, photos (Unsplash), siteServing, admin
      services/  ai/ (presets, builder, strings HE/AR/EN, generator), auth, email, jobs, scheduling
      middleware, utils, lib, config
    test/                         # integration.mjs + feature.integration.mjs + cron checks
  frontend/
    src/
      pages/  builder/ customize/ dashboard/ public/ templates/ auth/ admin/ Landing
      templates/                  # 12 templates + webgl/ (ShaderBackground+GLSL), TemplateConcept,
                                  #   types, sampleData, registry, shared,
                                  #   TemplateRender, fromWizard, DynamicIcon, SocialIcon, BrandMark,
                                  #   customize/overrides.ts
      components/  Logo, Background, LanguageSwitcher, motion, ui, layout,
                   customize/ (CustomizeMode, useHistory, PhotoPicker)
      lib/  api, auth, i18n, wizard, types, utils
    e2e/                          # Playwright harness (features.e2e.mjs is the suite)
Dockerfile · railway.toml · packages/frontend/vercel.json · docker-compose.yml
```

---

## Notes & deviations

- **Express (not Fastify)** + React Query + node-cron — a battle-tested core for the same behavior without a rewrite.
- **Billing is demo-mode** (plans switch without payment) until `STRIPE_SECRET_KEY` is set. Plan limits are not yet enforced server-side.
- **Generation is deterministic** (presets + builder), not a freeform AI call — predictable, fast, on-brand. AI keys only power optional bio enhancement (not yet implemented).
- **Scheduling math is timezone-aware** (UTC internally; set `BUSINESS_TIMEZONE`).
- **The published user-facing site is the React `/p/:slug`** (applies customization); the older deterministic `GET /site/:slug` HTML still generates on publish but isn't the site teachers/students see.
- The folder/packages/branding/domain/GitHub repo are all **mumotor** (renamed from the old `otto-il` codename); the Postgres role/db stay `otto` / `otto_driving` internally.
- **Per-teacher subdomain routing is code-complete but dormant**: host-aware routing (`{slug}.mumotor.com` serves that teacher's site + student flows) is built and verified, but wildcard DNS/SSL isn't provisioned (the Railway Hobby plan caps custom domains). Published sites are served at `mumotor.com/p/{slug}` and the wizard shows that working URL.

---

## Improvement Roadmap

A full improvement plan is documented in [`IMPROVEMENT_PLAN.md`](./IMPROVEMENT_PLAN.md). It covers 30 prioritised issues across security, product, growth, infrastructure, and technical debt — with a 90-day execution roadmap and pitch-readiness scoring.

Most of that plan is now shipped (LIVE at mumotor.com): Tier-0 security (required `JWT_SECRET`, CORS allowlist, Stripe webhook enforcement, upload validation + rate limits), password reset, email verification, public review submission, analytics, **HE/AR template copy for all 12**, SEO, wizard drafts, lesson cancellation, the **student portal + account + chat**, themed booking, and **DB-level no-double-booking**.

Key **remaining** items:
- **Media persistence to a CDN** (`Media.cdnUrl` still null) and **billing/plan enforcement** (Stripe not wired; paid checkout 503 by design).
- **Per-teacher subdomains**: code done, needs wildcard DNS (Railway plan upgrade) to go live.
- **Email volume at scale**: the daily "booking open" blast + the all-enrollments cron need batching/pagination before ~hundreds of teachers.
- **Residual hardening**: CSP + moving session tokens off `localStorage` (the July-16 pass already pinned the JWT algorithm, added `tokenVersion` session revocation, removed cookie-token/CSRF trust, made rate limiting spoof-resistant, and bounded all request payloads).
- **Real AI generation** (bio/SEO copy via Claude) and Israeli payment methods (Bit/Cardcom).
```

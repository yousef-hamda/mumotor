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

## Multi-tenant data isolation (Railway-ready)
Each site is an isolated tenant. `Website` belongs to a `User` (`onDelete: Cascade`); **every** domain table
— `SiteSettings, Page, Service, ClientEnrollment, DailyCode, BulkEmail, Booking, Review, Media, Domain,
WebsiteVersion` — carries a `websiteId` FK with `onDelete: Cascade` + `@@index([websiteId])`. So a site's
students/bookings/reviews/etc. grow under its own `websiteId` and never bleed into another site. Teacher
routes are ownership-gated (`requireOwnedWebsite` → `website.userId !== req.user.id` ⇒ 403; even
`loadEnrollment(websiteId, …)` is site-scoped), and `DELETE /websites/:id` (typed `DELETE` confirm) cascades
away **all** of that site's rows. **Railway:** the Prisma datasource is `url = env("DATABASE_URL")` (validated
in `config/env.ts`), so going live = point `DATABASE_URL` at the Railway Postgres and run
`npm run db:deploy --workspace @mumotor/backend` (`prisma migrate deploy`) — no code change.

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

## Templates & Customize (the user-facing site)
- Published teacher sites are the **React** route `GET /p/:slug` (`pages/public/PublicSite.tsx`), rendering 1 of
  **12 self-contained templates** in `src/templates/<slug>/` from a shared `TemplateData` via `TemplateRender.tsx`.
  **`mumotor`** (first — the app's own Apple-minimal design: glass nav, soft `color-mix(--mm-accent)` aurora orbs,
  FadeUp/Stagger/ScrollTilt, ScrollTilt hero media with floating glass cards, ScrollTilt "Today's schedule" showcase,
  dark band, btn-glass) + six originals (grid-ink, open-road, night-shift, easy-lane, prestige, full-throttle) + five
  **glass-forward** (aurora=Apple, bento=Vercel/Notion, prism=Rivian/Polestar automotive, obsidian=smoked dark,
  frosted=photo-led). All driven off the `TEMPLATES` registry — adding one auto-wires gallery/builder/preview/public/customize.
  **mumotor accent picker**: its card shows bottom-right colour dots (`MumotorAccentDots` in `TemplateConcept.tsx`) that
  set `customization.theme['--mm-accent']` — recolouring only the one restrained accent (CTA/links/active/popular/orbs).
  Builder `BrowseCard` persists it to config (flows to live preview + publish via `wizardToTemplateData`→`applyOverrides`);
  gallery card links `/templates/mumotor?accent=<hex>` (TemplatePreview applies it). The mumotor card is a `div[role=button]`
  (not `<button>`) so the dot `<button>`s nest validly.
  The deterministic backend HTML at `GET /site/:slug` still generates on publish but isn't the user-facing site.
- **WebGL backgrounds**: `templates/webgl/ShaderBackground.tsx` is a tiny zero-dep raw-WebGL fullscreen-quad renderer
  (GLSL in `webgl/shaders.ts`: aurora / mesh-gradient / iridescent). Palette uniforms seed from the template's CSS vars
  (so Customize "Colours" tints the shader). DPR-capped, paused offscreen/hidden, reduced-motion → static. On no-WebGL
  (headless test browsers, GPU-less devices) it **hides the canvas → each template's CSS-gradient fallback shows** — so
  the hero always looks designed. NOTE: headless Playwright has no working WebGL, so screenshots show the CSS fallback,
  not the live shader (verify shaders in a real browser).
- **Animated concept cards**: `templates/TemplateConcept.tsx` renders a bespoke CSS mini-preview of each template's real
  look (not a stock photo) — used on all gallery + builder cards.
- **Builder flow** (`pages/builder/BuilderWizard.tsx`): Business → Setup → **Templates** (browse gallery of all 12) →
  **Design** (clicking a card jumps here; the chosen template renders live instantly with a selector to switch on the fly)
  → Customize / Publish. No separate "Preview" click.
- **Customize mode** (`components/customize/CustomizeMode.tsx`, route `/customize/:id`, also from the builder
  preview): full-screen live site, **no side panel**, persists only on **Save**. Overrides =
  `Customization {fields, theme, styles, copy, icons}` applied by `applyOverrides` (in `templates/customize/overrides.ts`).
  Click any `[data-edit]` element: **text** → contentEditable + popover with **Text** and **Fill** colour
  (`styles[path].{color,background}`, injected as scoped CSS by `TemplateRender`); **background** → palette; **image**
  → upload/Find (Unsplash); **icon** → searchable **full lucide icon-library** picker (`templates/DynamicIcon.tsx`,
  `data.icons` overrides). ALL hardcoded headings/subtitles are editable via free-form `data.copy` (`{copy.key ?? 'literal'}`).
  Toolbar has a **"Colours"** button (theme panel for background/colours) so it's discoverable; hovering shows a dashed
  outline on every editable region. In Customize NOTHING navigates — any `<a>/<button>` click is intercepted to select-to-edit.
  Lists (packages/faqs/areas/stats) have `data-edit-item` + hover +/trash. Add new editable text/icons by tagging with
  `data-edit="copy.X"|"icons.X"` + the matching `data-edit-type`. New templates must add a `COLOR_SLOTS[<slug>]` entry in
  `overrides.ts` mapping their 5 CSS vars + a `TemplateConcept` case + (for shaders) a CSS-gradient fallback on the shader container.
- **Customize mode** (`components/customize/CustomizeMode.tsx`, route `/customize/:id`, also from the builder
  preview): full-screen live site, **no side panel**, persists only on **Save**. Overrides =
  `Customization {fields, theme, styles, copy, icons}` applied by `applyOverrides` (in `templates/customize/overrides.ts`).
  Click any `[data-edit]` element: **text** → contentEditable + popover with **Text** and **Fill** colour
  (`styles[path].{color,background}`, injected as scoped CSS by `TemplateRender`); **background** → palette; **image**
  → upload/Find (Unsplash); **icon** → searchable **full lucide icon-library** picker (`templates/DynamicIcon.tsx`,
  `data.icons` overrides). ALL hardcoded headings/subtitles are editable via free-form `data.copy` (`{copy.key ?? 'literal'}`).
  Toolbar has a **"Colours"** button (theme panel for background/colours) so it's discoverable; hovering shows a dashed
  outline on every editable region. In Customize NOTHING navigates — any `<a>/<button>` click is intercepted to select-to-edit.
  Lists (packages/faqs/areas/stats) have `data-edit-item` + hover +/trash. Add new editable text/icons by tagging with
  `data-edit="copy.X"|"icons.X"` + the matching `data-edit-type`.
- **Delete a website**: `DELETE /api/websites/:id` requires body `{confirm:"DELETE"}` (else 400 `CONFIRM_REQUIRED`);
  cascades all the site's rows + clears the `site:<slug>` cache. UI = danger-zone in `pages/dashboard/Settings.tsx`
  (type-DELETE modal). The mumotor logo links to `/` everywhere.

## Conventions
- Generation is **deterministic** (presets + builder in `backend/src/services/ai/`), not a freeform AI call.
- After editing `tailwind.config.js`, the Vite dev server can serve **stale CSS** — restart it (and clear
  `packages/frontend/node_modules/.vite`) to pick up token changes.
- Typecheck before shipping: `npm run typecheck --workspace @mumotor/frontend`.

## Known Gaps & Improvement Priorities (July 2026)
Full detail in `IMPROVEMENT_PLAN.md`. Key issues by tier:

### Tier 0 — Security (fix before any real user)
- `JWT_SECRET` has a hardcoded default string in `config/env.ts` — must be required with no fallback.
- CORS is `origin: '*'` in `app.ts` — must be locked to `FRONTEND_URL`.
- `STRIPE_WEBHOOK_SECRET` is optional — anyone can forge Stripe webhooks if not set.
- No rate limit on media uploads (`POST /websites/:id/media`).

### Tier 1 — Product blockers
- **No plan enforcement**: billing plans are display-only; FREE and STUDIO users have identical API access.
- **Media storage is ephemeral**: uploads go to local `/uploads/` — wiped on every Railway deploy. `Media.cdnUrl` always null. Fix: S3/R2 or Railway persistent volume.
- **No password reset**: `POST /auth/forgot-password` does not exist. Locked-out users cannot recover.
- **No email verification**: `User.emailVerified` field exists but is never set to `true`.
- **No public review submission**: no `POST /reviews` endpoint. Every published site has empty testimonials.
- **False subdomain URL**: wizard done screen shows `slug.mumotor.com` but no wildcard DNS exists. Real URL is `/p/:slug`.

### Tier 2 — High priority
- **Zero analytics**: no instrumentation anywhere. Cannot measure wizard completion, template choice, or growth.
- **Dual pipeline confusion**: `EditorPage` uses the old 9-preset HTML generator; Customize Mode uses the 12 React templates. They are completely separate and diverge on every save. Plan: deprecate Pipeline A, redirect dashboard "Edit" → `/customize/:id`.
- **Templates are English-only**: `data.locale` flows through `TemplateData` but all 12 templates have hardcoded English copy. HE/AR market promise is broken.
- **Wizard data loss**: only `localStorage` — no server-side draft. Closing mid-flow loses all progress.
- **Currency mismatch**: billing shows USD ($29/$79); UI shows NIS (₪). Target market is Israel.
- **No SEO**: `Website.seoSettings` field is never written or read. Published sites at `/p/:slug` have no `<title>`, no OG tags, no LocalBusiness JSON-LD.

### Tier 3+ — See IMPROVEMENT_PLAN.md
- No lesson cancellation, no student portal, no waiting list, no referral flow.
- AI branding is misleading — zero actual AI calls anywhere. Opportunity: add Claude Haiku for bio generation and SEO copy.
- PRO/STUDIO feature lists need to reflect enforced reality.
- Israeli payment methods (Bit/Cardcom) not covered by default Stripe.
- `Page` and `Section` Prisma models are dead code with no routes or frontend references.

## Testing (all green: unit 26/26 · integration 70/70 · E2E 84/84, 0 console errors)
- Frontend unit (vitest): `npm test --workspace @mumotor/frontend`.
- Backend integration: needs a running API on :4000 (`cd packages/backend && NODE_ENV=test ENABLE_CRON=false npx tsx watch src/index.ts`),
  then `npm test --workspace @mumotor/backend`. `NODE_ENV=test` bypasses the rate limiter.
- Frontend E2E: `WEB=http://localhost:<port> node packages/frontend/e2e/features.e2e.mjs`. Playwright/chromium live in
  `packages/frontend/node_modules` (not global) — run from the repo root so the local package resolves.
- GOTCHAS: the integration "tomorrow excludes booked 09:00/10:00" check needs a **fresh** `npm run db:seed` (the seed
  books *its* tomorrow, which drifts day-to-day). Don't run the integration suite twice within 60s — enroll/book
  **rate-limit** and you'll see a transient `RATE_LIMITED` → bad-UUID cascade (not a regression).

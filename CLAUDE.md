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
in `config/env.ts`). **Migrations now auto-apply on deploy** — the `railway.toml` startCommand runs
`prisma migrate deploy` (against `postgres.railway.internal`, in-container) BEFORE booting node, so every push
to main applies any pending migration itself (idempotent, forward-only, fail-closed → a bad migration fails the
healthcheck and Railway keeps the previous deploy up). No manual DB step, no proxy/ssh needed (Jul 21 2026, see
the `railway-self-migrating-deploy` memory).

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
  **18 self-contained templates** in `src/templates/<slug>/` from a shared `TemplateData` via `TemplateRender.tsx`.
  (Big overhaul Jul 17–18 2026 — see the `template-overhaul-2026-07` memory.) Registry order: `mumotor` (Apple-minimal,
  accent-picker) · **13 signature designs** — `meridian` (topo survey, self-drawing route line), `bezel` (machined
  instrument, needle-sweep dials), `solari` (split-flap departures), `cadence` (kinetic variable-font type), `circuit`
  (motorsport telemetry, car laps a circuit via CSS motion-path), `press` (letterpress deboss + wax seal), `reel` (35mm
  cinema, scroll-scrubbed filmstrip), `slate` (chalkboard, chalk diagrams draw themselves), `primary` (Bauhaus geometry),
  `gallery` (museum, spotlight-follow), `gilt` (foil-stamped luxury), `sumi` (sumi-e ink wash, brushed enso + hanko seal),
  `atelier` (bespoke tailor — ivory paper + thread-red, a measuring-tape rail + a seam that sews itself), `nocturne`
  (celestial navigation — midnight indigo + gold constellation "stars" that light and connect via a drawn course line +
  starfield), `deco` (1920s golden-age motoring — champagne ivory + emerald + gold Art-Deco, sunburst fans + a sticky
  elevator floor-dial that ticks by section) — plus the 2 kept originals `grid-ink` `open-road`. **Deleted:** aurora, prism,
  frosted, night-shift, full-throttle, prestige, bento, daylight, vantage, easy-lane, folio, obsidian, and (round 7)
  **console, transit, ledger** (→ replaced by atelier/nocturne/deco); `templates/webgl/` was removed (no template uses WebGL now). All templates are
  **full-width desktop** (1440 wrap + full-bleed nav/bands) and default to the owner's real driving-lesson + instructor
  photos (`/img/default-*.jpg` via `sampleData.IMG`). All driven off the `TEMPLATES` registry — but adding/removing one
  means touching ~10 slug-keyed maps in lockstep (registry, COLOR_SLOTS, templateTheme×5, backend TEMPLATE_THEME,
  i18n×3, TemplateConcept, overrides.test, e2e, prerender); several fall back SILENTLY so grep the slug to verify.
  (`templates/i18nDefaults.ts` auto-discovers templates via `import.meta.glob` — no per-template entry needed there.)
  **ANIMATION GOTCHAS (bit us repeatedly):** framer `whileInView` intermittently sticks hidden for above-fold elements
  → use the shared `Reveal`/ref-`useInView`; `EnterTilt` pre-settles for a top-of-page hero → wrap hero media in the
  shared **`EnterMount`** (`templates/shared.tsx`, framer mount `initial→animate`; do NOT try to fix EnterTilt globally —
  its scroll math treats a tall 2-col hero as below-fold and it stays hidden); headings must set an explicit
  `color: var(--xx-ink)` or a global `h1` rule wins (dark-on-dark). Every template's nav is a generous (~70px) full-bleed
  bar with a STRUCTURALLY distinct on-theme device (glass pill / legend ticks / milled indices / flip-tiles / kinetic
  ink-bar / pit-wall / letterpress masthead / filmstrip / chalk-ledge / Bauhaus glyphs / wall-labels / wax-seal /
  brush-stroke / running-index / enamel-badges / stitched-tape / star-chart / Deco-marquee) + a colour+shape active marker.
  **FRAME-ESCAPE (bit us):** a `position:fixed` signature element escapes the builder/Customize in-page `overflow-y-auto`
  preview and floats over the app UI. NEVER viewport-`fixed` a visible signature — use `position:sticky` or `position:absolute`
  inside the relative `.tmpl-*` root + a scroll-written CSS var (per `EnterTilt`'s nearest-scroller detection). Also: a root
  with `overflow-x:hidden` silently computes `overflow-y:auto` → a scroll container that hijacks `position:sticky` for ALL
  descendants (breaks sticky navs too) — use `overflow-x:clip` instead.
- **Template i18n — language must follow the SITE (root cause bug fixed July 18):** the "Arabic button on an English site"
  was a DATA ARTIFACT, not template code — `commitEditing` (`components/customize/CustomizeMode.tsx`) persisted a text
  field's current rendered value whenever it was merely FOCUSED, freezing a localized default (e.g. `احجز الآن`) into
  `customization.fields['labels.bookCta']`, which stuck after a language switch. Fixed: (1) skip no-op commits (compare to
  the field's original text captured on edit-start); (2) `templates/i18nDefaults.ts` `pruneForeignLocaleLabels(cz, locale)`
  (called in `fromWizard.buildTemplateData`) drops any `labels.*`/`copy.*` override that is a default in a DIFFERENT locale
  than the site (keeps genuine custom text + same-language defaults). Every template's visible string MUST be `s.key` /
  `data.copy?.key ?? s.key` / a `data.*` field (localized by `fromWizard`) — NO raw literals; each `strings.ts` spreads
  `...T.en`/`...T.he`/`...T.ar` per its own locale; nav/hero CTA = `data.labels?.bookCta ?? s.bookNow`.
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
- **Delete a website**: `DELETE /api/websites/:id` requires body `{confirm:"DELETE"}` (else 400 `CONFIRM_REQUIRED`);
  cascades all the site's rows + clears the `site:<slug>` cache. UI = danger-zone in `pages/dashboard/Settings.tsx`
  (type-DELETE modal). The mumotor logo links to `/` everywhere.
- **Templates fully honour locale + transmission + currency (July 5)**: `strings.ts` `dataDefaults(locale, transmission)`
  makes the About body + credential chip reflect the actual transmission (manual/automatic/both, localized); `fromWizard.ts`
  `plansToPackages` re-localizes any stored default transmission-feature line to the site locale + choice (custom text is
  left alone); `sampleWizardConfig(prev)` (in `lib/wizard.ts`) is per-locale so "Auto-fill sample" previews fully in-language;
  the English `sampleData` `areas`/`bio` fallbacks were localized. **Hours/footer weekday names are localized**
  (`weekdayName(locale,key)` in `strings.ts`, was always English "Monday…"); the English pre-filled **default tagline**
  ("Your road to confidence") and **default plan** text ("Single lesson"/"/ lesson"/"Door-to-door pickup"/"No commitment")
  re-localize to the site language (EN byte-identical; custom text untouched). **All prices are `₪` (shekel)** (was `£`).
  Teacher-typed free text (custom bio/tagline/name/city) still shows exactly as typed — no machine translation.
- **Builder Design step (July 5)**: the 12-card horizontal concept-selector strip was **removed**; `DesignPreviewStep`
  (`BuilderWizard.tsx`) now shows just the live preview + a **"Choose another template"** button (→ browse/Templates gallery).
  Switch designs from the gallery, not an inline strip.
- **Builder Design step is ONE screen (July 19)**: the whole app is viewport-locked on the design step (`isDesign` →
  shell `h-[100dvh] overflow-hidden`, preview box `flex-1 min-h-0` not a fixed `vh`) so the frame + the 3 action buttons
  are always visible without page scrolling — the TEMPLATE scrolls inside its frame, the page never does. Other steps keep
  `min-h-screen`. Details + the rest of the July-19 batch (wizard language reset, foreign-locale healing, scroll-lag, reel
  photos, `overflow-x:clip`) in the `builder-and-template-fixes-jul19` memory.
- **Site language ALWAYS follows the app language (July 19)**: the wizard `locale` mirrors `i18n.language` (the in-wizard
  site-language `<select>` calls `i18n.changeLanguage`; `localeTouched` is deprecated). "Auto-fill sample" sets a
  `sampleApplied` marker (cleared on any content edit); changing the language calls `clearSampleData` when sample data is
  showing — so a language switch wipes the stale sample and the teacher re-presses Auto-fill for the new language. Stale
  wrong-language OVERRIDES (Arabic stat labels on an English site, etc.) are healed by `pruneForeignLocaleLabels`, now
  broadened to drop foreign-locale ARRAY overrides (`stats`/`areas`/`faqs`/`packages`), and also run inside CustomizeMode.
- **Customize editor fixes (July 5)** (`components/customize/CustomizeMode.tsx`): (a) per-item hover controls (⠿/＋/🗑) now
  sit **above** the item (below only when near the top), so they never cover short pills/chips; (b) FAQ answers **force-open
  in editing mode** via a new `EditingProvider`/`useIsEditing` context (`templates/shared.tsx`) each template's FAQ reads —
  normal/preview mode keeps the accordion; a new FAQ inserts a **clean `{q:'',a:''}`** and empty editable text shows an
  "Add text…" placeholder (scoped `.cz-canvas` CSS); (c) **drag-reorder is reliable** — DnD is handled at the `window` level
  (always-mounted, guarded by `dragSrc`), resolving the target from `e.target.closest('[data-edit-item]')` (falls back to
  `elementFromPoint`), so drops land even outside the canvas; (d) the **Save toast is `bottom-center`** so it never covers
  the toolbar Save/Done. Instructor photo is **~1.5× bigger** in all 12 `<slug>.css`.

## Public student experience (July 2026 — themed, matches each template)
Full detail in the `student-portal-and-themed-booking` memory. The student-facing pages **adopt the teacher's chosen
template design** — they are NOT the old app "sand" look.
- **Themed shell**: `components/public/TemplatedShell.tsx` + `lib/templateTheme.ts` `resolveBookTheme(slug, theme)` map
  any template's palette (`COLOR_SLOTS` + `registry` fallbacks) into normalized `--book-*` tokens (bg/ink/accent/surface/
  line/muted/radius/font) + loads the template font + light/dark + RTL. Styles in `components/public/book-shell.css`
  (`.book-*`). Used by `Enroll.tsx`, `BookLesson.tsx`, `LeaveReview.tsx` **and the student LOGIN screen** (still needed —
  don't retire). The logged-in **account dashboard is now bespoke per template** (see next bullet).
- **BESPOKE per-template student dashboards (July 19)**: the logged-in student personal space (`/p/:slug/account`) is no
  longer the flattened `book-shell` — **each of the 18 templates has its own on-theme dashboard** (circuit telemetry cockpit,
  solari split-flap departures board, atelier tailor's measuring-tape, sumi enso ring, reel filmstrip, deco floor-dial, …).
  Architecture in `pages/public/account/`: shared template-agnostic `useStudentAccount` hook (same query keys + new history
  query → `AccountData`/`AccountActions`), `AccountFrame` (wraps in `.tmpl-<slug>` + `customization.theme` inline + fonts +
  PWA identity), headless `ChatThread`/`ProfileForm` primitives, `registry.ts` lazy `ACCOUNT_SKINS` (fallback `_default`).
  Each `skins/<slug>.tsx`+`.css` imports its template CSS, colours ONLY via `var(--<slug>…)`/`color-mix` (recolour-safe),
  reuses `.xx-btn/.xx-panel`. Features: next lesson + Book, **readiness (Jul 20: ONLY two honest stats — lessons completed +
  upcoming; the "hours driven" stat and the percentage/meter device were REMOVED per owner feedback — `AccountReadiness` no
  longer has `hoursDriven`/`pct`)**, history/timeline, chat + profile. Backend: additive `GET /student/history` (still returns
  `hoursDriven`, now unused, kept for the history timeline). Full detail in the `bespoke-student-dashboards` memory.
- **Booking is TOMORROW-ONLY** (`BookLesson.tsx`): no multi-day grid — books `upcomingDates(2)[1]`, gated by the teacher's
  daily booking window; "No classes tomorrow" when closed. Slots render **start–end** ("08:00 – 09:00", `slotRange()`) with
  a header "Each lesson is N min · arrive 5 minutes early". Done screen: Book-another + Back-to-home + My account. The
  **double-booking race is closed by a DB partial unique index** `Booking_slot_unique` on
  `(websiteId,bookingDate,bookingTime) WHERE status<>'CANCELLED'` (migration `20260704114405`); the book route's P2002 catch
  surfaces it as a friendly 409.
- **Student account** (`/p/:slug/account`, `StudentAccount.tsx`): a per-site login area. **Login = EMAIL ONLY** for a
  returning student (`POST /:websiteId/student/login {email}` → ACTIVE enrollment → `signStudentToken`, `middleware/auth.ts`
  `requireStudent`); the one-time enrollment code is only the gate for NEW students at `/enroll`. **Hardened July 11:** the
  student JWT is **7-day** (was 30d); `loadStudentEnrollment`/`proveStudentIdentity` re-check ACTIVE on every request (pause/
  complete instantly revokes the session); `check-enrollment` returns only `{enrolled,active}` (no name/status leak). Tabs:
  Lessons (next-lesson highlight, view/book — **students CANNOT cancel**: both cancel routes now hard-return 403; only the
  teacher cancels), real `stats` from `/student/me` = completed/upcoming/total — NOT the double-counting `classCount` (the
  teacher "Classes" column + daily report also now show a **derived non-cancelled count**, not the raw column), Chat
  (two-way, polling), Profile. A **"My account" button is in every template's nav** (desktop + mobile,
  `data.accountUrl`, per-template ghost class — contrast-checked light/dark; `navAccount` in `templates/strings.ts`).
  Separate `studentApi` axios instance so the teacher token never leaks.
- **Student pages are fully localized (July 5)** to the SITE's locale (not the browser). All copy in Enroll/BookLesson/
  StudentAccount/LeaveReview + `TemplatedShell` goes through `lib/bookingStrings.ts` (`bookLocale(settings.locale)` +
  `bookT(locale,key,vars)`, en/he/ar; EN byte-identical to before). Dates use `formatDateLongIn`/`formatWeekdayIn`
  (`lib/utils.ts`) — words localize, **digits stay Latin (0-9)** via `numberingSystem:'latn'`+`calendar:'gregory'`.
- **Logged-in students skip the email step (July 5)**: `BookLesson.tsx` on mount calls `studentTokenStore.activate(slug)`
  → `studentPortalApi.me(settings.id)` → sets email/name and jumps straight to the time step (mirrors the magic-link path).
- **No cancellation-window wording (July 5)**: removed every "Lessons can be cancelled up to 2 hours before…" / "~2 hours
  before" line (no time calculations are exposed to students).
- **Teacher chat inbox**: `pages/dashboard/Messages.tsx` (`/dashboard/messages`, nav entry). Prisma `Message` model
  (websiteId+enrollmentId cascade). Student→teacher messages create a `MESSAGE` notification.
- **Per-teacher subdomains** `{slug}.mumotor.com`: host-aware routing is CODE-COMPLETE and DORMANT (`lib/tenant.ts`
  `getTenantSlug`/`useTenantSlug`; `App.tsx` `TenantApp`). **Wildcard DNS is NOT live** (Railway Hobby plan caps custom
  domains). Sites are at `mumotor.com/p/:slug` today. The wizard done-screen shows the working `/p/:slug` URL.
- **Teacher dashboard**: overview has a **"Copy link"** button beside the site URL (`Dashboard.tsx` `SiteOverview`); the
  empty state (no website) is a CTA to `/builder`.
- **Schedule management (July 5)** (`pages/dashboard/DrivingSchool.tsx` `ScheduleTab`): a **Today / Tomorrow** toggle
  (`GET /:websiteId/daily-report?day=today|tomorrow`); free slots have **"Add student"** → picks an ACTIVE student and
  `POST /:websiteId/schedule/assign {enrollmentId,day,time}` books that slot exactly like a self-booking (CONFIRMED `Booking`
  + `classCount++` in a txn, honouring `Booking_slot_unique`; P2002→409). Booked slots keep **Cancel** (already emails the
  student + frees the slot; works for either day). Teacher edits do **not** auto-send a daily-schedule email — an **"Email me
  the schedule"** button (`POST /:websiteId/schedule/email-me {day}`) sends the current day's report to the teacher on demand
  (`sendEnhancedDailyReport` gained a `when:'today'|'tomorrow'`). `utils/time.ts` now exports `tomorrowUtcMidnight`.
- **Email your students (July 5)**: `EmailTab` has an **"A group" / "Specific students"** toggle; specific mode shows a
  checkbox list of ACTIVE students and sends `enrollmentIds` — the bulk-email route resolves recipients by
  `id:{in:enrollmentIds}` scoped to `websiteId` (IDOR-safe), storing `targetGroup:'selected'` (no migration).

## Conventions
- Generation is **deterministic** (presets + builder in `backend/src/services/ai/`), not a freeform AI call.
- After editing `tailwind.config.js`, the Vite dev server can serve **stale CSS** — restart it (and clear
  `packages/frontend/node_modules/.vite`) to pick up token changes.
- Typecheck before shipping: `npm run typecheck --workspace @mumotor/frontend`.
- **Dates = Israel wall-clock (July 11):** for any "today/tomorrow" use `appTodayUtcMidnight(env.APP_TIMEZONE)`
  / `appTomorrowUtcMidnight(tz)` in `utils/time.ts` (returns a UTC-midnight Date of the Asia/Jerusalem date) —
  the old `todayUtcMidnight`/`tomorrowUtcMidnight` were removed (they used server UTC and drifted a day each
  night). Lesson-time diffs use `minutesUntilLessonInZone` (wall-clock, DST-safe). Frontend `upcomingDates()`
  computes the Israel date the same way so it always agrees with the backend's booking-date validation.
- **Email transport (July 16):** `services/email/emailService.ts` picks a transport in priority order
  **Amazon SES → Resend → SMTP → console**. SES (`sendViaSES`, SDK `@aws-sdk/client-sesv2`, HTTPS) is active only
  when `SES_ENABLED=true` AND `SES_REGION`/`SES_ACCESS_KEY_ID`/`SES_SECRET_ACCESS_KEY` are set — creds are
  pre-loaded on Railway but `SES_ENABLED` is OFF (still Resend) until AWS grants SES production access; flip it
  with `railway variables --service mumotor --set SES_ENABLED=true`. SES is ~10× cheaper ($0.10/1k). Domain
  `mumotor.com` verified in eu-north-1 (DKIM + `mail.mumotor.com` MAIL FROM). Details in the `amazon-ses-email` memory.
- **Backend email i18n (July 11):** emails render in the SITE's language via `services/email/strings.ts`
  (`emailT(locale,key,vars)`, `he`/`ar` typed `typeof en` so missing keys fail the build). Locale threads
  through `siteBrand` — **if a Prisma `select` feeds `siteBrand`, include `locale: true`.** Account emails
  (reset/verify) stay English; EN output is byte-identical; dates keep Latin digits.
- **Slugs (July 11):** `utils/slug.ts` transliterates Hebrew/Arabic → Latin + reserved-word guard, so HE/AR
  business names get a real slug instead of collapsing to `driving-school`.

## Responsive / device-adaptive (July 8, 2026 — the whole app works on phone · tablet · desktop)
The ENTIRE product adapts to the device **automatically** — there is deliberately NO user "mobile/desktop"
toggle. CSS/Tailwind + per-template `@media` do the layout; a few JS branches use `matchMedia`. **Desktop
(laptop) rendering is intentionally left byte-identical to before this pass** — every phone/touch change is
scoped so it can't reach `pointer:fine`/`≥lg` viewports.
- **Breakpoint contract (app chrome):** phone `<640` · tablet `640–1023` · laptop/desktop `≥1024`
  (dashboard sidebar → drawer `<1024`). Templates keep their own systems (nav flips ~940) and grew a
  **phone breakpoint (≤480–520)** where one was missing.
- **`lib/useDevice.ts`** — SSR-safe `useMediaQuery` / `useBreakpoint` / `useIsPhone` / `useIsCompact` /
  `usePointerCoarse` / `useIsTouch`. Used where JS must branch (e.g. Customize tap-vs-hover).
- **Custom Tailwind variants** (`tailwind.config.js` plugin): `coarse:` = `@media(pointer:coarse)` (touch),
  `touch:` = `@media(hover:none)`, `fine:`/`mouse:` = mouse/trackpad. Standard: **`coarse:min-h-11 coarse:min-w-11`
  = 44px tap targets on TOUCH ONLY** (desktop density untouched). Global floors live under
  `@media (pointer:coarse)` in `index.css` (`.btn*`/`.input` → 44px + 16px) and in `book-shell.css`.
- **Rules enforced everywhere:** ≥44px interactive targets on touch · ≥16px input font-size on touch (kills
  iOS focus-zoom) · `100dvh`/`svh` not `100vh` · **no horizontal page scroll at any width** · logical props
  / mirrored glyphs for RTL (never hardcoded left/right) · content never touches screen edges.
- **Data tables → cards on phone:** `StudentsTab` (`DrivingSchool.tsx`) and `AdminDashboard`'s 3 tables render
  a `hidden md:block` table on `md+` and a `md:hidden` stacked-card list on phone. Landing has a hamburger
  menu; dashboard drawer has scroll-lock + Esc. **Customize is fully touch-usable** (tap reveals per-item
  controls; touch reorder via ▲/▼ buttons that are `touch:`-only so desktop keeps drag).
- **GOTCHA (fixed here, watch for it):** a `grid ... lg:grid-cols-2` with NO explicit base `grid-cols-1` makes
  the mobile track an `auto` track that **expands to a child's max-content** (e.g. a `truncate` `<code>` URL is
  `nowrap` → forces the whole column wide → page overflow). Always give such grids a base `grid-cols-1`
  (= `minmax(0,1fr)`) AND `min-w-0` on the truncating flex child. Also: never key a list by content
  (`key={area.name}`/`key={f}`) — Customize's clone-on-add makes duplicates → React dup-key warning; key by index.
- **Verify responsiveness** by driving the app at 360/375/390/768/1024/1280 (EN + HE) and asserting
  `document.documentElement.scrollWidth <= innerWidth`. Touch rules (`pointer:coarse`) need real mobile
  emulation, not just `browser_resize` — headless Chrome reports `pointer:fine`.

## Installable PWA (July 9, 2026 — the app AND every teacher site install as home-screen apps)
Both Mumotor and each published teacher site are installable Progressive Web Apps — added to the phone/iPad/
desktop home screen, launched full-screen (no browser chrome), with their own name/icon/colour. Free, standards-
based (manifest + service worker + iOS meta), no store/native build. **The whole product is ONE React SPA** whose
`index.html` is shared by the app AND every teacher site, so the app IDENTITY is swapped per route rather than
using one static manifest.
- **Per-teacher DYNAMIC manifest**: backend `GET /site/:slug/manifest.webmanifest` + `GET /site/:slug/icon.svg`
  (`routes/siteServing.ts`, registered **before** `/site/:slug`). Host-aware `start_url`/`scope` = `/p/:slug/` on
  apex, `/` on a subdomain. name/theme_color/bg derive from the site's template + `customization.theme` accent via
  a `TEMPLATE_THEME` map that **mirrors** the frontend `COLOR_SLOTS`/`lib/templateTheme` (keep them in sync when a
  template's CSS vars change). Icon = generated maskable SVG (site initial on the accent). Redis-cached; the
  `manifest:*`/`icon:*` keys are dropped alongside `site:${slug}` on publish/unpublish/delete (`websites.ts`).
- **Static Mumotor manifest** `public/manifest.webmanifest` + real PNG icons in `public/icons/` (rasterized from
  `icons/icon.svg` — a blue-gradient "M") linked in `index.html` (+ apple-mobile-web-app meta + `viewport-fit=cover`).
- **Client identity swap** `lib/pwa.ts`: `applyAppIdentity`/`resetToMumotorIdentity`/`siteAppIdentity`/`usePwaInstall`/
  `registerServiceWorker`. `PublicSite.tsx` and `TemplatedShell.tsx` (enroll/book/account/review) call
  `applyAppIdentity(...)` from settings they already fetch; unmount restores Mumotor. Accent =
  `resolveBookTheme(...).vars['--book-accent']`.
- **Hand-rolled service worker** `public/sw.js` (registered only in PROD builds from `main.tsx`; bump `CACHE_VERSION`
  when it changes). CONTRACT — **`/api/*`, `/uploads/*`, `/site/*`, `*.webmanifest` are NEVER cached** (always-fresh
  booking data + dynamic manifest); navigations → network-first, offline → cached app shell; hashed assets →
  stale-while-revalidate; cross-origin → untouched. This is why a deploy is always picked up and student data is
  never stale.
- **Install affordance** `components/InstallAppButton.tsx`: `InstallAppButton` (dashboard header + landing nav, i18n
  `pwa.*`) and `SiteInstallPill` (floating themed pill on the public site, localized via `bookingStrings`
  `installApp`/`installHintIos`, safe-area-aware, dismissible per slug). Both hide when already installed
  (`display-mode: standalone`) or when neither a native `beforeinstallprompt` (Android/desktop) nor iOS applies; iOS
  shows a "Share → Add to Home Screen" hint.
- **Standalone/safe-area**: scoped `@media (display-mode: standalone)` rules in `index.css` + `book-shell.css` keep
  sticky headers clear of the notch. Insets are 0 on desktop → **the July-8 responsive/desktop layout is unchanged.**
- **Verify** by serving the real `dist` from the backend and driving with Playwright: at `/` assert the static
  Mumotor manifest + SW `active`; at `/p/:slug` assert the manifest `<link>` swapped to `/site/:slug/manifest.webmanifest`,
  `apple-mobile-web-app-title` = the teacher name, `start_url`/`scope` = `/p/:slug/`; assert the SW caches held only
  the shell + hashed assets (never `/api`, `/site`, `.webmanifest`). SW registers only from a **production build**
  (`import.meta.env.PROD`), so test via the built dist, not the Vite dev server.

## Sign in with Google (July 28, 2026 — LIVE)
"Continue with Google" for **teachers** (login + register) AND **students** (the portal login at
`/p/:slug/account`), built the "code-complete, dormant-until-keys" way (like Stripe/SES) and now
**enabled in prod**. It renders nothing / 503s until `GOOGLE_CLIENT_ID` + `VITE_GOOGLE_CLIENT_ID` are
set — the whole Google path tree-shakes out of the bundle when unset, so the app is byte-identical until
configured.
- **Verification** = `services/auth/googleAuth.ts` `verifyGoogleIdToken()` using **jose**
  (`createRemoteJWKSet` + `jwtVerify` → RS256 vs Google's JWKS + issuer + audience + expiry). Chosen over
  `google-auth-library` to keep prod `npm audit` clean (that SDK pulls a moderate transitive advisory).
- **Teacher**: `POST /auth/google` verifies the Google ID token, then `upsertGoogleUser()` (known
  `googleId` → that user; same email → link; new → password-less account + free-month trial; P2002-safe)
  and issues the normal teacher JWT. **Student**: `POST /:websiteId/student/google-login` verifies, then
  the shared `studentSessionByEmail()` matches an ACTIVE enrollment on that site + issues the student
  token — stronger than the email-only login (Google proves email ownership) but still needs an existing
  enrollment (no self-enroll). Both are rate-limited and 503 when Google is unconfigured.
- **Schema** (migration `20260728120630_add_google_auth`, applied on prod): `User.passwordHash` →
  **nullable** (password-less Google accounts; the login dummy-hash compare and change-password both guard
  the null), + `googleId` (`@unique`) + `avatarUrl`. The teacher's Google photo shows in the dashboard
  sidebar (initial fallback for password accounts).
- **Frontend**: `components/GoogleAuthButton.tsx` exports `GoogleIdButton` (loads Google Identity
  Services, renders the official button, localized he/ar/en) + `GoogleAuthButton` (teacher wrapper). The
  student login card uses `GoogleIdButton` + `studentPortalApi.googleLogin`. Divider strings:
  `i18n auth.orDivider` (app) / `bookingStrings orDivider` (student portal).
- **Config**: `GOOGLE_CLIENT_ID` is used by the backend verifier AND the frontend build (Dockerfile
  `ARG VITE_GOOGLE_CLIENT_ID` → Vite inlines it) — both set on Railway. The OAuth **Web** client's
  Authorized JS origins must include the serving origin; a **`www.*` → apex 301 redirect** in `app.ts`
  (GET/HEAD only, so a POST is never method-changed) guarantees visitors land on the registered apex,
  which permanently fixes Google's `origin_mismatch`. `GOOGLE_CLIENT_SECRET` is unused (ID-token flow).
  The OAuth creds live OUTSIDE the repo in `~/.google/mumotor-oauth.env`. Full detail in the
  `google-signin` memory.

## Status & remaining gaps (updated July 5, 2026)
Most of the original July-2026 audit (`IMPROVEMENT_PLAN.md`) is now DONE. LIVE at mumotor.com.

**Full-audit remediation (July 21 — commit `3dea4b0`, DEPLOYED):** two independent full audits + my own suites → 23 fixes, no schema/migration change. HIGH: (1) same-day booking cutoff now compares **Israel wall-clock minutes** not UTC hours (`drivingSchool.ts` book **and** `public-availability` — a 18:00 cutoff was closing at ~20:00–21:00 local); (2) **stored XSS closed** on the legacy `/site/:slug` generator — teacher `colors.primary/accent` + `locale` were interpolated raw into `<style>`/`<html lang>`; now strict-hex `safeColor()` + he/ar/en locale allowlist in `templateBuilder.ts`; (3) app-wide **`components/ErrorBoundary.tsx`** wraps App routes + the lazy student-dashboard Suspense (stale-chunk after deploy → one auto-reload, else recover card — no more blank SPA). MEDIUM: `buildDaySchedule` now keeps bookings that fall off a **regenerated** slot grid (append+sort, so the teacher still sees/cancels them); website-list query key unified to `['websites']` (Settings delete now refreshes the whole dashboard); **billing** hardened + tested — `restoreUserSites` is quota-capped (oldest-first, `getAccountState`), the Stripe webhook writes `websiteQuota` from the subscription quantity, **freezes on a non-active/non-grace `subscription.updated`**, and **returns 500 so Stripe retries** (was swallowing errors → 200); locked accounts can't PATCH websites; prod FREE-downgrade of a Stripe-managed sub is blocked; new `test/billing.check.ts` (15). Builder: Customize package edits survive a language switch (`onSave` clears `sampleApplied` when plans changed); restore-draft forces the site locale to the app language + auto-dismisses the banner so autosave resumes. `pruneForeignLocaleLabels` is now **per-item** (one coincidental foreign-default match no longer wipes a whole custom `stats`/`areas`/`faqs` array; `packages` stays all-or-nothing to keep the plans sync) + unit tests. **Frozen (SUSPENDED) sites now take their student portal down too** (login + every student route → 403 `SITE_PAUSED`). LOW/hygiene: reset-password runs the weak-password check (peek-then-getdel so a weak try doesn't burn the token); `events.ts` `jwt.verify` pinned HS256; `/api/photos/search` requires auth; public reviews require a PUBLISHED site; CORS wildcard `*.vercel.app`/`*.up.railway.app` dropped (exact `mumotor.com` + `RAILWAY_PUBLIC_DOMAIN`); in-memory-KV-in-prod warns; ProfileForm shows a phone error; solari account frame de-`fixed`→sticky; circuit RTL selector; **"12 templates" → 18** everywhere (i18n×3, seo/llms.txt, prerender, content guides×3, Landing); open-road `100dvh`; demo seed uses the real `open-road` slug (was legacy `clear-horizon` → silent mumotor fallback); dead-slug test fixtures fixed; **e2e now covers all 18** templates (was 16); `cron-check` exits; `.env.example` re-synced to `env.ts` (SES/Stripe/TRIAL_DAYS/APP_TIMEZONE); removed unused `meridian-hero.png`; `demo60` scratch scripts git-ignored; `npm audit` — body-parser + shell-quote fixed, only dev-server-only vite/esbuild remains (breaking Vite-8 fix deferred). Suites: fe-unit 33 · integration 74 · security 26 · ratelimit 5 · billing 15 · e2e 138 · 27-page sweep clean.

**Closed since the audit:** Tier-0 security (JWT_SECRET required in prod, CORS allowlisted, Stripe webhook enforced when
keys set, media upload rate-limited + magic-byte validated) · password reset + email verification · public review
submission + live testimonials · analytics (`AnalyticsEvent` + admin Events) · **all 12 templates trilingual HE/AR/EN + RTL**
· server-side wizard drafts (`WizardDraft`) · SEO (title/OG/JSON-LD, robots, sitemap) · legacy 9-preset `EditorPage` retired
(→ `/customize`) · **lesson cancellation** (teacher-only; students are told to contact the instructor) · **student portal +
account + chat** (see the student-experience section above) · **double-booking closed at the DB level** · themed
booking/enroll/account.

**July 5 (data fidelity — site shows only what the teacher entered):** A published site could show **3 identical
package cards while the wizard had 1 plan**. Root cause: Customize "add" clones a package card and stores a full-array
`customization.fields.packages` snapshot; editing plans in the wizard afterwards left that snapshot stale, and
`applyOverrides` (`fromWizard.ts`) let it REPLACE the plans-derived packages on the published site. Fixes: (a) at render,
on **save**, `syncPackageOverrideToPlans` (`fromWizard.ts`) folds any Customize `packages` edit (add/delete/rename/reorder)
back INTO `plans` and clears the override — so `plans` (the wizard **PlansEditor**) is the SINGLE source of truth and the
two can never diverge. Wired into BOTH save paths: the builder (`BuilderWizard.tsx onSave` → `setConfig`) and the dashboard
editor (`CustomizePage.tsx save` → sends `configuration.{customization,plans}`; also FIXED to load the real `plans`/`transmission`
into its base, which it previously ignored). `reconcilePackageOverride` stays as a SAFETY NET: at render it drops a
`fields.packages` override that STRUCTURALLY desyncs from the plans (count/out-of-range) — this **auto-fixes already-broken
live sites** on next load, no republish. So Customize keeps add/delete on package cards, but they sync to plans. Also made the English default instructor
**credentials honest** ("Certified driving instructor / Patient & professional" — were false UK certs "DVSA Approved (ADI)"
/ "Pass Plus registered") and dropped the invented "helped over 1,200 people" claim from the about-body default (HE/AR were
already generic). NOTE (design, not a bug): templates still fill genuinely-empty sections with tasteful starter content
(about body, FAQ from real price/transmission, generic coverage areas, a stock hero image) so a minimally-filled site looks
complete — this is editable, not a mismatch. Reviews never fabricate (only approved reviews render).

**July 5 (template scroll performance):** Published-site scroll jank ("laggy / must scroll twice") fixed on the
effect-heavy templates WITHOUT changing the visuals. Root causes + fixes (all effect-preserving): (a) **mumotor**
(`.mm-orb`, blur 72px) and **obsidian** (`.ob-orb`, blur 100px) animated `scale` in their drift keyframes — animating
`scale` on a `blur()` layer **re-rasterizes it every frame**; changed the keyframes to **translate-only** (the orbs still
drift + blur + recolor, just no imperceptible size-pulse). (b) **open-road** ("retro automotive") film-grain `::before`
was `position:absolute` over the **whole page height** (a huge composited layer); made it `position:fixed` (viewport-sized
— uniform noise looks identical). Verified with a real frame-time trace: all 12 templates now scroll at **~16.6ms/frame
(60fps), 0 janky frames** (measured open-road/mumotor/obsidian/aurora/night-shift/prism/full-throttle). REUSABLE RULE for
template backgrounds: never animate `scale`/`filter` on a large blurred layer (re-raster) and never put a full-page-tall
animated overlay — animate `transform: translate` only and keep big decorative layers `position:fixed` (viewport-sized).

**July 5 (whole-app i18n batch):** The ENTIRE Mumotor app now follows the language switcher (react-i18next,
`lib/i18n.ts`, localStorage `mumotor_lang`), not just the landing: `builder.*` (the wizard — all steps/fields),
`dashboard.*` (overview, DrivingSchool 5 tabs, Reviews/Publishing/Billing/Settings/Messages, DashboardLayout banner),
`auth.*` (login/register/forgot/reset/verify + AuthShell), `customize.*` (the Customize toolbar + popovers). EN values
byte-identical; "Mumotor" stays English. Fixes shipped with it: (a) the **builder "website language"** field now
**defaults to the app language** on a fresh wizard (changeable; the auto-fill sample follows it); (b) the Customize
**save toast is bottom-center** on BOTH entry points (dashboard + builder — the builder one was still top-right);
(c) landing **feature/FAQ cards keyed by index** (were keyed by translated text → vanished on language switch);
(d) **teacher instructor photo doubled again (2×)** in all 12 templates + open-road badge card widened;
(e) Customize **hover controls stay alive** while the cursor crosses the gap to them (a `hoverRef` corridor check in
`onCanvasMove` — they used to disappear). GOTCHA for future i18n: never use a **translated string as a React `key=`**
(remount → whileInView reveals stick at opacity:0); key by index/id.

**July 5 (marketing-site + reports batch):** The **Mumotor landing page** is now fully trilingual — every section
(nav links, hero accent, feature/step/checklist/FAQ arrays, dark section, footer) goes through i18n `t()` (keys in
`lib/i18n.ts`; the module-level data arrays were moved inside `Landing()` so they resolve `t()`, and still feed the
JSON-LD FAQ). Keep the brand word **"Mumotor" in English**. Landing **scroll lag fixed**: the aurora `Background`
no longer scroll-parallaxes (framer `useScroll` removed) and the orbs drift via a **translate-only** CSS animation
(`index.css` — no `scale`, so `blur()` layers aren't re-rasterized each frame) + reduced blur — this was the
"must-scroll-twice" jank. **Phone is now REQUIRED** at teacher signup + dashboard add-student + student profile
(same regex as public enroll, front + zod), so the daily report always has student numbers. The **teacher daily
schedule report email** was **redesigned** (Apple-minimal Mumotor look, Apple-blue accent, per-lesson rows with the
student name + a prominent tappable `tel:` phone). Removed the last "~2 hours before" wording from the booking email
+ the legacy generator. NOTE: the rest of the app chrome (builder wizard, dashboard, auth) i18n is the next pass.

**July 5 (later) batch — 16 fixes:** builder Design step (no concept strip → "Choose another template"); templates fully
honour locale + transmission + **₪** currency (auto-fill sample + About/credential/FAQ all localized); Customize (controls
above short items, FAQ open + clean new-answer in editing, reliable window-level drag-reorder, Save toast bottom-center,
bigger instructor photo); student pages fully localized (Latin digits) + logged-in students skip the email step + students
can no longer cancel + no "2-hour" wording; teacher **Today/Tomorrow schedule** with add-student-to-slot + cancel +
**"Email me the schedule"**; **email specific students**; open-road **footer scrollbar-flicker** fixed
(`overflow-x:hidden` + px grain keyframes).

**Free trial + per-website paywall (July 11 — Stripe-ready, Stripe DORMANT):** New teachers get **one website free for the first month** (30d from signup, `TRIAL_DAYS`). After that, unpaid → account **LOCKED** and the published site **FROZEN** (`WebsiteStatus.SUSPENDED` → goes dark + a themed "paused" page) + one localized "free month ended" email; extra websites / reactivation = **₪199/mo each**. Single source of truth is `services/billing/accountState.ts` `getAccountState()` (reused by the `POST /websites` 402 guard, `requireActiveAccount` on teacher writes, `/auth/me`, `/subscriptions`, and the hourly `processExpiredTrials` cron). Freeze/restore = `services/billing/siteFreeze.ts`, wired into the demo-checkout path AND the Stripe webhook. Frontend: `lib/useAccount.ts` → `DashboardLayout` trial-banner + full lock screen (only Billing reachable); `PublicSite` themed paused screen. Migration `20260711123432_trial_and_website_quota` backfills existing users to `now+30d` so nothing freezes on deploy. Details in the `free-trial-and-marketing-video` memory.

**Brand logo (July 15):** the new brand is a road-themed **"M"** (lane-marking dots + speed lines) + the **"Mumotor" wordmark** on a dotted-road underline — served as transparent PNGs `public/img/logo-{m,m-white,wordmark,wordmark-white}.png` (white variants for dark surfaces). `components/Logo.tsx` (`LogoMark` = M in a white squircle; `Logo` = the wordmark), `favicon.svg` + `icons/icon.svg` (embed the mark), the PNG app icons, the email header, and the JSON-LD `Organization.logo` (via favicon.svg → Google) all use it. Regenerate from source art with scratchpad `logo/process.py` (PIL flood-fill bg removal). The per-teacher default site logo (`templates/BrandMark.tsx`, instructor initial) is separate — not the Mumotor brand.

**Landing demo video (July 18–19 — ~68.5s product WALKTHROUGH, real UI, trilingual, calm music):** `public/media/marketing.{en,he,ar}.{mp4,webm}` + posters — a device-framed walkthrough (laptop + phone) with a **guiding cursor**, **casual (unformal) animated subtitles**, gentle zooms, and **calm background music** (no voiceover). Shows the full flow on the REAL app: manual-booking pain → Meet Mumotor → fill the wizard field-by-field → flip 7 designs → choose Gallery → Customize (edit headline + swap photo) + Save → Publish → scroll the live site → copy a one-time enroll code → student books on phone → teacher pinged + confirmation + 2h reminder → nightly schedule email → logo + "First month free, then ₪199/mo." **Follows the site language** (`hero/CinematicHero.tsx` picks `marketing.${i18n.language}.*`, cache-bust **`?v=6`**). Each language is FULLY localized — real localized screenshots (the demo site + app set to HE/AR: Arabic "مدرسة الطريق للقيادة", Hebrew "בית הספר לנהיגה של אלי") AND RTL casual subtitles. Also shipped: `pages/templates/TemplatePreview.tsx` now renders the gallery preview in the **app language** (not always English) so the template-flip scene localizes. Built in-repo `marketing/demo60/` with the GSAP frame-stepper: `film_lang.html?lang=` + `capture_lang.mjs <lang>` (re-captures ~33 screens + RTL-correct cursor coords) + `daily_report_lang.html` + `calm_music.py` → `render_lang.mjs`+`build_arhe.sh`. GOTCHAS (all fixed, see `free-trial-and-marketing-video` memory): a null coord from a locale locator-miss throws mid-timeline-build and freezes the film on the last shot → fill missing coords with RTL-mirrored defaults; an un-primed GSAP timeline / hung image-preload leaves `attr:{src}` seeks unapplied → prime `tl.progress(1→0)` + bounded preload+decode of every shot; `fetch()` fails under `file://` headless → inject coords via `addInitScript`. Older cuts archived in `marketing/video-archive/`.

**Earlier landing demo video (July 12, v3 — superseded by the trilingual rebuild above):** `public/media/marketing.{mp4,webm}` + poster — a ~34s **cinematic "chaos → calm" film** with only ~5 words, built with a **GSAP-driven frame-stepped renderer** (a mini-Remotion, all free/permissive): a `gsap.timeline({paused:true})` in `film-v3.html` choreographs real product screenshots + CSS/SVG motion; Playwright seeks it frame-by-frame (`render-v3.mjs`) → PNG sequence → ffmpeg + numpy music (`music-v3.py`, `build-v3.py`) — all in the session scratchpad. Beats: notification **chaos** on a phone → **implodes into the Mumotor M** → **Eli's open-road site builds itself** (the teacher's site, not the mumotor look) → **a booking taps + checkmark ("Booked.")** → schedule → **the daily-report email slides in** → **"You asked. We listened."** → offer chip. (Tooling research: GSAP is 100% free since Apr 2025; Remotion is source-available (≤3-person free) so avoided; Motion Canvas lacks solid headless render.) The 59s v1 and 40s v2 cuts are archived at `marketing/video-archive/marketing-v{1,2}.*` (git-tracked, NOT served) — revert by copying one back over `public/media/marketing.*`. `hero/CinematicHero.tsx` cache-busts the sources with `?v=3`; the demo opens **only** via the **"Watch the demo"** button — the old play-overlay on the decorative hero video was removed.

**Security hardening — 4 pillars (July 16):** full audit + hardening of **Authentication, Rate Limiting, Row-Level Security,
Server-Side Validation** (details in the `security-hardening-four-pillars` memory). Auth: JWT **pinned to HS256**, teacher tokens
carry `kind:'teacher'`, **`User.tokenVersion` revocation** (`verifyToken` is now ASYNC + does a `tokenVersion` lookup; bumped +
token reissued on `change-password`, bumped on `reset-password`; migration `20260716124401_add_user_token_version`), **cookie-token
trust removed** (Bearer-only → no CSRF), login dummy-bcrypt (anti-timing), weak-password denylist. Rate: **`clientIp`→`req.ip`**
(unspoofable; `middleware/rateLimit.ts`, needs `trust proxy`=real hop count, =1 for Railway), new limits on add-student/schedule-email/
teacher-messages/checkout/publish/website-create/wizard-draft, per-email login counter, **global `/api` 1000/min/IP backstop** (`app.ts`).
RLS: audit found no IDOR (all queries `websiteId`-scoped, cascade complete), `requireStudent` fail-closed. Validation: shared
`utils/validation.ts` (`phoneSchema`, `hhmm`, `weekdayHoursSchema`, `boundedRecord()`, `weakPasswordReason`) — `configuration`/
`businessConfig` capped ~2 MB, settings HH:MM + weekday allowlist, misc string/uuid bounds. New suites: `test/security.integration.mjs`
(26) + `test/ratelimit.unit.mjs` (5). (The tokenVersion migration is applied on prod — confirmed clean by the Jul 21
self-migrating deploy, which reported all 9 migrations present, no drift. New migrations now apply automatically on the
next push; no manual `DATABASE_URL=... prisma migrate deploy` step.)

**Still open (real):**
- **Media storage ephemeral**: uploads to local `/uploads` are on a Railway volume now, but `Media.cdnUrl` is still null (no S3/R2/CDN).
- **Stripe not wired**: keys/price ids unset, so paid checkout still 503s in prod (demo-switch in dev). The trial/quota/freeze system above is fully in place and reactivates automatically once Stripe keys + `STRIPE_PRICE_*` are configured (webhook already restores frozen sites).
- **Per-teacher subdomains dormant**: code done, wildcard DNS not live (Railway Hobby plan caps custom domains) — sites are at `/p/:slug`.
- **Daily email volume at scale**: the every-5-min cron loads all active enrollments into memory and emails every student daily → the first scaling cost (batch/queue + paginate the cron before ~hundreds of teachers). See the capacity report in the advertising-report memory.
- **Session tokens in localStorage + no CSP** (student + teacher) — residual XSS surface (CSRF surface itself is now closed:
  auth is Bearer-only, the `token` cookie is no longer trusted). A stolen teacher token can now be revoked by changing the password.
- **Dead models**: `Page`/`Section` (and `Domain`, until subdomains ship) are unused.
- **AI branding**: still zero real AI calls — opportunity for Claude bio/SEO copy.

## Testing (all green: fe-unit 33/33 · integration 74/74 · security 26/26 · ratelimit 5/5 · billing 15/15 · google 13/13 · E2E 138/138, 0 console errors)
- Frontend unit (vitest): `npm test --workspace @mumotor/frontend`.
- Backend integration: needs a running API on :4000 (`cd packages/backend && NODE_ENV=test ENABLE_CRON=false npx tsx watch src/index.ts`),
  then `npm test --workspace @mumotor/backend`. `NODE_ENV=test` bypasses the rate limiter.
- Backend **security** suite (same running API): `npm run test:security --workspace @mumotor/backend` (`test/security.integration.mjs` —
  auth forgery/revocation, cross-tenant isolation, validation bounds). Plus `npm run test:ratelimit` (`test/ratelimit.unit.mjs`, imports
  `dist/` so build first). Rate-limit **429s** only fire outside `NODE_ENV=test` — verify live with a dev-mode server.
- Backend **billing** money-path (direct DB, no running API needed): `npm run test:billing` (`test/billing.check.ts` — getAccountState
  trial/expired/paid, freezeUserSites, quota-capped restoreUserSites). `npm run test:cron` runs the 3 cron jobs once (console email).
- Backend **Google sign-in** logic (direct DB, no running API): `npm run test:google` (`test/google-auth.check.ts` — `upsertGoogleUser`
  create / idempotent / link-by-email / case-insensitive). The token-verify + endpoint paths need `GOOGLE_CLIENT_ID` set (a bad token → 401,
  unset → 503); a REAL end-to-end login needs a human click (Google blocks automated sign-in).
- Frontend E2E: `WEB=http://localhost:<port> node packages/frontend/e2e/features.e2e.mjs`. Playwright/chromium live in
  `packages/frontend/node_modules` (not global) — run from the repo root so the local package resolves.
- GOTCHAS: the integration "tomorrow excludes booked 09:00/10:00" check needs a **fresh** `npm run db:seed` (the seed
  books *its* tomorrow, which drifts day-to-day). The suite **books slots that persist**, so re-running against a dirty DB
  can fail the date-drift assertions (e.g. "availability has morning slots" on a Friday) — do a clean
  `npx prisma migrate reset --force` (reseeds) before a fresh run. Don't run the integration suite twice within 60s —
  enroll/book **rate-limit** and you'll see a transient `RATE_LIMITED` → bad-UUID cascade (not a regression).

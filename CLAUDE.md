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
  (`.book-*`). Used by `Enroll.tsx`, `BookLesson.tsx`, `StudentAccount.tsx`, `LeaveReview.tsx`.
- **Booking is TOMORROW-ONLY** (`BookLesson.tsx`): no multi-day grid — books `upcomingDates(2)[1]`, gated by the teacher's
  daily booking window; "No classes tomorrow" when closed. Slots render **start–end** ("08:00 – 09:00", `slotRange()`) with
  a header "Each lesson is N min · arrive 5 minutes early". Done screen: Book-another + Back-to-home + My account. The
  **double-booking race is closed by a DB partial unique index** `Booking_slot_unique` on
  `(websiteId,bookingDate,bookingTime) WHERE status<>'CANCELLED'` (migration `20260704114405`); the book route's P2002 catch
  surfaces it as a friendly 409.
- **Student account** (`/p/:slug/account`, `StudentAccount.tsx`): a per-site login area. **Login = EMAIL ONLY** for a
  returning student (`POST /:websiteId/student/login {email}` → ACTIVE enrollment → `signStudentToken`, `middleware/auth.ts`
  `requireStudent`); the one-time enrollment code is only the gate for NEW students at `/enroll`. Tabs: Lessons (next-lesson
  highlight, view/book — **students CANNOT cancel** (July 5): they see "contact your instructor to change/cancel"; only the
  teacher cancels), real `stats` from `/student/me` = completed/upcoming/total — NOT the double-counting
  `classCount`, Chat (two-way, polling), Profile. A **"My account" button is in every template's nav** (desktop + mobile,
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

## Status & remaining gaps (updated July 5, 2026)
Most of the original July-2026 audit (`IMPROVEMENT_PLAN.md`) is now DONE. LIVE at mumotor.com.

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
`reconcilePackageOverride` (`fromWizard.ts`) drops a `fields.packages` override that STRUCTURALLY desyncs from the plans
(different card count / out-of-range index) — so packages always come from the **wizard PlansEditor (single source of
truth)**; same-length inline text tweaks are kept; this **auto-fixes already-broken live sites** on next load, no republish.
(b) Customize no longer offers add/remove/reorder on package cards (`CustomizeMode.tsx` guards `onCanvasMove` + `listOp`
for `packages`) so the desync can't recur — packages are edited only in the wizard. Also made the English default instructor
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

**Still open (real):**
- **Media storage ephemeral**: uploads to local `/uploads` are on a Railway volume now, but `Media.cdnUrl` is still null (no S3/R2/CDN).
- **No plan enforcement**: billing plans are display-only; FREE and STUDIO have identical API access. Stripe not wired (paid checkout 503 by design).
- **Per-teacher subdomains dormant**: code done, wildcard DNS not live (Railway Hobby plan caps custom domains) — sites are at `/p/:slug`.
- **Daily email volume at scale**: the every-5-min cron loads all active enrollments into memory and emails every student daily → the first scaling cost (batch/queue + paginate the cron before ~hundreds of teachers). See the capacity report in the advertising-report memory.
- **Session tokens in localStorage + no CSP** (student + teacher) — residual XSS surface.
- **Dead models**: `Page`/`Section` (and `Domain`, until subdomains ship) are unused.
- **AI branding**: still zero real AI calls — opportunity for Claude bio/SEO copy.

## Testing (all green: unit 26/26 · integration 74/74 · E2E 90/90, 0 console errors)
- Frontend unit (vitest): `npm test --workspace @mumotor/frontend`.
- Backend integration: needs a running API on :4000 (`cd packages/backend && NODE_ENV=test ENABLE_CRON=false npx tsx watch src/index.ts`),
  then `npm test --workspace @mumotor/backend`. `NODE_ENV=test` bypasses the rate limiter.
- Frontend E2E: `WEB=http://localhost:<port> node packages/frontend/e2e/features.e2e.mjs`. Playwright/chromium live in
  `packages/frontend/node_modules` (not global) — run from the repo root so the local package resolves.
- GOTCHAS: the integration "tomorrow excludes booked 09:00/10:00" check needs a **fresh** `npm run db:seed` (the seed
  books *its* tomorrow, which drifts day-to-day). The suite **books slots that persist**, so re-running against a dirty DB
  can fail the date-drift assertions (e.g. "availability has morning slots" on a Friday) — do a clean
  `npx prisma migrate reset --force` (reseeds) before a fresh run. Don't run the integration suite twice within 60s —
  enroll/book **rate-limit** and you'll see a transient `RATE_LIMITED` → bad-UUID cascade (not a regression).

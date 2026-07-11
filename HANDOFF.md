# Handoff — July 11, 2026 (Free-month trial + one-website paywall, and a landing demo video)

Shipped + **deployed to mumotor.com** (commit `d790416`; migration applied to the Railway prod DB; verified live — the demo video plays on the homepage). Two deliverables.

## Part A — Free trial + per-website paywall (Stripe-ready, Stripe DORMANT)
Business rule: **every new teacher gets one website free for the first month** (30 days from signup, `TRIAL_DAYS`, default 30). A **2nd website → `402 PAYMENT_REQUIRED`** (₪199/mo each). After the month, unpaid → account **LOCKED** and the published site **FROZEN** (`WebsiteStatus.SUSPENDED` → goes dark behind a themed "paused" page) + **one localized "free month ended" email** (teacher's language). **Paying reactivates everything automatically** (wired into both the demo-checkout path and the real Stripe webhook, so it "just works" once Stripe keys are set).
- **Schema/migration** `20260711123432_trial_and_website_quota`: `Subscription` gains `trialEndsAt`, `trialExpiredNotifiedAt`, `websiteQuota Int @default(1)`. The migration **backfills** existing FREE users to `now+30d` (+ creates a trial row for any user without one) so **nothing freezes on deploy**; paid PRO/STUDIO untouched. (Applied to prod: the 3 existing FREE users each got a fresh 30-day grace; the 1 PRO account untouched.)
- **Single source of truth**: `services/billing/accountState.ts` `getAccountState(userId)` → `{plan,onTrial,trialDaysLeft,paid,quota,websiteCount,canAddWebsite,locked,websitePrice}` — reused by the `POST /websites` guard, `requireActiveAccount` (blocks non-GET teacher writes when locked → `ACCOUNT_LOCKED`), `/auth/me`, `/subscriptions`, and the cron.
- **Freeze/restore**: `services/billing/siteFreeze.ts` `freezeUserSites`/`restoreUserSites` (flip status + clear `site:`/`manifest:`/`icon:` caches). Cron `processExpiredTrials()` (hourly `17 * * * *` in `jobService.ts`). Unfreeze in `subscriptions.ts` demo path + `stripeWebhook.ts` (restore on checkout.session.completed & subscription.updated=active; freeze on subscription.deleted).
- **Email**: `sendTrialExpired` (`emailService.ts`) localized via new `strings.ts` keys (`trialHeading/trialBody/trialSub/trialBtn/subjTrialExpired/titleTrialExpired`, en/he/ar).
- **Frontend**: `lib/useAccount.ts`; `DashboardLayout` trial banner (blue "Free month · N days left · Subscribe") + full **AccountLocked** screen (only Billing reachable); `Billing.tsx` trial/locked status + "first month free — then ₪199/mo"; `PublicSite.tsx` themed paused screen; i18n `dashboard.trial.*`. **Hardened**: `auth.tsx` login/register/logout `qc.clear()` so paywall state can't leak across accounts.

## Part B — Landing marketing demo video (replaced "View a live demo")
~59s 1080p Apple-keynote demo, **built from REAL product screenshots** (no fake mockups), custom music, no voice; ends on **"You asked. We listened."** + **"Your first month is on us — then just ₪199/month"** + a trilingual (עברית · العربية · English) beat. Assets: `public/media/marketing.{mp4,webm}` + `marketing-poster.jpg`.
- **How it was built** (all local, no paid AI — sources in the session scratchpad): Playwright captured real pages → Apple-minimal HTML scene slides embedding the shots in browser/phone frames → rendered to PNGs → **music synthesized with numpy** (pads/bass/plucked-arp/soft-drums/reverb + arrangement dynamics) → ffmpeg Ken-Burns + xfade + music. Regenerate: re-run `capture.mjs → render.mjs → music.py → build.py`.
- **Embed**: `components/VideoLightbox.tsx` (widescreen 16:9 portal, Esc/backdrop close, autoplay-with-sound via the click gesture, scroll-lock); `hero/CinematicHero.tsx` replaced the `viewDemo` link with a **"▶ Watch the demo"** button and added a play-overlay on the hero video. i18n `common.watchDemo`/`videoTitle`.

## Verified
API flows (register→trial, 2nd-site 402, expire→cron freeze+email, idempotent re-run, demo-pay unfreeze), all three UI states (trial banner / lock screen / themed paused page), the video plays+closes in the lightbox — locally AND on the live production site. FE typecheck + 27/27 unit, BE typecheck, both prod builds green.

## Still open
Stripe not wired (set `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`/`STRIPE_PRICE_*` to enable real payments — the trial/lock/freeze/reactivate flow is already plumbed to it).

---

# Handoff — July 9, 2026 (Installable PWA — the app AND every teacher site)

Goal: make **Mumotor and each published teacher website installable "apps"** — added to the phone/iPad/
desktop home screen, launched full-screen (no browser chrome), with their own name/icon/colour. Free,
standards-based (**PWA**: manifest + service worker + iOS meta), no store/native build/new hosting. Built to
sit on top of the July-8 responsive work (safe-area, touch) **without changing desktop rendering**. Shipped
to mumotor.com.

## The problem it solves
The whole product is **one React SPA** whose `index.html` is shared by the app AND every teacher site
(`/p/:slug` + dormant subdomains). A single static manifest would make every installed site say "Mumotor",
so the app **identity is swapped per route**.

## What shipped
- **Backend** (`routes/siteServing.ts`): `GET /site/:slug/manifest.webmanifest` (host-aware `start_url`/`scope`,
  name + theme_color from the site's template + `customization.theme` accent via a `TEMPLATE_THEME` map that
  mirrors the frontend `COLOR_SLOTS`/`templateTheme`) and `GET /site/:slug/icon.svg` (generated maskable SVG,
  site initial on the accent). Both registered **before** `/site/:slug`, Redis-cached; `manifest:*`/`icon:*`
  cleared with `site:*` on publish/unpublish/delete (`websites.ts`).
- **Frontend**: static `public/manifest.webmanifest` + real PNG icons `public/icons/` (rasterized from a
  blue-gradient "M" `icon.svg`) + `index.html` apple/viewport-fit meta; `public/sw.js` (hand-rolled SW —
  API/uploads/site/manifest **never cached**, navigations network-first→shell, hashed assets SWR; registered
  only in PROD from `main.tsx`); `lib/pwa.ts` (`applyAppIdentity`/`resetToMumotorIdentity`/`siteAppIdentity`/
  `usePwaInstall`/`registerServiceWorker`); `components/InstallAppButton.tsx` (`InstallAppButton` in the
  dashboard header + landing nav; `SiteInstallPill` floating on public sites — themed, localized, iOS
  Share-hint, dismissible, hidden when standalone). Identity applied in `PublicSite.tsx` + `TemplatedShell.tsx`
  (enroll/book/account/review). Safe-area under scoped `@media (display-mode: standalone)` in `index.css` +
  `book-shell.css`. i18n: `pwa.*` (app) + `installApp`/`installHintIos` (site, `bookingStrings`).

## Verified (real dist served by the backend + Playwright)
App root → static Mumotor manifest + SW `active`; `/p/davids-driving` → manifest swaps to
`/site/davids-driving/manifest.webmanifest`, apple title "David's Driving School", theme = accent,
`start_url`/`scope` `/p/davids-driving/`; install pill renders bottom-center on mobile; **SW caches held only
the shell + hashed assets — never `/api`, `/site`, or `.webmanifest`**; no horizontal scroll at 390.
Suites: **unit 26/26 · E2E 90/90 (0 console errors) · integration 74/74.** No schema change → no migration.

---

# Handoff — July 9, 2026 (follow-ups, commit `e376095`)

Two small follow-ups after the responsive pass, both shipped to mumotor.com:
- **Removed the 14 untracked `"* 2"` macOS copy-duplicate template folders** (`aurora 2` … `webgl 2`) under
  `packages/frontend/src/templates/` — verified no source imports them and none were git-tracked, then deleted.
- **Fixed the builder's "Start fresh" (draft-restore) button.** It only hid the banner (`setRestorePrompt(null)`)
  while the wizard `config` stayed pre-filled from the localStorage draft (stale auto-sample data), so the form
  kept showing the old data. Now "Start fresh" `clearWizard()`s the local draft, resets `config` to a clean default
  (site language defaulted to the app language), removes the server `/api/wizard-draft` copy, and returns to the
  welcome step. Verified end-to-end (seed a server draft → banner shows → Start fresh → local+server drafts cleared,
  business-name field empty). typecheck + E2E 90/90 green.

---

# Handoff — July 8, 2026 session (full responsive / device-adaptive pass)

Goal: make the **entire product** perfect on **phone · tablet · desktop**, adapting **automatically to the
device** (no user toggle), across all 12 templates, the whole student portal, the teacher (Mumotor) dashboard,
the builder, the Customize editor, and the marketing/auth site — in EN + HE/AR (RTL) — **without changing the
already-working laptop/desktop rendering.** Committed to `main` and auto-deployed to mumotor.com.

## Approach
Responsive CSS/Tailwind + per-template `@media` do the layout; `lib/useDevice.ts` (`matchMedia`) covers the few
JS branches. New Tailwind variants **`coarse:`** (`pointer:coarse`), **`touch:`** (`hover:none`), **`mouse:`** —
so every touch/phone change is scoped and **cannot reach a laptop** (`pointer:fine`, `≥lg`). Standards enforced
everywhere: **≥44px** tap targets on touch, **≥16px** inputs on touch (kills iOS zoom), `100dvh`, no horizontal
page scroll at any width, logical props / mirrored glyphs for RTL.

## What shipped (by wave)
- **Foundation:** `lib/useDevice.ts`; `coarse/touch/mouse` Tailwind variants; global touch floors in `index.css`;
  shared `Modal` now scrolls (`max-h-[90dvh]`) instead of clipping; **Landing got a hamburger mobile menu**.
- **Student portal (`book-shell.css` + pages):** 16px inputs + 44px btn/tab/chip/back on touch; `100dvh`; chat
  height `min(26rem,52dvh)`; brand truncation; StudentAccount tabs no-wrap + header name/sign-out; BookLesson
  slot chips no-wrap + confirm buttons stack on phone; **RTL-aware back/forward arrows** (`.book-arrow`); 44px stars.
- **All 12 templates (additive CSS only — desktop byte-identical):** phone nav shows **logo + hamburger only**
  (account pill hidden ≤520, already in the mobile menu); 44px hamburgers; instructor photos shrink on phone
  (prestige 216→88, night-shift 192→88, full-throttle 160→96, …); frosted orphan hero-badge hidden <940;
  grid-ink hamburger no longer clipped; RTL flips added where missing (**mumotor had none**); `overflow-wrap` on
  big headings. `mumotor` is the reference block; `prism`/`prestige` are the RTL references; `easy-lane` the nav ref.
- **Teacher dashboard:** `StudentsTab` and `AdminDashboard`'s 3 tables → **stacked cards on phone / table on
  desktop** (`hidden md:block` + `md:hidden`); drawer scroll-lock + Esc; break-times row wraps; URL pills truncate;
  Billing RTL badge + tablet grid (`lg:grid-cols-3`, laptop unchanged); NotificationBell dropdown clamped; 44px icons.
- **Builder / gallery / preview:** Design-step preview edge-to-edge + stacked action bar on phone; hours/break rows
  wrap; TemplatePreview pill capped + truncated + RTL chevrons/arrow-keys; accent dots 44px hit area; gallery header.
- **Customize → full touch parity:** tap reveals per-item controls (was hover-only); **touch reorder via ▲/▼
  buttons** (drag grip stays for mouse via `mouse:`/`touch:` scoping — desktop cluster unchanged); responsive
  icon-only toolbar; popover width-clamped; `scrollIntoView` + `visualViewport` so the keyboard doesn't cover edits.
- **Marketing/auth:** hero `break-words`; AuthShell brand pane at `md`; password-eye + LanguageSwitcher 44px; truncation.

## Bugs found *during verification* and fixed (pre-existing, not introduced here)
- **CodeTab + Settings phone overflow (real):** a `grid … lg:grid-cols-2` with no base `grid-cols-1` made the mobile
  track expand to a `nowrap truncate` `<code>` URL's max-content → page overflow. Fix: base `grid-cols-1`
  (`minmax(0,1fr)`) + `min-w-0` on the code. Also the daily code scales down on phone.
- **Duplicate React keys:** several templates keyed lists by content (`key={area.name}`/`key={f}`/`key={s.label}`);
  Customize's clone-on-add produced duplicates → the E2E "0 console errors" gate failed. Re-keyed by index (also
  what CLAUDE.md already mandated). This is why E2E is back to 90/90.

## Verification
typecheck + build clean; **unit 26/26 · E2E 90/90 (0 console errors) · integration 74/74**. Live-drove landing,
auth, builder, dashboard (every driving-school tab + all pages), admin, Customize, all 12 templates, and the
student pages at 360/375/390/768/1024/1280 in EN + HE — asserting `scrollWidth ≤ innerWidth` everywhere — and
confirmed desktop is unchanged (admin shows tables not cards; template nav-links/photos identical at 1280).

## Still open / notes
- **Touch-target/16px rules use `@media (pointer:coarse)`** — verify on a REAL phone/tablet or with device
  emulation; headless Chrome reports `pointer:fine` so `browser_resize` alone won't trigger them (the rules are
  present in the shipped CSS and are standard).
- **Untracked `"* 2"` duplicate folders (14)** under `templates/` were local macOS copy cruft (not in git) —
  **removed July 9** after verifying nothing imports them.
- Pre-existing non-responsive i18n gaps remain (NotificationBell, AdminDashboard, PhotoPicker hardcoded English) —
  out of scope for this pass.

---

# Handoff — July 5, 2026 session

A long iterative session driven by the user reviewing freshly-built sites and reporting issues via
screenshots. All work below is committed to `main` and deployed to mumotor.com (Railway auto-deploys on push).

## What shipped, by theme

### 1. The original 16-fix batch (templates, customize, student & teacher flows)
Builder Design step (removed the concept strip → "Choose another template"); every template fully honours
locale + transmission choice + **₪** currency; Customize (controls above short items, FAQ answers open + clean
new answer in editing, reliable window-level drag-reorder, save toast, bigger instructor photo); student pages
localized + logged-in students skip the email step + students can't self-cancel + no "2-hour" wording; teacher
**Today/Tomorrow schedule** (add student to a slot, cancel-with-email, "Email me the schedule"); email specific
students; open-road footer scrollbar-flicker fix. See CLAUDE.md "July 5 batch — 16 fixes".

### 2. Complete localization
- Templates: localized the auto-fill sample, transmission-aware About/credential/FAQ, weekday names in the
  hours table, the default tagline + default plan text — so a HE/AR site is fully in-language (numbers stay Latin).
- **Whole Mumotor app** now follows the language switcher (react-i18next, `lib/i18n.ts`): the marketing landing,
  the **builder wizard (every step/field)**, the dashboard (all pages + tabs), the auth pages, and the Customize
  toolbar — EN/HE/AR + RTL. "Mumotor" stays English.
- The builder's "website language" field **defaults to the app language** on a fresh wizard.
- Fixed a reveal bug where landing sections vanished on language switch (lists were keyed by translated text →
  remounted into the hidden `whileInView` state; now keyed by index).

### 3. Phone required + report email
Phone is now required at teacher signup + dashboard add-student + student profile (front + zod), so the teacher's
daily schedule report always has each student's number. That **daily report email was redesigned** (Apple-minimal
Mumotor look, per-lesson rows with a tappable `tel:` phone).

### 4. Performance — scroll jank (effect-preserving)
The landing and the effect-heavy templates (mumotor, obsidian, open-road) had scroll lag. Fixed WITHOUT changing
visuals: animated `scale` on `blur()` orbs → **translate-only** (translate is a cheap compositor op; scale
re-rasterizes the blur every frame); open-road's full-page-tall grain overlay → `position: fixed` (viewport-sized).
Verified with frame-time traces: all templates ~16.6ms/frame (60fps), 0 janky frames.

### 5. Data fidelity — "show only what the teacher entered"
A site could show 3 identical package cards while the wizard had 1 plan — a stale Customize `packages` array
snapshot overriding the wizard plans. Fixed: `reconcilePackageOverride` (`fromWizard.ts`) drops a packages override
that structurally desyncs from the plans (auto-fixes broken live sites on next load); Customize can no longer
add/remove/reorder package cards (**PlansEditor is the single source of truth** for packages). Also made the English
default credentials honest (were false UK certs) and dropped an invented "1,200 people" claim.

## Verification
Every change was verified in a real browser (Playwright / chrome-devtools MCP): Arabic/Hebrew renders, RTL, photo
sizes, hover/toast behaviour, frame-time traces, and DB state for booking/assign/cancel. Suites green throughout:
**unit 26/26 · integration 74/74 · E2E 90/90 · 0 console errors**; frontend + backend typecheck + build clean.

## Boundaries / known design choices (not bugs)
- Free text a teacher personally types (custom bio/tagline/name/city) shows exactly as typed — there is no AI
  translator, so it isn't machine-translated (agreed with the user).
- Templates fill genuinely-empty sections with tasteful, editable starter content (about body, FAQ derived from the
  real price/transmission, generic coverage areas, a stock hero image) so a minimally-filled site still looks
  complete. Reviews never fabricate.

## Deploy
No schema changes / no migration this session. Deploy = push to `main` (Railway auto-deploys). `db:deploy` only if a
migration is ever added.

## Still open (pre-existing, from the July audit — unchanged this session)
Media storage still local (`Media.cdnUrl` null, no S3/R2/CDN); no plan enforcement (Stripe not wired); per-teacher
subdomains dormant (wildcard DNS blocked on the Railway Hobby plan); daily-email cron loads all enrollments in memory
(first scaling cost); tokens in localStorage + no CSP; dead `Page`/`Section` models; zero real AI calls.

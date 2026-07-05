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

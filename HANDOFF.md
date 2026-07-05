# Handoff — July 5, 2026 (16-fix batch)

A batch of 16 user-reported fixes across the builder, templates, Customize editor, student pages,
teacher dashboard, and a footer bug. All shipped, verified end-to-end, and deployed to mumotor.com.

## What changed (by area)

### Builder — Design step
- Removed the 12-card horizontal concept-selector strip. `DesignPreviewStep` (`BuilderWizard.tsx`)
  now shows only the live preview + a **"Choose another template"** button that returns to the
  Templates gallery. Caption reworded. Switch designs from the gallery, not an inline strip.

### Templates — localization, transmission, currency
- **Currency:** every template price is now **₪** (was `£`) — 12 `templates/<slug>/index.tsx` + `sampleData.ts`.
- **Transmission-aware copy:** `strings.ts` `dataDefaults(locale, transmission)` localizes the About body
  clause + credential chip to the real choice (manual/automatic/both). `both` output is byte-identical to
  before, so EN/existing sites are unchanged.
- **No stale English:** `fromWizard.ts` `plansToPackages` re-localizes any stored *default* transmission
  feature line to the site locale+choice (custom text untouched); `sampleWizardConfig` (`lib/wizard.ts`) is
  per-locale so Auto-fill previews fully in-language; English `sampleData` `areas`/`bio` fallbacks localized.

### Customize editor (`components/customize/CustomizeMode.tsx`)
- Per-item hover controls (⠿ / ＋ / 🗑) now sit **above** the item (below when near the top) — they no
  longer cover short pills/chips.
- FAQ answers **force-open in editing mode** (new `EditingProvider`/`useIsEditing` in `templates/shared.tsx`,
  read by every template's FAQ). Normal/preview keeps the accordion. A newly added FAQ inserts a clean
  `{q:'', a:''}`; empty editable text shows an "Add text…" placeholder (scoped `.cz-canvas` CSS).
- **Drag-reorder is reliable** — DnD moved to always-mounted `window` listeners (guarded by `dragSrc`),
  resolving the target from `e.target.closest('[data-edit-item]')` (elementFromPoint fallback), so a drop
  lands even outside the canvas and **persists**.
- The **Save toast is `bottom-center`** so it never covers the toolbar Save/Done.
- Instructor photo is **~1.5× bigger** in all 12 `<slug>.css`.

### Student pages (`pages/public/*` + `components/public/TemplatedShell.tsx`)
- **Fully localized to the site's locale** (not the browser) via new `lib/bookingStrings.ts`
  (`bookLocale` + `bookT`, en/he/ar; EN byte-identical). Dates use `formatDateLongIn`/`formatWeekdayIn`
  (`lib/utils.ts`) — words localize, **digits stay Latin** (`numberingSystem:'latn'`).
- **Logged-in students skip the email step** in BookLesson (`studentTokenStore.activate` → `studentPortalApi.me`).
- **Students can no longer cancel** — cancel UI removed; they're told to contact the instructor. No
  "…up to 2 hours before…" wording anywhere.

### Teacher dashboard (`pages/dashboard/DrivingSchool.tsx` + backend)
- **Today / Tomorrow schedule** (`daily-report?day=`); free slots gain **"Add student"**
  (`POST /schedule/assign` — books a slot like a self-booking, honouring the unique index, no daily-report
  email); booked slots keep **Cancel** (emails the student). **"Email me the schedule"** button
  (`POST /schedule/email-me`) sends the day's report on demand.
- **Email specific students**: "A group / Specific students" toggle → sends `enrollmentIds`
  (resolved `id:{in:…}` scoped to `websiteId`, IDOR-safe; `targetGroup:'selected'`, no migration).

### open-road footer flicker
- Added `overflow-x:hidden` to `.tmpl-open-road` (only template that lacked it) and changed the film-grain
  keyframes from `%` translate to small `px` + `inset:-6px` — the scrollbars no longer flicker at the footer.

## Verification
- Typecheck: frontend + backend clean. Frontend build clean.
- Tests: **unit 26/26 · integration 74/74 · E2E 89/89**, 0 console errors. (Integration: clean
  `prisma migrate reset --force` then run once — the suite books persistent slots that otherwise fail the
  date-drift assertions.)
- Browser (real): AR open-road site → RTL, "ناقل أوتوماتيكي", ₪50, no £, no horizontal overflow; Customize →
  FAQ answers open + controls above chips + bigger photo; dashboard → Today/Tomorrow + Add-student modal +
  Email specific students; student enroll/book → Arabic, no 2-hour text.
- Backend (curl + DB): `schedule/assign` 201 → slot locked, dup → 409; `schedule/email-me` sent;
  bulk-email to a single selected enrollment resolved 1 recipient.

## No schema changes / no migration. No new env. Deploy = push to `main` (Railway auto-deploys).

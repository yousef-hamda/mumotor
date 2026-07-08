# Mumotor Audit Report — WHAT_MUMOTOR_DOES.md vs. the Real Code

*Generated July 7, 2026. Method: 12 independent auditor agents each enumerated every discrete claim
(page, button, field, default value, limit, message, email, behaviour) in their part of
`WHAT_MUMOTOR_DOES.md` and verified it against the actual source with file:line evidence. Every
suspected problem was then handed to a separate **adversarial verifier agent** whose job was to try to
REFUTE it by independently re-reading the code — only findings that survived that check are listed as
real. **No code was changed.** This is a report only.*

---

## Headline numbers

| Metric | Count |
|---|---|
| Discrete claims checked | **598** |
| Verified 100% correct, fully and completely implemented | **570 (95.3%)** |
| Suspected problems raised by auditors | 28 |
| Killed by adversarial verification (false alarms) | 2 |
| **Real problems that need a change** | **26** |

**Severity of the 26 real problems:** 0 high · **2 medium** · 15 low · 9 cosmetic.
**Nothing critical or user-flow-breaking was found.** Every core flow (auth, wizard, publish,
booking, double-booking guarantee, student portal, chat, emails, cron, tenant isolation, rate
limits, single-use tokens, upload validation) verified correct end-to-end.

**Where the fix belongs:** 4 problems need a **code** fix · 10 could be fixed on **either** side
(small code fix, or reword the guide) · 12 are **doc-only** (the guide misdescribes code that works fine).

---

## Per-section scoreboard

| Part of the guide | Claims checked | 100% OK | Real problems |
|---|---|---|---|
| Languages note + Part 1 — Marketing landing | 41 | 37 | 4 |
| Part 2 — Accounts & signing in | 28 | **28** | **0** |
| Part 3 — Builder wizard | 56 | 52 | 4 |
| Part 4 — Customize editor | 42 | 40 | 2 |
| Part 5 — Published website | 53 | 49 | 4 |
| Part 6.1–6.2 — Dashboard overview + school tabs | 70 | 69 | 1 |
| Part 6.3–6.7 — Reviews/Messages/Publishing/Billing/Settings | 62 | 58 | 4 |
| Part 7 — Student experience | 54 | 53 | 0 (1 refuted) |
| Part 8 — Automatic emails | 35 | 33 | 2 |
| Parts 9–10 — Cron + correctness rules | 49 | 46 | 2 (1 refuted) |
| Parts 11–13 — Settings / Billing / SEO | 50 | 49 | 1 |
| Parts 14–15 + Appendix — Dormant / Admin / 12 designs | 58 | 56 | 2 |
| **Total** | **598** | **570** | **26** |

Highlights of what verified perfectly: all auth flows including one-time 30-min reset tokens and
never-revealing-account-existence; every Step-2 wizard default exactly as documented (days, hours,
breaks 12:00–13:00, rest 5–30/10, durations 20–90/45, ₪100, window 09:00–17:00, report 18:00, the
exact 10 social platforms); both Customize save paths syncing packages→plans; Reviews section/nav
gated on approved reviews in all 12 templates; the DB-level double-booking guarantee
(`Booking_slot_unique` + P2002→friendly 409); all 5 notification types; Messages polling at exactly
12s/8s; publish→`WebsiteVersion` snapshot; typed-DELETE cascade across all 12 tenant tables; all 11
emails with correct triggers, once-guards, and fire-and-forget failure handling; both cron jobs with
once-per-day self-healing stamps; all 7 rate limits; magic-byte upload validation; the entire
Part 14 dormancy list, the whole admin area, the 7 analytics events, the full demo seed, and the
12-design registry order/names.

---

# THE 26 REAL PROBLEMS

Each was CONFIRMED by an independent adversarial verifier. Use the checkboxes to track fixes.

## A. Code should change (4) — the product doesn't do what it promises

### ☑ 1. Teacher review replies are never shown on the public site — **MEDIUM**
- **Guide says (6.3):** Reply — “a public reply shown on the site.”
- **Reality:** The reply is saved and the public API even returns it, but the published site drops
  it: `PublicSite.tsx:36-42` maps reviews to `{id,name,rating,text,meta}` only, and the template
  `Review` type (`templates/types.ts:36-44`) has no `reply` field — no template can render it. It is
  visible only in the teacher dashboard.
- **Evidence:** `packages/frontend/src/pages/public/PublicSite.tsx:36-42`, `packages/frontend/src/templates/types.ts:36-44`, `packages/backend/src/routes/reviews.ts:48` (public endpoint already selects `reply` — clear intent to show it).
- **Fix:** Add `reply?: string` to the template `Review` type, pass it through the `PublicSite.tsx`
  mapping, render an “instructor response” line in the templates’ testimonials sections.

### ☑ 2. Arabic-numeral / browser-locale leaks on public sites — **LOW**
- **Guide says (languages note):** numbers always stay Latin digits (0–9); a site renders in the
  teacher’s language independent of the visitor’s browser.
- **Reality:** Two straggler paths missed by the July 5 localization pass: review dates use
  `toLocaleDateString(undefined,…)` (browser locale → Arabic-Indic digits + wrong-language month name
  on ar-SA/ar-EG/ar-IL browsers), and the animated stat counters in 10 template call sites use bare
  `toLocaleString()` (→ "١٬٢٠٠"). Runtime-verified by the verifier.
- **Evidence:** `PublicSite.tsx:41`; bare `toLocaleString()` at `templates/{night-shift:53, prestige:47, mumotor:156, prism:251, aurora:131, frosted:202, bento:224+343, obsidian:294, grid-ink:206}`. The correct pattern already exists at `lib/utils.ts:25-28` (`calendar:'gregory'`+`numberingSystem:'latn'`).
- **Fix:** Pin both paths to the site locale with the existing latn-pinned helper.

### ☑ 3. Landing “View a live demo” opens the legacy HTML site, not the real product — **LOW**
- **Guide says (Part 1):** opens a real example driving-instructor site in a new tab.
- **Reality:** It links `/site/davids-driving` — the legacy deterministic backend HTML render, which
  the repo’s own docs say “isn’t the user-facing site.” Prospects see an old-engine page without the
  12-template design, “My account” nav, or themed booking. (Link works; new tab works.)
- **Evidence:** `packages/frontend/src/components/hero/CinematicHero.tsx:40`, `lib/api.ts:25`; the rest of the app uses `/p/${slug}` (`Dashboard.tsx:77`, `BuilderWizard.tsx:848`).
- **Fix:** Change the href to `/p/davids-driving`.

### ☑ 4. “You can’t book a time in the past” isn’t enforced at the book endpoint — **LOW**
- **Guide says (Part 10):** you can’t book a time in the past.
- **Reality:** `POST /book-lesson` blocks past **dates**, but for today it only checks the cutoff
  hour — no comparison of the requested time to “now,” and `validSlots` has no past-time filter, so a
  past slot today is bookable via direct API before the cutoff. The read-only availability endpoint
  does filter, but against UTC minutes (up to ~3h stale for Israel). Unreachable from the tomorrow-only
  student UI — API-level gap only.
- **Evidence:** `packages/backend/src/routes/drivingSchool.ts:413-438` (book route), `:366-370` (UTC-based availability filter).
- **Fix:** When `diffDays===0`, filter `validSlots`/reject `data.time` against `nowInZone(env.APP_TIMEZONE)`, and switch the availability past-slot filter to the same wall-clock.

## B. Fix on either side (10) — small code fix, or reword the guide

### ☐ 5. “Codes are never stored in plain text” is only true for the per-student copy — **MEDIUM** *(recommended: fix the doc)*
- **Guide says (Part 10):** codes are never stored in plain text — right after naming the permanent and daily codes.
- **Reality:** Only the per-student snapshot on the enrollment row is hashed (`hashEnrollmentCode`).
  The teacher’s permanent code lives plaintext in `Website.configuration`, and the daily rotating code
  plaintext in `DailyCode.code` — **by design**, since both must be displayed back to the teacher. The
  blanket security claim is false as written.
- **Evidence:** `schedulingService.ts:172`, `routes/drivingSchool.ts:129,576,1462`; hashing only at `drivingSchool.ts:153,744` (`utils/crypto.ts:18`).
- **Fix:** Reword the guide: only the student’s personal copy on their enrollment record is hashed; the shared codes stay retrievable so the teacher can see them.

### ☑ 6. Landing logo click doesn’t scroll to top when already on the landing page — **LOW**
- **Guide says (Part 1):** clicking the logo returns to the top of the page.
- **Reality:** The logo is `<Link to="/">`; when already on `/` the pathname doesn’t change, so the
  `ScrollToTop` effect (keyed on `[pathname]`) never fires and nothing happens.
- **Evidence:** `Landing.tsx:116,372`, `components/ScrollToTop.tsx:12-16`, `main.tsx:14-16,28`.
- **Fix:** Add an `onClick` that calls `window.scrollTo({top:0})` when `pathname==='/'` (or key the effect on `location.key`) — or soften the doc.

### ☑ 7. Server wizard-draft autosave silently dies once photos are added — **LOW**
- **Guide says (Part 3):** signed-in users’ answers also save to the server a couple of seconds after each change “so nothing is lost.”
- **Reality:** Images are stored as base64 data-URLs inside the config; `PUT /wizard-draft` rejects
  configs over 200KB (`DRAFT_TOO_LARGE`) and the frontend swallows the error (`.catch(() => {})`) —
  after any realistic image upload, every subsequent server autosave fails silently. localStorage keeps
  working (same-browser refresh loses nothing), but cross-device restore serves a stale pre-image draft.
- **Evidence:** `packages/backend/src/routes/wizardDraft.ts:12,31-33`, `BuilderWizard.tsx:109-116` (silent catch at `:112`), `lib/wizard.ts:255-262`.
- **Fix:** Strip/downscale image data-URLs before the PUT (or surface a one-time “draft too large to sync” notice) — or soften the doc to say the server copy holds typed answers, not photos.

### ☑ 8. “Business description (required)” isn’t actually enforced anywhere — **LOW**
- **Guide says (Part 3):** description is required.
- **Reality:** Only the business name gates Continue; the description’s “Required —” text is a
  display-only hint (frontend, backend zod, and publish all accept it empty; templates fall back to
  default copy). The guide itself later says Continue gates only on the name — internally inconsistent.
- **Evidence:** `BuilderWizard.tsx:202,474-475,249-281`, `lib/i18n.ts:124` (+HE:601/AR:1078), `routes/websites.ts:38`, `fromWizard.ts:183,191,201`.
- **Fix:** Either add the check to `onNext`, or change the hint (EN/HE/AR) + the guide to “Recommended.”

### ☑ 9. Schedule’s “lesson number” is a lifetime count, not an ordinal — **LOW**
- **Guide says (6.2 Tab 3):** booked slots show the student’s lesson number.
- **Reality:** The slot renders `Lesson #{classCount}` — the enrollment’s single lifetime counter,
  identical on every one of that student’s slots, incremented per booking and never decremented on
  cancel. A student booked today + tomorrow shows “Lesson #2” on both.
- **Evidence:** `DrivingSchool.tsx:576-578`, `routes/drivingSchool.ts:871-889,956-959,831-853`; the backend even has a comment admitting classCount “double-counts” (`:1156`).
- **Fix:** Reword the label to “N lessons booked,” or compute a true per-booking ordinal from non-CANCELLED bookings (the `studentStats` pattern already exists).

### ☑ 10. Notifications bell: “mark one as read” doesn’t exist; opening auto-marks all — **LOW**
- **Guide says (Part 6):** the teacher can open them, mark one as read, or mark all as read.
- **Reality:** Opening the dropdown silently fires mark-ALL (`NotificationBell.tsx:38`); items are
  non-interactive divs; the per-item API (`PATCH /notifications/:id/read`, client `markRead`) exists
  but has zero callers.
- **Evidence:** `components/NotificationBell.tsx:38,51-77`, `lib/api.ts:225`, `routes/notifications.ts:23-32`.
- **Fix:** Reword the guide to “opening the bell marks all as read” — or wire the existing per-item API and stop auto-marking on open.

### ☑ 11. Bulk email subject isn’t school-branded (unlike every other email) — **COSMETIC**
- **Guide says (Part 8 intro):** all student-facing emails have the school name in the subject and footer.
- **Reality:** `sendBulkCustomEmail` sends the teacher’s raw subject with no `subjectTag(brand)`
  suffix — the only student-facing email type without it (header/footer/sender ARE branded).
- **Evidence:** `emailService.ts:308-322` vs. `subjectTag` usage at `:195,213,231,302,334,368,386,429`.
- **Fix:** Append `subjectTag(data.brand)` in `sendBulkCustomEmail` — or note in the guide that bulk emails use the teacher’s own subject verbatim (arguably intentional).

### ☑ 12. JSON-LD `priceRange` is a hardcoded `'₪₪'` for every site — **LOW**
- **Guide says (Part 13):** structured data describes the school including “the price range.”
- **Reality:** `priceRange: '₪₪'` is a constant — identical whether the teacher charges ₪120 or ₪400. Valid schema.org syntax, zero school-specific information. All sibling fields are genuinely derived.
- **Evidence:** `PublicSite.tsx:63`; real prices are available in `templateData.packages`.
- **Fix:** Derive it from the packages’ min–max prices (e.g. `"₪120–₪1,400"`), or soften the guide to “a price-range indicator.”

### ☐ 13–14. Two template-gallery blurbs promise effects that don’t exist — **LOW** *(both the guide AND the in-app registry text)*
- **☐ 13. Aurora “light that follows the pointer”:** no pointer tracking exists anywhere in aurora’s
  code path (no mouse handlers, no `--mx/--my`, shader canvas is `pointer-events:none`, no mouse
  uniform). Pointer-glow exists in obsidian and bento — the claim was misattributed.
  Evidence: `templates/aurora/index.tsx`, `webgl/ShaderBackground.tsx:200`, `registry.tsx:46` (in-app blurb makes the same claim).
- **☐ 14. Prism “iridescent borders shift colour as you scroll”:** the only iridescent border is a
  static gradient on the popular plan card; `prism.css:311` literally comments “no color animation.”
  Evidence: `prism.css:495-506,311`, `registry.tsx:88` (same claim in-app).
- **Fix:** Either add the small effects (the obsidian/bento pointer-glow pattern is reusable), or
  correct both the guide lines (544, 547) **and** the `registry.tsx` blurbs users see in the gallery.

## C. Doc-only fixes (12) — the code works; the guide misdescribes it

### ☐ 15. Billing 6.6 says “in the live product, upgrading goes through Stripe checkout” — **LOW**
- **Reality:** The live deployment has no Stripe keys, so a paid switch returns **503
  BILLING_NOT_CONFIGURED** (an error toast, not checkout) — by design and correctly disclosed in
  Part 12 (“when configured”) but stated as live behaviour in 6.6. The “demo note” also renders
  unconditionally, including in live mode.
- **Evidence:** `routes/subscriptions.ts:57-84`, `Billing.tsx:31-42,134-136`.
- **Fix:** Align 6.6 with Part 12’s accurate wording; optionally add billing to Part 14’s dormant list.

### ☐ 16. Part 8 item 4’s student-cancel email is presented as live but is unreachable — **LOW**
- **Reality:** The student-cancels→teacher email + backend routes exist and work, but no current page
  calls them (students see “contact your instructor”). Parts 12/14 disclose this; Part 8 item 4 reads
  as live behaviour with no dormancy note (item 8’s magic link has one).
- **Evidence:** `routes/drivingSchool.ts:66,1078-1123,1256-1293`; `lib/api.ts:136,424` (zero callers); `StudentAccount.tsx:284`.
- **Fix:** Add the same “built but not triggered by any page” note item 8 has.

### ☐ 17. Step-3 gallery cards don’t use “your own details” — **LOW**
- **Reality:** Gallery cards render `TemplateConcept` — a bespoke animated CSS preview of each
  design’s look with placeholder bars; the teacher’s real data first appears in Step 4’s live preview.
- **Evidence:** `BuilderWizard.tsx:746,718-721`, `TemplateConcept.tsx:1-9,53`.
- **Fix:** Reword: “an animated mini-preview of that design’s look (your details appear in the live preview on the next step).”

### ☐ 18. The mumotor 8 accent dots are NOT inside the Customize editor — **LOW**
- **Reality:** `MumotorAccentDots` renders only on the mumotor card in the builder Templates step and
  the public gallery — never in `CustomizeMode`, where the accent is the ordinary “Accent” slot in the
  Colours panel. The guide describes the dots correctly at lines 163 and 543; line 202 misplaces them.
- **Evidence:** `TemplateConcept.tsx:32-38`, `BuilderWizard.tsx:750`, `TemplatesGallery.tsx:100`; no usage in `CustomizeMode.tsx`.
- **Fix:** Remove/reword the bullet at guide line 202.

### ☐ 19. “Why learn here” cards exist on only 6 of the 12 designs — **LOW**
- **Reality:** mumotor/aurora/bento/prism/obsidian/frosted have a why/features section; grid-ink,
  open-road, night-shift, easy-lane, prestige, full-throttle don’t (their reassurance lives in the
  About checklist). The guide qualifies other variable items with “on some designs” but not this one.
- **Evidence:** grep `whyHeading/whyEyebrow` — 0 hits in the six named templates; `mumotor/index.tsx:181-204`.
- **Fix:** Add the “(on some designs)” qualifier at guide lines 241–242.

### ☐ 20. Language switch happens on Save, not on change — **COSMETIC**
- **Reality (6.7):** `i18n.changeLanguage` fires only in the save-profile mutation’s `onSuccess` —
  the dashboard switches right after pressing Save profile, not when the dropdown changes. (The
  sidebar switcher IS instant, but that’s a different control.)
- **Evidence:** `Settings.tsx:23-31,93-105`.
- **Fix:** Reword to “saving the profile switches the dashboard language immediately.”

### ☐ 21. Third landing orb is static (intentionally) — **COSMETIC**
- **Reality:** Only 2 of the 3 orbs carry `aurora-animate`; the CSS comments show two-orb drift is by design.
- **Evidence:** `Background.tsx:16,19,22`, `index.css:168-187`.
- **Fix:** Guide line 38 → “three soft glowing orbs, two of which drift slowly.”

### ☐ 22. Auto-fill sample doesn’t fill “every field” — images stay empty — **COSMETIC**
- **Reality:** `sampleWizardConfig` fills all text/settings fields (localized) but never sets
  `logoSrc`/`instructorPhoto`/`carPhoto`/`gallery`.
- **Evidence:** `lib/wizard.ts:213-241`, `BuilderWizard.tsx:199`.
- **Fix:** Guide → “fills every text and settings field (photos/logo are left for you to upload).”

### ☐ 23. Customize hint text quoted wrong — **COSMETIC**
- **Reality:** The hint is “— click any part of your site to edit it” (EN/HE/AR), not “click any text/photo to edit.”
- **Evidence:** `lib/i18n.ts:465` (+942/1419), `CustomizeMode.tsx:357`.
- **Fix:** Update the quote at guide line 185.

### ☐ 24. “Choose plan” button label varies per design — **COSMETIC**
- **Reality:** Scroll-to-booking is universal, but “Choose plan” is only the default on the 5
  glass-family templates; others use “Book this plan” / “Book This Package” / “Select package”;
  popular cards “Get started.” Label is also teacher-editable.
- **Evidence:** `templates/strings.ts:120` + per-template `strings.ts` overrides.
- **Fix:** Guide → “a call-to-action button (label varies by design, editable) that scrolls to booking.”

### ☐ 25. “Ready to start driving?” band heading is never shown — **COSMETIC**
- **Reality:** That string is a dead entry in the shared table; all 12 templates override it (“Ready
  when you are.” ×6, “Reserve your slot.”, “Ready to Hit the Road?” ×2, “Book Your Lesson”, “Ready to
  get started?”, “Book your lesson.”). The band + Book/Enroll buttons are correct.
- **Evidence:** `templates/strings.ts:158` (no consumers) + 11 per-template `strings.ts`.
- **Fix:** Guide → describe a design-specific heading instead of quoting one.

### ☐ 26. Transmission chip literals differ from the guide’s parenthetical — **COSMETIC**
- **Reality:** The chip correctly reflects the real choice, but single-transmission EN values are
  “Manual transmission” / “Automatic transmission” (only “Manual & Automatic” matches exactly).
- **Evidence:** `templates/strings.ts:533-548,563-572`.
- **Fix:** Guide parenthetical → “(Manual & Automatic / Manual transmission / Automatic transmission)”.

---

# Appendix A — 2 findings raised and REFUTED (no fix needed)

These were checked and dismissed by adversarial verification — listed so you know they were examined.

1. **“Student cancel API still live contradicts the guide” — REFUTED.** The guide’s claims are
   correctly scoped (“anywhere **in booking**”, “cannot cancel **here**”) and it explicitly discloses
   the backend capability twice (Part 8 item 4’s 2-hour rule; Part 10 “the student pages don’t expose
   a self-cancel button at all”). Code matches: no student-facing page calls any cancel endpoint; the
   backend route enforces the exact 120-minute cutoff described. The doc is internally consistent.
   *(Optional completeness: mention the newer session-auth cancel endpoint in Part 14’s list.)*

2. **“Same-day cutoff uses UTC, not Israel time” — REFUTED as a doc-vs-code mismatch.** The guide says
   only “closes after the teacher’s cutoff hour” with no timezone, and the product itself labels the
   setting “0–23 (UTC)” in all three languages — the code does exactly what the setting says. The
   UTC-vs-Israel inconsistency inside the route is a fair code-polish idea (see problem #4, which
   covers the related real gap), but the documented claim is satisfied.

# Appendix B — Extra observations (not guide claims; noted by auditors in passing)

- **Stale duplicate template directories** exist under `packages/frontend/src/templates/` (e.g.
  `aurora 2/` — accidental Finder copies, not imported anywhere found). Worth deleting.
- The **landing FAQ answer** “students see it in their own language automatically” is marketing copy
  that contradicts the actual (and correctly documented) one-language-per-site behaviour — the guide’s
  languages note is right; the marketing answer oversells.
- Verification-email TTL is 24h and resends are capped at 5/hour per email — fine, just undocumented.

---

## Bottom line

- **570 of 598 documented behaviours (95.3%) are implemented exactly as written — fully and completely.**
- **26 real problems** need attention: **2 medium** (public review replies never rendered; the
  “codes never stored in plain text” overstatement), **15 low**, **9 cosmetic**.
- Of those, only **4 need code changes** to make the product honest to its own guide (#1–#4);
  **10** can be settled either way (#5–#14); **12** are guide-text corrections (#15–#26).
- No high-severity or flow-breaking defect was found anywhere.

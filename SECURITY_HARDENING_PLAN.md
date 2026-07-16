# Security Hardening — 4 Pillars (July 16, 2026)

Task: harden **Authentication · Rate Limiting · Row-Level Security · Server-Side Validation**
across the Mumotor backend. Based on a full 4-agent audit (auth/rate/RLS/validation). The
codebase is already disciplined; these close the concrete residual gaps. **All changes are
additive/tightening and backward-compatible** (existing 7-day tokens keep working).

## 1. Authentication
- **Pin JWT algorithm** to `HS256` in `verifyToken` + `requireStudent` (algorithm-confusion defence).
- **Positive token type**: teacher tokens now carry `kind:'teacher'`; `verifyToken` accepts
  `teacher` or legacy-undefined, rejects `student`. (`requireStudent` already positive.)
- **Token revocation** on password change/reset: add `User.tokenVersion` (+ migration); teacher
  tokens carry a `tv` claim; `verifyToken` (now async) rejects a token whose `tv` ≠ current
  `tokenVersion` and rejects tokens for deleted users. change-password bumps + reissues; reset
  bumps (all old sessions die). Legacy tokens (no `tv`) map to 0 = default → still valid until reset.
- **Drop cookie token trust** in `extractToken` (only Bearer/localStorage is used) → removes the
  entire CSRF surface (credentialed cross-site requests can't ride a cookie).
- **Login timing**: dummy bcrypt compare when the user is missing (anti user-enumeration by timing).
- **Weak-password denylist** (common passwords + email-local-part) on register/change/reset.
- **env**: raise `JWT_SECRET` schema floor 16→32 (match the prod guard).

## 2. Rate Limiting
- **Fix `clientIp`** → use Express `req.ip` (trust-proxy aware) instead of the attacker-controlled
  first `X-Forwarded-For` token. Fixes ALL 22 IP-keyed limiters (were fully spoofable).
- **Add limits to unprotected expensive/email endpoints**: add-student (email-bomb), schedule/email-me,
  subscriptions/checkout, website publish + create, wizard-draft PUT, teacher→student messages.
- **Per-email secondary counter on login** (throttle single-account credential stuffing regardless of IP).
- **Global `/api` baseline limiter** (per-IP backstop) — defence-in-depth for any un-limited route.

## 3. Row-Level Security (tenant isolation)
- Audit result: **no cross-tenant IDOR/BOLA found**; every tenant query is ownership-gated + `websiteId`-scoped;
  Prisma `onDelete: Cascade` verified complete on all 13 child tables.
- Harden `requireStudent` fail-closed if a future student route lacks `:websiteId`.
- **Add cross-tenant isolation regression tests** (teacher B → 403 on teacher A's site; student token
  for site A rejected on site B) so isolation can't silently regress.

## 4. Server-Side Validation
- **Bound `configuration`** (websites create/PATCH) + **`businessConfig`** (aiGeneration) to ~2 MB
  stringified (was unbounded up to the 10 MB body cap; real configs incl. embedded HTML are ~30–100 KB).
- **settingsSchema**: `breakTimes` array `.max(20)` + `HH:MM` regex; `workingHours` keys restricted to the
  7-weekday allowlist + `HH:MM` regex on open/close.
- **students `search`** capped (100). **register `name`** `.max(120)`. **PATCH /me phone** → shared phone regex.
- **media `dataUrl`** `.max()` (bound base64 before decode). **presetId** `.max(64)`.
- **reviews GET ?websiteId** + public query ids → explicit `uuid()` (clean 400 instead of Prisma-error 400).
- Shared `utils/validation.ts`: `phoneSchema`, `HHMM`, `WEEKDAYS`, `weekdayHoursSchema`, `boundedRecord()`,
  common-password denylist.

## Verify
- Extend `test/integration.mjs` (+ new security assertions) — run against the test-mode server.
- Unit-test `clientIp` (req.ip used, spoofed XFF ignored) since rate-limits are bypassed in test mode.
- One live 429 check with the server in non-test mode.
- `npm run build` both packages; `typecheck` frontend.

## Deploy (standing rule)
- Additive migration (`tokenVersion`) FIRST via the Postgres public proxy, then push code (Railway auto-deploys).
- Update memory + HANDOFF + README + CLAUDE.md.

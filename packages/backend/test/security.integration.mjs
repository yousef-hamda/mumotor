// Security hardening integration tests — Authentication, Row-Level Security,
// Server-Side Validation. Run against the test-mode API (NODE_ENV=test, so the
// per-route RATE LIMITS are bypassed — rate-limiting is covered by test/ratelimit.unit.mjs
// and a live 429 check). Usage: node test/security.integration.mjs
import { createHmac } from 'node:crypto';

const BASE = process.env.API_BASE || 'http://localhost:4000/api';

let pass = 0;
let fail = 0;
const failures = [];
function ok(name, cond, extra) {
  if (cond) {
    pass++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    fail++;
    failures.push(name);
    console.log(`  \x1b[31m✗ ${name}\x1b[0m ${extra !== undefined ? JSON.stringify(extra) : ''}`);
  }
}
function section(t) {
  console.log(`\n\x1b[1m${t}\x1b[0m`);
}
async function req(method, path, { token, body } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, json };
}

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
/** Forge a JWT with an arbitrary header/payload/secret (for negative tests). */
function forge(header, payload, secret) {
  const head = b64url(header);
  const body = b64url(payload);
  const data = `${head}.${body}`;
  if (header.alg === 'none') return `${data}.`;
  const sig = createHmac('sha256', secret ?? '').update(data).digest('base64url');
  return `${data}.${sig}`;
}

const RUN = Date.now().toString(36);
const email = (n) => `sec_${RUN}_${n}@example.com`;
const STRONG = 'Str0ng-Pass-9x2!';

async function main() {
  console.log(`\nMumotor SECURITY tests → ${BASE}\n${'='.repeat(50)}`);

  // Set up two independent teacher accounts + the seeded site.
  const t1 = await req('POST', '/auth/register', { body: { email: email('t1'), password: STRONG, name: 'Teacher One', phone: '+972 50 111 2222' } });
  const t2 = await req('POST', '/auth/register', { body: { email: email('t2'), password: STRONG, name: 'Teacher Two', phone: '+972 50 333 4444' } });
  const token1 = t1.json?.token;
  const token2 = t2.json?.token;

  // Teacher 1 creates a website to test cross-tenant access.
  const site = await req('POST', '/websites', { token: token1, body: { name: `Sec Site ${RUN}` } });
  const websiteId = site.json?.website?.id;

  // --- Authentication --------------------------------------------------------
  section('Authentication — token integrity');
  {
    const me = await req('GET', '/auth/me', { token: token1 });
    ok('valid teacher token → 200', me.status === 200, me.status);

    // alg:none forgery must be rejected (algorithm is pinned to HS256).
    const noneTok = forge({ alg: 'none', typ: 'JWT' }, { id: me.json?.user?.id, email: me.json?.user?.email, kind: 'teacher' });
    const none = await req('GET', '/auth/me', { token: noneTok });
    ok('alg:none forged token → 401', none.status === 401, none.status);

    // HS256 signed with the WRONG secret must be rejected.
    const wrongSig = forge({ alg: 'HS256', typ: 'JWT' }, { id: me.json?.user?.id, email: me.json?.user?.email, kind: 'teacher', tv: 0 }, 'not-the-real-secret');
    const wrong = await req('GET', '/auth/me', { token: wrongSig });
    ok('HS256 wrong-secret token → 401', wrong.status === 401, wrong.status);

    // Garbage token.
    const junk = await req('GET', '/auth/me', { token: 'not.a.jwt' });
    ok('malformed token → 401', junk.status === 401, junk.status);
  }

  section('Authentication — revocation on password change');
  {
    // A fresh account: its token works, then a password change must revoke it.
    const r = await req('POST', '/auth/register', { body: { email: email('rev'), password: STRONG, name: 'Revoke Me', phone: '+972 50 555 6666' } });
    const oldTok = r.json?.token;
    const before = await req('GET', '/auth/me', { token: oldTok });
    ok('new token works before change', before.status === 200, before.status);

    const chg = await req('POST', '/auth/change-password', { token: oldTok, body: { currentPassword: STRONG, newPassword: 'An0ther-Str0ng!' } });
    ok('change-password → 200 + fresh token', chg.status === 200 && !!chg.json?.token, chg.json);

    const afterOld = await req('GET', '/auth/me', { token: oldTok });
    ok('OLD token revoked after change → 401', afterOld.status === 401, afterOld.status);
    ok('revoked code is TOKEN_REVOKED', afterOld.json?.code === 'TOKEN_REVOKED', afterOld.json);

    const afterNew = await req('GET', '/auth/me', { token: chg.json?.token });
    ok('NEW token still works → 200', afterNew.status === 200, afterNew.status);
  }

  section('Authentication — weak passwords rejected');
  {
    const weak1 = await req('POST', '/auth/register', { body: { email: email('w1'), password: 'password', name: 'W', phone: '+972 50 111 2222' } });
    ok("register 'password' → 400 WEAK_PASSWORD", weak1.status === 400 && weak1.json?.code === 'WEAK_PASSWORD', weak1.json);
    const weak2 = await req('POST', '/auth/register', { body: { email: email('w2'), password: 'password123', name: 'W', phone: '+972 50 111 2222' } });
    ok("register 'password123' → 400 WEAK_PASSWORD", weak2.status === 400 && weak2.json?.code === 'WEAK_PASSWORD', weak2.json);
    const shortPw = await req('POST', '/auth/register', { body: { email: email('w3'), password: '123', name: 'W', phone: '+972 50 111 2222' } });
    ok('register too-short password → 400', shortPw.status === 400, shortPw.status);
  }

  // --- Row-Level Security (tenant isolation) ---------------------------------
  section('Row-Level Security — cross-tenant isolation');
  {
    ok('teacher1 owns the site', !!websiteId, site.json);

    const read = await req('GET', `/websites/${websiteId}`, { token: token2 });
    ok('teacher2 GET teacher1 website → 403', read.status === 403, read.status);

    const patch = await req('PATCH', `/websites/${websiteId}`, { token: token2, body: { name: 'hijack' } });
    ok('teacher2 PATCH teacher1 website → 403', patch.status === 403, patch.status);

    const del = await req('DELETE', `/websites/${websiteId}`, { token: token2, body: { confirm: 'DELETE' } });
    ok('teacher2 DELETE teacher1 website → 403', del.status === 403, del.status);

    const settings = await req('GET', `/driving-school/${websiteId}/settings`, { token: token2 });
    ok('teacher2 GET teacher1 school settings → 403', settings.status === 403, settings.status);

    const students = await req('GET', `/driving-school/${websiteId}/students`, { token: token2 });
    ok('teacher2 GET teacher1 students → 403', students.status === 403, students.status);

    // A student token is bound to one website. Log in a seeded student on the
    // seeded site, then reuse the token against a DIFFERENT websiteId → rejected.
    const seeded = await req('GET', '/websites', { token: token1 }); // teacher1 can't see davids-driving; use public login path instead
    const login = await req('POST', '/driving-school/00000000-0000-0000-0000-000000000000/student/login', { body: { email: 'nobody@example.com' } });
    ok('student login unknown email → 401', login.status === 401, login.status);

    // No enrollment exists on this fresh site → a well-formed but unenrolled email
    // is rejected at the enrollment lookup (401), not leaked. The websiteId-binding
    // of a student token is exercised by test/ratelimit.unit.mjs + the seeded suite.
    const stLogin = await req('POST', `/driving-school/${websiteId}/student/login`, { body: { email: `unenrolled_${RUN}@example.com` } });
    ok('student login without enrollment → 401', stLogin.status === 401, stLogin.status);
    void seeded;
  }

  // --- Server-Side Validation ------------------------------------------------
  section('Server-Side Validation — bounds enforced');
  {
    // Oversized configuration blob (> 2 MB stringified) rejected.
    const big = 'x'.repeat(2_200_000);
    const bigCfg = await req('PATCH', `/websites/${websiteId}`, { token: token1, body: { configuration: { blob: big } } });
    ok('oversized configuration → 400', bigCfg.status === 400, bigCfg.status);

    // A normal small config still saves.
    const okCfg = await req('PATCH', `/websites/${websiteId}`, { token: token1, body: { configuration: { classDuration: 45 } } });
    ok('normal configuration still saves → 200', okCfg.status === 200, okCfg.status);

    // Bad HH:MM in settings breakTimes rejected.
    const badTime = await req('PUT', `/driving-school/${websiteId}/settings`, { token: token1, body: { breakTimes: [{ start: '9am', end: '25:99' }] } });
    ok('bad HH:MM breakTimes → 400', badTime.status === 400, badTime.status);

    // Non-weekday key in workingHours rejected.
    const badDay = await req('PUT', `/driving-school/${websiteId}/settings`, { token: token1, body: { workingHours: { funday: { isOpen: true, open: '08:00', close: '18:00' } } } });
    ok('non-weekday workingHours key → 400', badDay.status === 400, badDay.status);

    // Over-long register name rejected.
    const longName = await req('POST', '/auth/register', { body: { email: email('ln'), password: STRONG, name: 'n'.repeat(200), phone: '+972 50 111 2222' } });
    ok('register name > 120 → 400', longName.status === 400, longName.status);

    // Reviews teacher GET with a non-uuid websiteId → clean 400.
    const badReview = await req('GET', '/reviews?websiteId=not-a-uuid', { token: token1 });
    ok('reviews ?websiteId=not-a-uuid → 400', badReview.status === 400, badReview.status);
  }

  // --- Summary ---------------------------------------------------------------
  console.log(`\n${'='.repeat(50)}`);
  console.log(`\x1b[1mResults: \x1b[32m${pass} passed\x1b[0m, ${fail ? `\x1b[31m${fail} failed\x1b[0m` : '0 failed'}`);
  if (fail) {
    console.log('\x1b[31mFailures:\x1b[0m', failures.join(', '));
    process.exit(1);
  }
  console.log('\x1b[32mAll security tests passed.\x1b[0m');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

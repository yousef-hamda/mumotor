/**
 * A-02 regression test — bulk email must be opt-out-able; transactional must not be.
 *
 * Mumotor sent a daily "booking is open" notice to every active student of every school
 * with no unsubscribe link and no List-Unsubscribe header anywhere. That is a legal problem
 * (Israeli and EU law both require an opt-out on commercial mail) and a deliverability one:
 * Gmail and Yahoo require one-click unsubscribe from bulk senders, and when a domain's
 * reputation drops it takes the transactional mail down with it.
 *
 * The two halves that both have to be true:
 *   1. opting out really stops the bulk sends
 *   2. it does NOT stop booking confirmations, reminders or cancellations — a student who
 *      unsubscribes must still be told when their own lesson is
 *
 * Boots the real app in-process and asserts against what the console transport actually
 * sends. Self-cleaning.
 *
 * Run: npm run test:unsub --workspace @mumotor/backend
 */
import { spawnSync } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app.js';
import { makeUnsubscribeToken, readUnsubscribeToken, unsubscribeUrl } from '../src/utils/unsubscribe.js';
import { processDailyStudentNotifications } from '../src/services/jobs/jobService.js';
import { sendBookingConfirmation, sendDailyBookingOpen } from '../src/services/email/emailService.js';

const prisma = new PrismaClient();

let pass = 0;
let fail = 0;
const originalLog = console.log;
const report = (line: string) => originalLog(line);
function check(label: string, ok: boolean, detail = '') {
  if (ok) {
    pass++;
    report(`  \x1b[32m✓\x1b[0m ${label}`);
  } else {
    fail++;
    report(`  \x1b[31m✗\x1b[0m ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

const sent: string[] = [];
console.log = (...args: unknown[]) => {
  const line = args.map(String).join(' ');
  if (line.includes('[console-email]')) sent.push(line);
  else originalLog(...args);
};
const mailTo = (email: string) => sent.filter((l) => l.includes(`→ ${email}`));

const STAMP = Date.now();
const TEACHER = `unsub-teacher-${STAMP}@mumotor.test`;
const STUDENT = `unsub-student-${STAMP}@mumotor.test`;
const KEEPER = `unsub-keeper-${STAMP}@mumotor.test`; // stays subscribed, proves we only drop the opt-out
const SLUG = `unsub-${STAMP}`;

let server: Server;
let base: string;
const cleanup = () =>
  prisma.user.deleteMany({ where: { email: { startsWith: 'unsub-teacher-', endsWith: '@mumotor.test' } } });

async function main() {
  await cleanup();
  report('\nA-02 — unsubscribe must stop bulk mail and nothing else\n');

  const app = createApp();
  server = createServer(app);
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const addr = server.address();
  base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;

  const openAllWeek = Object.fromEntries(
    ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((d) => [
      d,
      { isOpen: true, open: '08:00', close: '20:00' },
    ])
  );
  const user = await prisma.user.create({
    data: {
      email: TEACHER,
      name: 'Unsub Teacher',
      passwordHash: 'x',
      websites: {
        create: {
          name: 'Unsub Test School',
          slug: SLUG,
          status: 'PUBLISHED',
          locale: 'EN',
          publishedHtml: '<html></html>',
          publishedAt: new Date(),
          configuration: { classDuration: 60, teacherName: 'Unsub Teacher' },
          settings: { create: { businessHours: openAllWeek } },
          enrollments: {
            create: [
              { studentName: 'Opt Out', studentEmail: STUDENT, studentPhone: '+972-50-111-2222', enrollmentCode: 'sha256:a:b', status: 'ACTIVE' },
              { studentName: 'Stays Subscribed', studentEmail: KEEPER, studentPhone: '+972-50-333-4444', enrollmentCode: 'sha256:c:d', status: 'ACTIVE' },
            ],
          },
        },
      },
    },
    include: { websites: { include: { enrollments: true } } },
  });
  const site = user.websites[0];
  const optOut = site.enrollments.find((e) => e.studentEmail === STUDENT)!;
  const keeper = site.enrollments.find((e) => e.studentEmail === KEEPER)!;

  // ── The token itself ────────────────────────────────────────────────────────────
  report('  the signed token');
  const token = makeUnsubscribeToken(optOut.id);
  check('round-trips to the right enrollment', readUnsubscribeToken(token) === optOut.id);
  check('a tampered signature is rejected', readUnsubscribeToken(`${token.split('.')[0]}.AAAAAAAAAAAAAAAAAAAAAA`) === null);
  check('a tampered id is rejected', readUnsubscribeToken(`${Buffer.from(keeper.id).toString('base64url')}.${token.split('.')[1]}`) === null);
  check('garbage is rejected', readUnsubscribeToken('nonsense') === null);
  check('a non-uuid payload cannot reach the database', readUnsubscribeToken(`${Buffer.from("'; DROP TABLE x;--").toString('base64url')}.x`) === null);
  check('the link is absolute', /^https?:\/\/.+\/unsubscribe\/.+/.test(unsubscribeUrl(optOut.id)));

  // ── The WIRE FORMAT, which is what Gmail, Yahoo and AWS actually inspect ────────
  //
  // Captured in a CHILD process (unsubscribe.wire.ts): the transport is chosen at module
  // load, so setting RESEND_API_KEY in-process silently falls through to the console
  // transport and the check passes vacuously.
  //
  // This matters: the first version of this fix passed every behavioural test while
  // dropping BOTH headers, because one edit in the dispatch didn't apply. The footer link
  // was present and the opt-out worked, so nothing else caught it.
  report('\n  the wire format (what mailbox providers inspect)');
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) if (v !== undefined) env[k] = v;
  env.RESEND_API_KEY = 'test_key_for_wire_capture';
  const backendDir = new URL('..', import.meta.url).pathname;
  const wireRun = spawnSync(`${backendDir}/../../node_modules/.bin/tsx`, ['test/unsubscribe.wire.ts'], {
    cwd: backendDir,
    env,
    encoding: 'utf8',
  });
  const wireLine = /WIRE=(\{.*\})/.exec(`${wireRun.stdout ?? ''}${wireRun.stderr ?? ''}`);
  const w = wireLine ? JSON.parse(wireLine[1]) : null;

  check('the transport was actually exercised', w?.captured === 2, `captured ${w?.captured}`);
  check(
    'bulk carries List-Unsubscribe',
    w?.bulkListUnsub === '<https://mumotor.com/unsubscribe/TESTTOKEN>',
    String(w?.bulkListUnsub)
  );
  check(
    'bulk carries List-Unsubscribe-Post (required for ONE-CLICK, not just a link)',
    w?.bulkListUnsubPost === 'List-Unsubscribe=One-Click',
    String(w?.bulkListUnsubPost)
  );
  check('bulk has a visible footer link too (headers alone are not enough)', w?.bulkHasFooterLink === true);
  check('transactional has NO unsubscribe header', w?.transHasHeader === false);
  check('transactional has NO unsubscribe link', w?.transHasLink === false);

  // ── The behavioural send ────────────────────────────────────────────────────────
  report('\n  the send itself');
  sent.length = 0;
  await sendDailyBookingOpen(STUDENT, {
    studentName: 'Opt Out',
    bookingUrl: `${base}/p/${SLUG}/book-lesson`,
    forDate: '2026-08-01',
    brand: { schoolName: 'Unsub Test School', locale: 'en' },
    unsubscribeUrl: unsubscribeUrl(optOut.id),
  });
  check('the bulk email was sent', mailTo(STUDENT).length === 1);

  // ── One-click POST, which is what Gmail and Yahoo actually call ─────────────────
  report('\n  one-click unsubscribe (RFC 8058)');
  const oneClick = await fetch(`${base}/unsubscribe/${token}`, { method: 'POST' });
  check('POST returns 200', oneClick.status === 200, String(oneClick.status));
  const after = await prisma.clientEnrollment.findUnique({ where: { id: optOut.id }, select: { unsubscribedAt: true } });
  check('the student is now unsubscribed', after?.unsubscribedAt !== null);

  const firstAt = after!.unsubscribedAt!.getTime();
  await new Promise((r) => setTimeout(r, 20));
  await fetch(`${base}/unsubscribe/${token}`, { method: 'POST' });
  const again = await prisma.clientEnrollment.findUnique({ where: { id: optOut.id }, select: { unsubscribedAt: true } });
  check('a repeated one-click is idempotent (providers retry)', again?.unsubscribedAt?.getTime() === firstAt);

  const bad = await fetch(`${base}/unsubscribe/not-a-real-token`, { method: 'POST' });
  check('an invalid token still returns 200, never an error to the provider', bad.status === 200, String(bad.status));

  // ── The human page must NOT act on a bare GET ───────────────────────────────────
  report('\n  the human page');
  const page = await fetch(`${base}/unsubscribe/${makeUnsubscribeToken(keeper.id)}`);
  const pageHtml = await page.text();
  check('GET renders a page', page.status === 200 && pageHtml.includes('<html'));
  const keeperAfterGet = await prisma.clientEnrollment.findUnique({ where: { id: keeper.id }, select: { unsubscribedAt: true } });
  check(
    'a bare GET does NOT unsubscribe (mail scanners fetch every link)',
    keeperAfterGet?.unsubscribedAt === null,
    'a link scanner would have opted this student out'
  );
  check('it asks for confirmation instead', /confirm/i.test(pageHtml));

  // ── The point of the whole exercise: bulk stops ─────────────────────────────────
  report('\n  bulk mail stops, transactional does not');
  sent.length = 0;
  await processDailyStudentNotifications();
  check('the unsubscribed student gets NO daily notice', mailTo(STUDENT).length === 0, `${mailTo(STUDENT).length} sent`);
  check('the still-subscribed student DOES', mailTo(KEEPER).length === 1, `${mailTo(KEEPER).length} sent`);

  sent.length = 0;
  await sendBookingConfirmation(STUDENT, {
    studentName: 'Opt Out',
    date: '2026-08-02',
    time: '10:00',
    brand: { schoolName: 'Unsub Test School', locale: 'en' },
  });
  check(
    'an unsubscribed student STILL gets their booking confirmation',
    mailTo(STUDENT).length === 1,
    'transactional mail was wrongly suppressed'
  );

  await cleanup();
  server.close();
  console.log = originalLog;
  console.log(`\n${pass} passed, ${fail} failed\n`);
  await prisma.$disconnect();
  process.exit(fail ? 1 : 0);
}

main().catch(async (e) => {
  console.log = originalLog;
  console.error(e);
  await cleanup().catch(() => {});
  server?.close();
  await prisma.$disconnect();
  process.exit(1);
});

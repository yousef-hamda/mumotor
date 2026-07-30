/**
 * D-11 / A-04 regression test — the two notifications that were silently missing.
 *
 * D-11: when a student books, the TEACHER got only an in-dashboard bell. An instructor out
 *       teaching all day learned nothing until the daily report (18:00 default, tomorrow
 *       only), so a same-day booking could go unannounced entirely.
 * A-04: finishing / pausing / deleting a student cancelled every future lesson they had
 *       booked and told NOBODY. Reactivating does not restore them.
 *
 * Boots the real app in-process and asserts against the console email transport, so this
 * checks what is actually SENT rather than that a function exists. Self-cleaning.
 *
 * Run: npm run test:notify --workspace @mumotor/backend
 */
import { createServer, type Server } from 'node:http';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app.js';

const prisma = new PrismaClient();

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, detail = '') {
  // Deliberately `report`, not console.log: a failure's detail quotes captured email lines
  // (which contain the console-email marker), and routing that through the interceptor
  // below swallowed the failure into the capture buffer instead of printing it.
  if (ok) {
    pass++;
    report(`  \x1b[32m✓\x1b[0m ${label}`);
  } else {
    fail++;
    report(`  \x1b[31m✗\x1b[0m ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

const STAMP = Date.now();
const TEACHER_EMAIL = `notify-teacher-${STAMP}@mumotor.test`;
const STUDENT_EMAIL = `notify-student-${STAMP}@mumotor.test`;
const SLUG = `notify-${STAMP}`;

/**
 * Capture what the console transport logs. The email service falls back to the console
 * transport when no SES/Resend/SMTP is configured and logs one line per send, which is the
 * cheapest honest way to assert "an email went to this address".
 */
const sent: string[] = [];
const originalLog = console.log;
/** Always reaches the terminal, never the capture buffer. */
const report = (line: string) => originalLog(line);
console.log = (...args: unknown[]) => {
  const line = args.map(String).join(' ');
  if (line.includes('[console-email]')) sent.push(line);
  else originalLog(...args);
};
const mailTo = (email: string) => sent.filter((l) => l.includes(`→ ${email}`));

let server: Server;
let base: string;

const cleanup = async () => {
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'notify-teacher-', endsWith: '@mumotor.test' } },
  });
};

async function main() {
  await cleanup();
  originalLog('\nD-11 / A-04 — the notifications that were missing\n');

  const app = createApp();
  server = createServer(app);
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const addr = server.address();
  base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;

  // A published site, open all week, with one active student.
  const openAllWeek = Object.fromEntries(
    ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((d) => [
      d,
      { isOpen: true, open: '08:00', close: '20:00' },
    ])
  );
  const user = await prisma.user.create({
    data: {
      email: TEACHER_EMAIL,
      name: 'Notify Teacher',
      passwordHash: 'x',
      // A live entitlement, or requireActiveAccount correctly 402s every teacher write —
      // which is the paywall working, not a bug. The test needs an unlocked account.
      subscription: {
        create: {
          plan: 'FREE',
          status: 'TRIALING',
          websiteQuota: 1,
          trialEndsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        },
      },
      websites: {
        create: {
          name: 'Notify Test School',
          slug: SLUG,
          status: 'PUBLISHED',
          publishedHtml: '<html></html>',
          publishedAt: new Date(),
          // Wide-open booking window + a 90-day horizon so the test never depends on the
          // wall-clock hour or the day of the week.
          configuration: {
            classDuration: 60,
            advanceBookingDays: 90,
            bookingCutoffHour: 23,
            bookingWindowStart: '00:00',
            bookingWindowEnd: '23:59',
            dailyCodeEnabled: false,
            breakTimes: [],
            teacherName: 'Notify Teacher',
          },
          settings: { create: { businessHours: openAllWeek } },
          services: { create: { name: 'Driving Lesson', duration: 60, price: 0 } },
          enrollments: {
            create: {
              studentName: 'Notify Student',
              studentEmail: STUDENT_EMAIL,
              studentPhone: '+972-50-999-8877',
              enrollmentCode: 'sha256:aa:bb',
              status: 'ACTIVE',
            },
          },
        },
      },
    },
    include: { websites: { include: { enrollments: true } } },
  });
  const site = user.websites[0];
  const enrollment = site.enrollments[0];

  // Book for a date a few days out: far enough to be "future" regardless of the hour.
  const target = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  // ── D-11: the teacher must be emailed when a student books ──────────────────────
  originalLog('  D-11 — student books, teacher must be told');
  sent.length = 0;
  const res = await fetch(`${base}/api/driving-school/${site.id}/book-lesson`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ studentEmail: STUDENT_EMAIL, date: target, time: '10:00' }),
  });
  const bookBody = await res.json().catch(() => ({}));
  check('booking succeeded', res.status === 201, `${res.status} ${JSON.stringify(bookBody).slice(0, 160)}`);
  await new Promise((r) => setTimeout(r, 400)); // the sends are fire-and-forget

  check('student still gets their confirmation', mailTo(STUDENT_EMAIL).length >= 1);
  check(
    'TEACHER is emailed about the new booking',
    mailTo(TEACHER_EMAIL).length >= 1,
    `teacher mail: ${mailTo(TEACHER_EMAIL).length}`
  );
  // The site has no explicit locale, so it takes the schema default of HE — meaning the
  // subject is correctly Hebrew ("שיעור חדש — …"). Assert the locale-independent fact (the
  // student is named) AND that the copy really did localize, which also proves the new
  // email is wired through emailT rather than hardcoded English.
  check(
    "the teacher's email names the student",
    mailTo(TEACHER_EMAIL).some((l) => l.includes('Notify Student')),
    mailTo(TEACHER_EMAIL).join(' | ').slice(0, 200).replace(/\[console-email\]/g, '(email)')
  );
  check(
    "and is in the SITE's language (Hebrew here, not hardcoded English)",
    mailTo(TEACHER_EMAIL).some((l) => l.includes('שיעור חדש')),
    mailTo(TEACHER_EMAIL).join(' | ').slice(0, 200).replace(/\[console-email\]/g, '(email)')
  );
  check(
    "it is branded as the teacher's school, not Mumotor",
    mailTo(TEACHER_EMAIL).some((l) => l.includes('Notify Test School'))
  );

  // ── A-04: pausing a student must tell them their lessons are cancelled ──────────
  originalLog('\n  A-04 — pausing a student must not silently destroy their schedule');
  const teacherToken = (await import('../src/middleware/auth.js')).signToken({
    id: user.id,
    email: user.email,
    tv: 0,
  });
  sent.length = 0;
  const pause = await fetch(
    `${base}/api/driving-school/${site.id}/students/${enrollment.id}/toggle-status`,
    { method: 'PATCH', headers: { authorization: `Bearer ${teacherToken}` } }
  );
  const pauseBody = (await pause.json().catch(() => ({}))) as { cancelledLessons?: number };
  check('pause succeeded', pause.status === 200, `${pause.status} ${JSON.stringify(pauseBody).slice(0, 160)}`);
  check(
    'the response reports how many lessons it cancelled (so the UI can warn first)',
    pauseBody.cancelledLessons === 1,
    `cancelledLessons=${pauseBody.cancelledLessons}`
  );
  await new Promise((r) => setTimeout(r, 400));
  check(
    'the STUDENT is emailed that the lesson is cancelled',
    // Localized to the site (HE): "השיעור בוטל". Match either language so the assertion
    // survives a future default-locale change.
    mailTo(STUDENT_EMAIL).some((l) => /cancelled/i.test(l) || l.includes('בוטל')),
    mailTo(STUDENT_EMAIL).join(' | ').slice(0, 200).replace(/\[console-email\]/g, '(email)')
  );

  const booking = await prisma.booking.findFirst({
    where: { websiteId: site.id, customerEmail: STUDENT_EMAIL },
    select: { status: true },
  });
  check('the lesson really is cancelled (slot freed)', booking?.status === 'CANCELLED', String(booking?.status));

  // ── And the no-op case must stay quiet ─────────────────────────────────────────
  originalLog('\n  no spurious mail when there is nothing to cancel');
  sent.length = 0;
  await fetch(`${base}/api/driving-school/${site.id}/students/${enrollment.id}/toggle-status`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${teacherToken}` },
  }); // back to ACTIVE
  const pause2 = await fetch(
    `${base}/api/driving-school/${site.id}/students/${enrollment.id}/toggle-status`,
    { method: 'PATCH', headers: { authorization: `Bearer ${teacherToken}` } }
  );
  const p2 = (await pause2.json().catch(() => ({}))) as { cancelledLessons?: number };
  await new Promise((r) => setTimeout(r, 300));
  check('re-pausing with no future lessons cancels nothing', p2.cancelledLessons === 0, `got ${p2.cancelledLessons}`);
  check('and sends no email', mailTo(STUDENT_EMAIL).length === 0, `${mailTo(STUDENT_EMAIL).length} sent`);

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

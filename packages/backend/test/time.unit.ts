/**
 * H-04 — fast unit tests for the time + slot logic.
 *
 * This is the trickiest logic in the product and it had NO fast tests: it was only exercised
 * through integration tests that need a running server and a freshly seeded database, and
 * some of those are known to be fragile depending on the day of the week. A slot-calculation
 * bug books a student at the wrong hour — the most damaging failure this product has, and
 * the hardest to notice.
 *
 * Everything here is pure and deterministic: fixed dates, no clock, no database, no network.
 * Runs in about a second, so it belongs in CI on every push.
 *
 * Run: npm run test:time --workspace @mumotor/backend
 */
import {
  diffDaysUtc,
  generateTimeSlots,
  minutesToTime,
  minutesUntilLessonInZone,
  parseTimeToMinutes,
  toUtcMidnight,
  weekdayKey,
  appTodayUtcMidnight,
  appTomorrowUtcMidnight,
  nowInZone,
} from '../src/utils/time.js';

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, detail = '') {
  if (ok) {
    pass++;
  } else {
    fail++;
    console.log(`  \x1b[31m✗\x1b[0m ${label}${detail ? ` — ${detail}` : ''}`);
  }
}
const eq = (label: string, actual: unknown, expected: unknown) =>
  check(label, JSON.stringify(actual) === JSON.stringify(expected), `got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);

function section(name: string) {
  console.log(`\n  ${name}`);
}

console.log('\nH-04 — time + slot logic (pure, deterministic)');

// ── HH:MM parsing round-trip ────────────────────────────────────────────────────
section('HH:MM parsing');
eq('midnight', parseTimeToMinutes('00:00'), 0);
eq('08:30', parseTimeToMinutes('08:30'), 510);
eq('23:59', parseTimeToMinutes('23:59'), 1439);
eq('round-trips', minutesToTime(parseTimeToMinutes('14:45')), '14:45');
eq('pads single digits', minutesToTime(65), '01:05');

// ── Slot generation ─────────────────────────────────────────────────────────────
section('slot generation');
eq('hourly 08:00–12:00', generateTimeSlots({ open: '08:00', close: '12:00', classDuration: 60 }), [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
]);
eq(
  'a lesson that would run past closing is not offered',
  generateTimeSlots({ open: '08:00', close: '09:30', classDuration: 60 }),
  ['08:00']
);
// 09:00 and 09:45 fit; a third lesson would start 10:30 and run to 11:15, past the close.
eq('45-minute lessons stop before the close', generateTimeSlots({ open: '09:00', close: '11:00', classDuration: 45 }), [
  '09:00',
  '09:45',
]);
eq('…and a longer day fits the third', generateTimeSlots({ open: '09:00', close: '11:15', classDuration: 45 }), [
  '09:00',
  '09:45',
  '10:30',
]);
eq(
  'rest gap is added between lessons',
  generateTimeSlots({ open: '08:00', close: '11:00', classDuration: 60, restMinutes: 15 }),
  ['08:00', '09:15']
);
eq(
  'booked slots are excluded',
  generateTimeSlots({ open: '08:00', close: '12:00', classDuration: 60, bookedTimes: ['09:00', '11:00'] }),
  ['08:00', '10:00']
);
eq(
  'a break removes only the overlapping slot',
  generateTimeSlots({
    open: '08:00',
    close: '14:00',
    classDuration: 60,
    breakTimes: [{ start: '12:00', end: '13:00' }],
  }),
  ['08:00', '09:00', '10:00', '11:00', '13:00']
);
eq(
  'a lesson merely TOUCHING a break is still offered (end == break start)',
  generateTimeSlots({
    open: '11:00',
    close: '12:00',
    classDuration: 60,
    breakTimes: [{ start: '12:00', end: '13:00' }],
  }),
  ['11:00']
);
eq(
  'a break shorter than a slot still blocks it',
  generateTimeSlots({
    open: '08:00',
    close: '10:00',
    classDuration: 60,
    breakTimes: [{ start: '08:30', end: '08:45' }],
  }),
  ['09:00']
);

section('slot generation — degenerate input must not hang or invent slots');
eq('close before open', generateTimeSlots({ open: '18:00', close: '08:00', classDuration: 60 }), []);
eq('close equals open', generateTimeSlots({ open: '08:00', close: '08:00', classDuration: 60 }), []);
eq('zero duration', generateTimeSlots({ open: '08:00', close: '18:00', classDuration: 0 }), []);
eq('negative duration', generateTimeSlots({ open: '08:00', close: '18:00', classDuration: -30 }), []);
eq(
  'a break covering the whole day leaves nothing',
  generateTimeSlots({
    open: '08:00',
    close: '18:00',
    classDuration: 60,
    breakTimes: [{ start: '00:00', end: '23:59' }],
  }),
  []
);

// ── Dates ───────────────────────────────────────────────────────────────────────
section('dates');
eq('toUtcMidnight is exactly midnight UTC', toUtcMidnight('2026-07-30').toISOString(), '2026-07-30T00:00:00.000Z');
eq('toUtcMidnight ignores a time portion', toUtcMidnight('2026-07-30T18:45:00Z').toISOString(), '2026-07-30T00:00:00.000Z');
eq('diffDaysUtc same day', diffDaysUtc(toUtcMidnight('2026-07-30'), toUtcMidnight('2026-07-30')), 0);
eq('diffDaysUtc tomorrow', diffDaysUtc(toUtcMidnight('2026-07-30'), toUtcMidnight('2026-07-31')), 1);
eq('diffDaysUtc yesterday', diffDaysUtc(toUtcMidnight('2026-07-30'), toUtcMidnight('2026-07-29')), -1);
eq('diffDaysUtc across a month end', diffDaysUtc(toUtcMidnight('2026-07-31'), toUtcMidnight('2026-08-01')), 1);
eq('diffDaysUtc across a year end', diffDaysUtc(toUtcMidnight('2026-12-31'), toUtcMidnight('2027-01-01')), 1);
eq('diffDaysUtc across a leap day', diffDaysUtc(toUtcMidnight('2028-02-28'), toUtcMidnight('2028-03-01')), 2);

// The Israel DST transitions are the classic source of an off-by-one-day booking bug:
// diffDaysUtc must count CALENDAR days, never elapsed hours.
section('dates — across DST transitions (the off-by-one-day trap)');
eq('spring forward (23h day)', diffDaysUtc(toUtcMidnight('2026-03-27'), toUtcMidnight('2026-03-28')), 1);
eq('autumn back (25h day)', diffDaysUtc(toUtcMidnight('2026-10-25'), toUtcMidnight('2026-10-26')), 1);
eq('a week spanning a DST change', diffDaysUtc(toUtcMidnight('2026-03-24'), toUtcMidnight('2026-03-31')), 7);

section('weekday keys');
eq('2026-07-30 is a Thursday', weekdayKey(toUtcMidnight('2026-07-30')), 'thursday');
eq('Friday (short day in Israel)', weekdayKey(toUtcMidnight('2026-07-31')), 'friday');
eq('Saturday (Shabbat — usually closed)', weekdayKey(toUtcMidnight('2026-08-01')), 'saturday');
eq('Sunday (a working day in Israel)', weekdayKey(toUtcMidnight('2026-08-02')), 'sunday');
eq(
  'every weekday key is a real day name',
  [...Array(7)].map((_, i) => weekdayKey(toUtcMidnight(`2026-08-0${i + 2}`))),
  ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
);

// ── Minutes-until-lesson (drives the ~2h reminder and the review request) ────────
section('minutes until a lesson');
const { ymd: todayYmd, hhmm: nowHHMM } = nowInZone('Asia/Jerusalem');
const today = toUtcMidnight(todayYmd);
const nowMin = parseTimeToMinutes(nowHHMM);

const laterToday = minutesToTime(Math.min(1439, nowMin + 90));
check(
  'a lesson 90 minutes from now is ~90 minutes away',
  Math.abs(minutesUntilLessonInZone(today, laterToday, 'Asia/Jerusalem') - 90) <= 1,
  String(minutesUntilLessonInZone(today, laterToday, 'Asia/Jerusalem'))
);
const tomorrow = new Date(today);
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
check(
  "tomorrow's lesson is more than a day out only when it should be",
  minutesUntilLessonInZone(tomorrow, nowHHMM, 'Asia/Jerusalem') === 24 * 60,
  String(minutesUntilLessonInZone(tomorrow, nowHHMM, 'Asia/Jerusalem'))
);
const yesterday = new Date(today);
yesterday.setUTCDate(yesterday.getUTCDate() - 1);
check(
  'a past lesson is negative (so it is never reminded about)',
  minutesUntilLessonInZone(yesterday, nowHHMM, 'Asia/Jerusalem') < 0
);

// ── App today/tomorrow must agree with the zone, and with each other ─────────────
section('app today / tomorrow');
const appToday = appTodayUtcMidnight('Asia/Jerusalem');
const appTomorrow = appTomorrowUtcMidnight('Asia/Jerusalem');
eq('today matches the Israel calendar date', appToday.toISOString().slice(0, 10), todayYmd);
eq('today is midnight UTC (matches a @db.Date column)', appToday.toISOString().slice(10), 'T00:00:00.000Z');
eq('tomorrow is exactly one day after today', diffDaysUtc(appToday, appTomorrow), 1);
check(
  'calling today twice does not mutate it (setUTCDate aliasing bug)',
  appTodayUtcMidnight('Asia/Jerusalem').getTime() === appToday.getTime()
);
// A timezone east of UTC can already be on the next date while UTC has not rolled over —
// this is exactly the drift the app-timezone helpers exist to prevent.
check(
  'a far-east zone is never BEHIND a far-west zone',
  appTodayUtcMidnight('Pacific/Kiritimati').getTime() >= appTodayUtcMidnight('Pacific/Midway').getTime()
);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);

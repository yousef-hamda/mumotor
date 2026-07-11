/** Time + slot helpers for lesson scheduling. */

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface BreakTime {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

export interface GenerateSlotsOptions {
  open: string; // "HH:MM"
  close: string; // "HH:MM"
  classDuration: number; // minutes
  bookedTimes?: string[]; // already-booked "HH:MM" slots to exclude
  breakTimes?: BreakTime[];
  restMinutes?: number; // optional rest gap appended after each class
}

/**
 * Walk from open→close in classDuration (+rest) steps. A slot is valid when it
 * fully fits before close, is not already booked, and does not overlap a break
 * (symmetric overlap: slotStart < breakEnd && slotEnd > breakStart).
 */
export function generateTimeSlots(opts: GenerateSlotsOptions): string[] {
  const { open, close, classDuration } = opts;
  const restMinutes = opts.restMinutes ?? 0;
  const booked = new Set(opts.bookedTimes ?? []);
  const breaks = (opts.breakTimes ?? []).map((b) => ({
    start: parseTimeToMinutes(b.start),
    end: parseTimeToMinutes(b.end),
  }));

  const openMin = parseTimeToMinutes(open);
  const closeMin = parseTimeToMinutes(close);
  const step = classDuration + restMinutes;
  if (step <= 0 || closeMin <= openMin) return [];

  const slots: string[] = [];
  for (let start = openMin; start + classDuration <= closeMin; start += step) {
    const end = start + classDuration;
    const slot = minutesToTime(start);
    if (booked.has(slot)) continue;
    const overlapsBreak = breaks.some((b) => start < b.end && end > b.start);
    if (overlapsBreak) continue;
    slots.push(slot);
  }
  return slots;
}

/**
 * Current wall-clock date + time in a given IANA timezone.
 * Returns { ymd: "YYYY-MM-DD", hhmm: "HH:MM" } so the daily rhythm can compare a
 * teacher's chosen "HH:MM" against "now" in their local time (default Asia/Jerusalem).
 */
export function nowInZone(tz: string): { ymd: string; hhmm: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { ymd: `${get('year')}-${get('month')}-${get('day')}`, hhmm: `${get('hour')}:${get('minute')}` };
}

/**
 * "Today" as a UTC-midnight Date, but the calendar date is taken from the wall
 * clock in `tz` (default the app timezone, Asia/Jerusalem) — NOT the server's UTC
 * date. This is what makes "tomorrow-only booking", the daily code, and the daily
 * emails line up with the teacher's/student's real local day, even in the 2-3h
 * window each night where the Israel date has already rolled but UTC hasn't.
 * The RETURNED value is still a UTC-midnight Date so it matches @db.Date columns.
 */
export function appTodayUtcMidnight(tz: string): Date {
  return toUtcMidnight(nowInZone(tz).ymd);
}

/** "Tomorrow" (local wall-clock date in `tz`) as a UTC-midnight Date. */
export function appTomorrowUtcMidnight(tz: string): Date {
  const t = appTodayUtcMidnight(tz);
  t.setUTCDate(t.getUTCDate() + 1);
  return t;
}

/**
 * Minutes from now until a lesson, comparing the stored Israel-local "HH:MM"
 * booking time against the current wall clock in `tz`. Negative = already past.
 * Wall-clock string math (no UTC-instant construction) so it's DST-safe.
 */
export function minutesUntilLessonInZone(bookingDate: Date, bookingTime: string, tz: string): number {
  const { ymd, hhmm } = nowInZone(tz);
  const dayDiff = diffDaysUtc(toUtcMidnight(ymd), bookingDate);
  return dayDiff * 24 * 60 + (parseTimeToMinutes(bookingTime) - parseTimeToMinutes(hhmm));
}

/** Parse a "YYYY-MM-DD" (or ISO) string into a UTC-midnight Date. */
export function toUtcMidnight(dateInput: string): Date {
  // Accept "YYYY-MM-DD" or full ISO; take only the date portion.
  const datePart = dateInput.slice(0, 10);
  const [y, m, d] = datePart.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

/** Whole-day difference (b - a) in UTC days. */
export function diffDaysUtc(a: Date, b: Date): number {
  const MS = 24 * 60 * 60 * 1000;
  const am = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const bm = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((bm - am) / MS);
}

/** Weekday key (monday..sunday) for a given date in UTC. */
export function weekdayKey(date: Date): string {
  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
    date.getUTCDay()
  ];
}

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

/** Today's date at UTC midnight (matches @db.Date columns). */
export function todayUtcMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
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

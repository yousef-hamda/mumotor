import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** "2026-06-22" → "Mon, Jun 22" */
export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** "2026-06-22" → "Monday, June 22, 2026" */
export function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

/** BookLocale ('en'|'he'|'ar') → BCP-47 tag (Gregorian + Latin digits forced). */
function bcpFor(locale?: string): string {
  return locale === 'he' ? 'he' : locale === 'ar' ? 'ar' : 'en-US';
}

/** Locale-aware long date — words follow the site language, digits stay Latin (0-9). */
export function formatDateLongIn(dateStr: string, locale?: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(bcpFor(locale), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', calendar: 'gregory', numberingSystem: 'latn' });
}

/** Locale-aware "month year" (e.g. review meta) — words follow the site
 *  language, digits stay Latin (0-9). Accepts an ISO datetime string. */
export function formatMonthYearIn(iso: string, locale?: string): string {
  return new Date(iso).toLocaleDateString(bcpFor(locale), { month: 'short', year: 'numeric', calendar: 'gregory', numberingSystem: 'latn' });
}

/** Locale-aware weekday name (e.g. for "closed on {day}"). */
export function formatWeekdayIn(dateStr: string, locale?: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(bcpFor(locale), { weekday: 'long', calendar: 'gregory' });
}

/** ISO datetime → "Jun 22, 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Build N upcoming calendar dates (YYYY-MM-DD) starting with TODAY in Israel
 * (Asia/Jerusalem) wall-clock time — NOT the browser's UTC date. This must match
 * the backend's `appTodayUtcMidnight(APP_TIMEZONE)` so the student's "tomorrow"
 * and the server's booking-date validation always agree, including the 2-3h window
 * each night where the Israel date has rolled but UTC hasn't.
 */
export function upcomingDates(days: number): string[] {
  const out: string[] = [];
  // "en-CA" formats as YYYY-MM-DD; timeZone gives the Israel-local calendar date.
  const todayYmd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [y, m, d] = todayYmd.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  for (let i = 0; i < days; i++) {
    const dt = new Date(base);
    dt.setUTCDate(base.getUTCDate() + i);
    out.push(dt.toISOString().slice(0, 10));
  }
  return out;
}

export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

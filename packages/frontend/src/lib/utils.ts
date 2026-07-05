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

/** Locale-aware weekday name (e.g. for "closed on {day}"). */
export function formatWeekdayIn(dateStr: string, locale?: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(bcpFor(locale), { weekday: 'long', calendar: 'gregory' });
}

/** ISO datetime → "Jun 22, 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Build N upcoming calendar dates (YYYY-MM-DD) starting today (UTC-aligned). */
export function upcomingDates(days: number): string[] {
  const out: string[] = [];
  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  for (let i = 0; i < days; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

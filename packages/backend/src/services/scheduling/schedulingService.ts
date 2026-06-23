import type { Website, SiteSettings, Booking } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { generateTimeSlots, weekdayKey, type BreakTime } from '../../utils/time.js';
import type { BusinessHours, DrivingConfig } from '../../types/index.js';

export const DEFAULTS = {
  classDuration: 60,
  advanceBookingDays: 1,
  bookingCutoffHour: 18,
  dailyCodeEnabled: true,
  open: '08:00',
  close: '18:00',
};

/** Read + default the scheduling config off Website.configuration. */
export function normalizeConfig(website: Pick<Website, 'configuration'>): Required<
  Pick<DrivingConfig, 'classDuration' | 'advanceBookingDays' | 'bookingCutoffHour' | 'dailyCodeEnabled'>
> & DrivingConfig {
  const cfg = (website.configuration ?? {}) as DrivingConfig;
  return {
    ...cfg,
    classDuration: clamp(cfg.classDuration ?? DEFAULTS.classDuration, 15, 240),
    advanceBookingDays: clamp(cfg.advanceBookingDays ?? DEFAULTS.advanceBookingDays, 1, 90),
    bookingCutoffHour: clamp(cfg.bookingCutoffHour ?? DEFAULTS.bookingCutoffHour, 0, 23),
    dailyCodeEnabled: cfg.dailyCodeEnabled ?? DEFAULTS.dailyCodeEnabled,
    breakTimes: cfg.breakTimes ?? [],
    restMinutes: cfg.restMinutes ?? 0,
  };
}

/** Get a day's open/close, or null if closed that weekday. */
export function getDayHours(
  settings: Pick<SiteSettings, 'businessHours'> | null,
  date: Date
): { open: string; close: string } | null {
  const hours = (settings?.businessHours ?? {}) as BusinessHours;
  const key = weekdayKey(date);
  const day = hours[key];
  if (!day) {
    // No configuration → default open window so the product works out of the box.
    return { open: DEFAULTS.open, close: DEFAULTS.close };
  }
  if (!day.isOpen) return null;
  return { open: day.open || DEFAULTS.open, close: day.close || DEFAULTS.close };
}

/** Booked "HH:MM" times for a website on a given UTC-midnight date (non-cancelled). */
export async function listBookedTimes(websiteId: string, date: Date): Promise<Booking[]> {
  return prisma.booking.findMany({
    where: { websiteId, bookingDate: date, status: { not: 'CANCELLED' } },
    orderBy: { bookingTime: 'asc' },
  });
}

export interface DayScheduleSlot {
  time: string;
  booked: boolean;
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
  bookingId?: string;
}

export interface DaySchedule {
  date: string;
  isOpen: boolean;
  open: string | null;
  close: string | null;
  slots: DayScheduleSlot[];
  bookedCount: number;
  emptyCount: number;
  total: number;
}

/**
 * Build the full schedule for a day: every slot from open→close, each marked
 * booked (with student details) or free. Used by daily-report + teacher report.
 */
export async function buildDaySchedule(
  website: Pick<Website, 'id' | 'configuration'>,
  settings: Pick<SiteSettings, 'businessHours'> | null,
  date: Date
): Promise<DaySchedule> {
  const cfg = normalizeConfig(website);
  const hours = getDayHours(settings, date);
  const dateStr = date.toISOString().slice(0, 10);

  if (!hours) {
    return { date: dateStr, isOpen: false, open: null, close: null, slots: [], bookedCount: 0, emptyCount: 0, total: 0 };
  }

  const bookings = await listBookedTimes(website.id, date);
  const bookingByTime = new Map(bookings.map((b) => [b.bookingTime, b]));

  // All possible slots (ignore booked when generating, so we can show them as taken)
  const allTimes = generateTimeSlots({
    open: hours.open,
    close: hours.close,
    classDuration: cfg.classDuration,
    breakTimes: (cfg.breakTimes as BreakTime[]) ?? [],
    restMinutes: cfg.restMinutes,
  });

  const slots: DayScheduleSlot[] = allTimes.map((time) => {
    const b = bookingByTime.get(time);
    if (b) {
      return {
        time,
        booked: true,
        studentName: b.customerName,
        studentEmail: b.customerEmail,
        studentPhone: b.customerPhone ?? undefined,
        bookingId: b.id,
      };
    }
    return { time, booked: false };
  });

  const bookedCount = slots.filter((s) => s.booked).length;
  return {
    date: dateStr,
    isOpen: true,
    open: hours.open,
    close: hours.close,
    slots,
    bookedCount,
    emptyCount: slots.length - bookedCount,
    total: slots.length,
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

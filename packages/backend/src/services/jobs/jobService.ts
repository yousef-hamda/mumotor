import cron from 'node-cron';
import type { Website, SiteSettings, User, ClientEnrollment } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { env } from '../../config/env.js';
import { nowInZone, parseTimeToMinutes, toUtcMidnight, todayUtcMidnight } from '../../utils/time.js';
import { buildDaySchedule, ensureDailyCode, normalizeConfig } from '../scheduling/schedulingService.js';
import {
  sendBookingReminder,
  sendDailyBookingOpen,
  sendEnhancedDailyReport,
  sendReviewRequest,
  siteBrand,
} from '../email/emailService.js';

const REMINDER_WINDOW_MINUTES = 120; // ~2h before the lesson
const REVIEW_REQUEST_DELAY_MINUTES = 60; // ask ~1h after the lesson ended
const REVIEW_REQUEST_MAX_AGE_DAYS = 3; // never chase lessons older than this

/** Combine a UTC-midnight date + "HH:MM" into a Date (interpreted in UTC). */
function lessonDateTime(date: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(date);
  d.setUTCHours(h || 0, m || 0, 0, 0);
  return d;
}

/** UTC-midnight date of tomorrow. */
function tomorrowUtcMidnight(): Date {
  const t = todayUtcMidnight();
  t.setUTCDate(t.getUTCDate() + 1);
  return t;
}

/** Every 15 min: email students ~2h before their lesson, set reminderSent. */
export async function processBookingReminders(): Promise<number> {
  const today = todayUtcMidnight();
  const now = new Date();
  const candidates = await prisma.booking.findMany({
    where: { bookingDate: today, reminderSent: false, status: { in: ['CONFIRMED', 'PENDING'] } },
    include: { website: true },
  });

  let sent = 0;
  for (const b of candidates) {
    const start = lessonDateTime(b.bookingDate, b.bookingTime);
    const minutesUntil = (start.getTime() - now.getTime()) / 60000;
    if (minutesUntil > 0 && minutesUntil <= REMINDER_WINDOW_MINUTES) {
      const ok = await sendBookingReminder(b.customerEmail, {
        studentName: b.customerName,
        date: b.bookingDate.toISOString().slice(0, 10),
        time: b.bookingTime,
        brand: siteBrand(b.website),
      });
      if (ok) {
        await prisma.booking.update({ where: { id: b.id }, data: { reminderSent: true } });
        sent++;
      }
    }
  }
  if (sent) logger.info(`Reminders: sent ${sent}`);
  return sent;
}

/** Every 15 min: ask students for a review ~1h after their lesson ended. */
export async function processReviewRequests(): Promise<number> {
  const today = todayUtcMidnight();
  const oldest = new Date(today);
  oldest.setUTCDate(oldest.getUTCDate() - REVIEW_REQUEST_MAX_AGE_DAYS);
  const now = new Date();

  const candidates = await prisma.booking.findMany({
    where: {
      reviewRequestSent: false,
      status: 'CONFIRMED',
      bookingDate: { lte: today, gte: oldest },
    },
    include: { website: { select: { slug: true, name: true, configuration: true, status: true } } },
  });

  let sent = 0;
  for (const b of candidates) {
    const end = lessonDateTime(b.bookingDate, b.bookingTime);
    end.setUTCMinutes(end.getUTCMinutes() + b.duration + REVIEW_REQUEST_DELAY_MINUTES);
    if (now < end) continue; // lesson not long enough over yet
    if (b.website.status !== 'PUBLISHED') {
      // Unpublished site — mark handled so we don't rescan forever.
      await prisma.booking.update({ where: { id: b.id }, data: { reviewRequestSent: true } });
      continue;
    }
    const ok = await sendReviewRequest(b.customerEmail, {
      studentName: b.customerName,
      reviewUrl: `${env.FRONTEND_URL}/p/${b.website.slug}/review`,
      brand: siteBrand(b.website),
    });
    if (ok) {
      await prisma.booking.update({ where: { id: b.id }, data: { reviewRequestSent: true } });
      sent++;
    }
  }
  if (sent) logger.info(`Review requests: sent ${sent}`);
  return sent;
}

// ── Per-site senders (reused by the tick + the all-sites wrappers) ──────────────

type SiteForBookingOpen = Pick<Website, 'slug' | 'name' | 'configuration'> & {
  enrollments: Pick<ClientEnrollment, 'studentEmail' | 'studentName'>[];
};

/** Email every ACTIVE student of one site that booking is open for tomorrow. */
async function sendBookingOpenForSite(site: SiteForBookingOpen): Promise<number> {
  const forDate = tomorrowUtcMidnight().toISOString().slice(0, 10);
  const bookingUrl = `${env.FRONTEND_URL}/p/${site.slug}/book-lesson`;
  const brand = siteBrand(site);
  let sent = 0;
  for (const student of site.enrollments) {
    const ok = await sendDailyBookingOpen(student.studentEmail, {
      studentName: student.studentName,
      bookingUrl,
      forDate,
      brand,
    });
    if (ok) sent++;
  }
  return sent;
}

type SiteForReport = Pick<Website, 'id' | 'name' | 'configuration'> & { user: Pick<User, 'email' | 'name'> };

/** Email one teacher their full, ordered schedule for tomorrow. */
async function sendReportForSite(
  site: SiteForReport,
  settings: Pick<SiteSettings, 'businessHours'> | null
): Promise<boolean> {
  const schedule = await buildDaySchedule(site, settings, tomorrowUtcMidnight());
  return sendEnhancedDailyReport(site.user.email, {
    teacherName: site.user.name,
    date: schedule.date,
    slots: schedule.slots.map((s) => ({
      time: s.time,
      booked: s.booked,
      studentName: s.studentName,
      studentPhone: s.studentPhone,
    })),
    booked: schedule.bookedCount,
    empty: schedule.emptyCount,
    total: schedule.total,
    brand: siteBrand(site),
  });
}

// ── All-sites wrappers (used by the manual test/cron-check.ts harness) ──────────

/** Notify every ACTIVE student of every published school (ignores per-site timing). */
export async function processDailyStudentNotifications(): Promise<number> {
  const websites = await prisma.website.findMany({
    where: { businessCategory: 'DRIVING_SCHOOL', status: 'PUBLISHED' },
    include: { enrollments: { where: { status: 'ACTIVE' } } },
  });
  let sent = 0;
  for (const site of websites) sent += await sendBookingOpenForSite(site);
  if (sent) logger.info(`Daily student notifications: sent ${sent}`);
  return sent;
}

/** Email every teacher tomorrow's schedule (ignores per-site timing). */
export async function processTeacherDailyReport(): Promise<number> {
  const websites = await prisma.website.findMany({
    where: { businessCategory: 'DRIVING_SCHOOL', status: 'PUBLISHED' },
    include: { settings: true, user: true },
  });
  let sent = 0;
  for (const site of websites) {
    const ok = await sendReportForSite(site, site.settings);
    if (ok) sent++;
  }
  if (sent) logger.info(`Teacher daily reports: sent ${sent}`);
  return sent;
}

// ── Per-teacher daily rhythm (each site fires at its own chosen time) ───────────

function sameDay(a: Date | null | undefined, b: Date): boolean {
  return !!a && a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

/** Stamp a once-per-day send marker on the site's settings row (upsert = may not exist). */
async function markSent(
  websiteId: string,
  data: { lastBookingOpenSentOn?: Date; lastReportSentOn?: Date }
): Promise<void> {
  await prisma.siteSettings.upsert({
    where: { websiteId },
    update: data,
    create: { websiteId, ...data },
  });
}

/**
 * Runs every 5 minutes. For each published driving school, honour the teacher's
 * OWN chosen times (in APP_TIMEZONE wall-clock):
 *  - at/after bookingWindowStart → ensure today's daily code exists + email active
 *    students that booking is open (once per day).
 *  - at/after reportTime → email the teacher tomorrow's ordered schedule (once per day).
 * "Fire at/after the chosen time + per-day date guard" makes it idempotent and
 * self-healing if a tick is missed (e.g. a restart).
 */
export async function processDailyRhythmTick(): Promise<{ codes: number; bookingOpen: number; reports: number }> {
  const { ymd, hhmm } = nowInZone(env.APP_TIMEZONE);
  const today = toUtcMidnight(ymd);
  const nowMin = parseTimeToMinutes(hhmm);

  const sites = await prisma.website.findMany({
    where: { businessCategory: 'DRIVING_SCHOOL', status: 'PUBLISHED' },
    include: { settings: true, user: true, enrollments: { where: { status: 'ACTIVE' } } },
  });

  let codes = 0;
  let bookingOpen = 0;
  let reports = 0;

  for (const site of sites) {
    const cfg = normalizeConfig(site);

    // Booking opens for the day → daily code + "booking is open" emails.
    if (nowMin >= parseTimeToMinutes(cfg.bookingWindowStart) && !sameDay(site.settings?.lastBookingOpenSentOn, today)) {
      if (cfg.dailyCodeEnabled) {
        await ensureDailyCode(site.id, today);
        codes++;
      }
      bookingOpen += await sendBookingOpenForSite(site);
      await markSent(site.id, { lastBookingOpenSentOn: today });
    }

    // Report time → teacher gets tomorrow's ordered schedule.
    if (nowMin >= parseTimeToMinutes(cfg.reportTime) && !sameDay(site.settings?.lastReportSentOn, today)) {
      const ok = await sendReportForSite(site, site.settings);
      if (ok) reports++;
      await markSent(site.id, { lastReportSentOn: today });
    }
  }

  if (codes || bookingOpen || reports) {
    logger.info(`Daily rhythm: codes=${codes} bookingOpen=${bookingOpen} reports=${reports}`);
  }
  return { codes, bookingOpen, reports };
}

let started = false;
export function startCronJobs() {
  if (!env.ENABLE_CRON) {
    logger.info('Cron jobs disabled (ENABLE_CRON=false)');
    return;
  }
  if (started) return;
  started = true;

  // ~2h-before lesson reminders + ~1h-after review requests
  cron.schedule('*/15 * * * *', () => {
    processBookingReminders().catch((e) => logger.error('reminder job failed', e));
    processReviewRequests().catch((e) => logger.error('review request job failed', e));
  });
  // Every 5 min: per-teacher booking-open email + teacher report at each site's chosen time
  cron.schedule('*/5 * * * *', () => {
    processDailyRhythmTick().catch((e) => logger.error('daily rhythm tick failed', e));
  });

  logger.info('Cron jobs scheduled (reminders */15m, daily rhythm */5m)');
}

import cron from 'node-cron';
import type { Website, SiteSettings, User, ClientEnrollment } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { env, isProd } from '../../config/env.js';
import { canAcceptPayment } from '../../lib/stripe.js';
import {
  nowInZone,
  parseTimeToMinutes,
  toUtcMidnight,
  appTodayUtcMidnight,
  appTomorrowUtcMidnight,
  minutesUntilLessonInZone,
} from '../../utils/time.js';
import { buildDaySchedule, ensureDailyCode, getDayHours, normalizeConfig } from '../scheduling/schedulingService.js';
import {
  sendBookingReminder,
  sendDailyBookingOpen,
  sendEnhancedDailyReport,
  sendReviewRequest,
  sendTrialExpired,
  siteBrand,
} from '../email/emailService.js';
import { emailLocale } from '../email/strings.js';
import { freezeUserSites } from '../billing/siteFreeze.js';
import { unsubscribeUrl } from '../../utils/unsubscribe.js';
import { WEBSITE_PRICE } from '../billing/accountState.js';

const REMINDER_WINDOW_MINUTES = 120; // ~2h before the lesson
const REVIEW_REQUEST_DELAY_MINUTES = 60; // ask ~1h after the lesson ended
const REVIEW_REQUEST_MAX_AGE_DAYS = 3; // never chase lessons older than this

/**
 * The ONLY Website columns any job here needs (E-01).
 *
 * These jobs used to load whole Website rows (`include: { website: true }`), which drags
 * `publishedHtml` — the full generated page — into memory for every site, every tick,
 * to read an email address and a set of opening hours. Selecting explicitly keeps a tick
 * proportional to the work instead of to the size of everyone's website.
 *
 * `configuration` is needed (normalizeConfig + siteBrand read it) and is now genuinely
 * small: the duplicated page HTML was removed from it in migration
 * 20260730120000_drop_duplicated_generated_html. Never re-add a large value to it.
 */
const SITE_JOB_FIELDS = {
  id: true,
  slug: true,
  name: true,
  configuration: true,
  locale: true,
  status: true,
} as const;

/** Every 15 min: email students ~2h before their lesson, set reminderSent. */
export async function processBookingReminders(): Promise<number> {
  const today = appTodayUtcMidnight(env.APP_TIMEZONE);
  const candidates = await prisma.booking.findMany({
    where: { bookingDate: today, reminderSent: false, status: { in: ['CONFIRMED', 'PENDING'] } },
    select: {
      id: true,
      customerEmail: true,
      customerName: true,
      bookingDate: true,
      bookingTime: true,
      website: { select: SITE_JOB_FIELDS },
    },
  });

  let sent = 0;
  for (const b of candidates) {
    try {
      // Wall-clock minutes until the lesson (Israel local), NOT a UTC-instant diff.
      const minutesUntil = minutesUntilLessonInZone(b.bookingDate, b.bookingTime, env.APP_TIMEZONE);
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
    } catch (e) {
      // Isolate a bad row so it can't starve the rest of this tick.
      logger.error(`reminder failed for booking ${b.id}`, e);
    }
  }
  if (sent) logger.info(`Reminders: sent ${sent}`);
  return sent;
}

/** Every 15 min: ask students for a review ~1h after their lesson ended. */
export async function processReviewRequests(): Promise<number> {
  const today = appTodayUtcMidnight(env.APP_TIMEZONE);
  const oldest = new Date(today);
  oldest.setUTCDate(oldest.getUTCDate() - REVIEW_REQUEST_MAX_AGE_DAYS);

  const candidates = await prisma.booking.findMany({
    where: {
      reviewRequestSent: false,
      status: 'CONFIRMED',
      bookingDate: { lte: today, gte: oldest },
    },
    select: {
      id: true,
      websiteId: true,
      customerEmail: true,
      customerName: true,
      bookingDate: true,
      bookingTime: true,
      duration: true,
      website: { select: { slug: true, name: true, configuration: true, status: true, locale: true } },
    },
  });

  // Bookings key on the email snapshot, not on the enrollment, so resolve the opt-out for
  // every candidate in one query instead of one per booking.
  const subs = await prisma.clientEnrollment.findMany({
    where: {
      websiteId: { in: [...new Set(candidates.map((b) => b.websiteId))] },
      studentEmail: { in: [...new Set(candidates.map((b) => b.customerEmail))] },
    },
    select: { id: true, websiteId: true, studentEmail: true, unsubscribedAt: true },
  });
  const subFor = new Map(subs.map((e) => [`${e.websiteId}|${e.studentEmail}`, e]));

  let sent = 0;
  for (const b of candidates) {
    try {
      // Minutes since the lesson ENDED, in Israel wall-clock time.
      const minutesSinceEnd = -minutesUntilLessonInZone(b.bookingDate, b.bookingTime, env.APP_TIMEZONE) - b.duration;
      if (minutesSinceEnd < REVIEW_REQUEST_DELAY_MINUTES) continue; // not long enough over yet
      if (b.website.status !== 'PUBLISHED') {
        // Unpublished site — mark handled so we don't rescan forever.
        await prisma.booking.update({ where: { id: b.id }, data: { reviewRequestSent: true } });
        continue;
      }
      // A review request is a solicitation, not something the student needs, so it counts
      // as bulk mail: it honours the opt-out and carries an unsubscribe link (A-02).
      const sub = subFor.get(`${b.websiteId}|${b.customerEmail}`);
      if (sub?.unsubscribedAt) {
        // Mark handled so this booking is not rescanned every 15 minutes forever.
        await prisma.booking.update({ where: { id: b.id }, data: { reviewRequestSent: true } });
        continue;
      }
      const ok = await sendReviewRequest(b.customerEmail, {
        studentName: b.customerName,
        reviewUrl: `${env.FRONTEND_URL}/p/${b.website.slug}/review`,
        brand: siteBrand(b.website),
        unsubscribeUrl: sub ? unsubscribeUrl(sub.id) : undefined,
      });
      if (ok) {
        await prisma.booking.update({ where: { id: b.id }, data: { reviewRequestSent: true } });
        sent++;
      }
    } catch (e) {
      logger.error(`review request failed for booking ${b.id}`, e);
    }
  }
  if (sent) logger.info(`Review requests: sent ${sent}`);
  return sent;
}

// ── Per-site senders (reused by the tick + the all-sites wrappers) ──────────────

type SiteForBookingOpen = Pick<Website, 'slug' | 'name' | 'configuration' | 'locale'> & {
  settings: Pick<SiteSettings, 'businessHours'> | null;
  enrollments: Pick<ClientEnrollment, 'id' | 'studentEmail' | 'studentName' | 'unsubscribedAt'>[];
};

/** Email every ACTIVE student of one site that booking is open for tomorrow. */
async function sendBookingOpenForSite(site: SiteForBookingOpen): Promise<number> {
  const tomorrow = appTomorrowUtcMidnight(env.APP_TIMEZONE);
  // Don't tell students "booking is open" when the school is closed tomorrow — they'd
  // land on "No classes tomorrow". Skip the blast entirely on a closed day.
  if (!getDayHours(site.settings ?? null, tomorrow)) return 0;
  const forDate = tomorrow.toISOString().slice(0, 10);
  const bookingUrl = `${env.FRONTEND_URL}/p/${site.slug}/book-lesson`;
  const brand = siteBrand(site);
  let sent = 0;
  for (const student of site.enrollments) {
    // Honour the opt-out (A-02). This is the highest-volume send in the product and the
    // main spam-complaint risk, so it is the one that most needs to stop when asked.
    if (student.unsubscribedAt) continue;
    const ok = await sendDailyBookingOpen(student.studentEmail, {
      studentName: student.studentName,
      bookingUrl,
      forDate,
      brand,
      unsubscribeUrl: unsubscribeUrl(student.id),
    });
    if (ok) sent++;
  }
  return sent;
}

type SiteForReport = Pick<Website, 'id' | 'name' | 'configuration' | 'locale'> & { user: Pick<User, 'email' | 'name'> };

/** Email one teacher their full, ordered schedule for tomorrow. */
async function sendReportForSite(
  site: SiteForReport,
  settings: Pick<SiteSettings, 'businessHours'> | null
): Promise<boolean> {
  const schedule = await buildDaySchedule(site, settings, appTomorrowUtcMidnight(env.APP_TIMEZONE));
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
    select: {
      ...SITE_JOB_FIELDS,
      settings: { select: { businessHours: true } },
      enrollments: {
        where: { status: 'ACTIVE' },
        select: { id: true, studentEmail: true, studentName: true, unsubscribedAt: true },
      },
    },
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
    select: {
      ...SITE_JOB_FIELDS,
      settings: { select: { businessHours: true } },
      user: { select: { email: true, name: true } },
    },
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
    select: {
      ...SITE_JOB_FIELDS,
      settings: {
        select: { businessHours: true, lastBookingOpenSentOn: true, lastReportSentOn: true },
      },
      user: { select: { email: true, name: true } },
      enrollments: {
        where: { status: 'ACTIVE' },
        select: { id: true, studentEmail: true, studentName: true, unsubscribedAt: true },
      },
    },
  });

  let codes = 0;
  let bookingOpen = 0;
  let reports = 0;

  for (const site of sites) {
    try {
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
    } catch (e) {
      // One misconfigured site must not starve every site after it in this tick.
      logger.error(`daily rhythm failed for site ${site.id}`, e);
    }
  }

  if (codes || bookingOpen || reports) {
    logger.info(`Daily rhythm: codes=${codes} bookingOpen=${bookingOpen} reports=${reports}`);
  }
  return { codes, bookingOpen, reports };
}

/**
 * Freeze accounts whose free month has lapsed: for each FREE subscription past
 * its trialEndsAt that hasn't been handled yet, suspend the teacher's live
 * site(s), email them (once) that the trial is over, and stamp the guard so we
 * never re-freeze or re-email. Data is never deleted — the site is only paused.
 */
export async function processExpiredTrials(): Promise<number> {
  // FAIL-SAFE: never freeze an account that has no way to pay. In production with no
  // Stripe price configured, POST /subscriptions/checkout returns 503 — so freezing
  // would take the teacher's site down, lock their dashboard, and point them at a
  // Subscribe button that cannot work. We return BEFORE any write (no freeze, no
  // email, no trialExpiredNotifiedAt stamp) so that once billing is configured these
  // same accounts are picked up and handled normally on the next tick.
  if (isProd && !canAcceptPayment) {
    logger.warn(
      'Trial expiry skipped: billing is not configured (no Stripe price id), so an expired ' +
        'account could not pay to get its site back. Set STRIPE_SECRET_KEY + a STRIPE_PRICE_* to enable.'
    );
    return 0;
  }

  const now = new Date();
  const expired = await prisma.subscription.findMany({
    where: {
      plan: 'FREE',
      trialEndsAt: { not: null, lt: now },
      trialExpiredNotifiedAt: null,
    },
    include: { user: { select: { id: true, email: true, name: true, preferredLanguage: true } } },
  });

  let handled = 0;
  for (const sub of expired) {
    try {
      const frozen = await freezeUserSites(sub.userId);
      await sendTrialExpired(sub.user.email, {
        name: sub.user.name,
        billingUrl: `${env.FRONTEND_URL}/dashboard/billing`,
        price: WEBSITE_PRICE,
        locale: emailLocale(sub.user.preferredLanguage),
      });
      // Mark handled + reflect the lapsed state on the subscription row.
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { trialExpiredNotifiedAt: now, status: 'CANCELED' },
      });
      handled++;
      if (frozen) logger.info(`Trial expired: froze ${frozen} site(s) for ${sub.user.email}`);
    } catch (e) {
      logger.error(`trial-expiry handling failed for user ${sub.userId}`, e);
    }
  }
  if (handled) logger.info(`Trial expirations processed: ${handled}`);
  return handled;
}

let started = false;
export function startCronJobs() {
  if (!env.ENABLE_CRON) {
    logger.info('Cron jobs disabled (ENABLE_CRON=false)');
    return;
  }
  if (started) return;
  started = true;

  // ~2h-before lesson reminders + ~1h-after review requests.
  // noOverlap: if a tick runs long (many emails), the next tick is skipped rather
  // than starting concurrently and re-sending the same not-yet-marked rows.
  cron.schedule(
    '*/15 * * * *',
    () => {
      processBookingReminders().catch((e) => logger.error('reminder job failed', e));
      processReviewRequests().catch((e) => logger.error('review request job failed', e));
    },
    { noOverlap: true }
  );
  // Every 5 min: per-teacher booking-open email + teacher report at each site's chosen time
  cron.schedule(
    '*/5 * * * *',
    () => {
      processDailyRhythmTick().catch((e) => logger.error('daily rhythm tick failed', e));
    },
    { noOverlap: true }
  );

  // Hourly: freeze accounts whose free month has ended + email them once.
  cron.schedule(
    '17 * * * *',
    () => {
      processExpiredTrials().catch((e) => logger.error('trial-expiry job failed', e));
    },
    { noOverlap: true }
  );

  logger.info('Cron jobs scheduled (reminders */15m, daily rhythm */5m, trial-expiry hourly)');
}

import { Router, type Request, type Response, type NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Prisma, Website, SiteSettings } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { verifyToken, requireStudent, signStudentToken } from '../middleware/auth.js';
import { requireActiveAccount } from '../middleware/requireActiveAccount.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError, badRequest, conflict, forbidden, notFound, unauthorized } from '../utils/errors.js';
import { verifyGoogleIdToken } from '../services/auth/googleAuth.js';
import {
  hashEnrollmentCode,
  timingSafeEqualStr,
} from '../utils/crypto.js';
import {
  diffDaysUtc,
  generateTimeSlots,
  nowInZone,
  parseTimeToMinutes,
  appTodayUtcMidnight,
  appTomorrowUtcMidnight,
  toUtcMidnight,
  type BreakTime,
} from '../utils/time.js';
import {
  buildDaySchedule,
  ensureDailyCode,
  getDayHours,
  normalizeConfig,
} from '../services/scheduling/schedulingService.js';
import { hhmm, weekdayHoursSchema } from '../utils/validation.js';
import { consumeMagicToken, generateMagicToken } from '../services/auth/magicLinkService.js';
import { createNotification } from '../services/notifications/notificationService.js';
import { logEvent } from '../services/analytics.js';
import { unsubscribeUrl } from '../utils/unsubscribe.js';
import {
  sendBulkCustomEmail,
  sendBookingCancelled,
  sendBookingConfirmation,
  sendTeacherNewBooking,
  sendEnhancedDailyReport,
  sendMagicLink,
  sendWelcomeEnrollment,
  siteBrand,
} from '../services/email/emailService.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

const router = Router();

type WebsiteWithSettings = Website & { settings: SiteSettings | null };
const getWebsite = (res: Response): WebsiteWithSettings => res.locals.website;

// --- ownership middleware (teacher routes) ---------------------------------
const requireOwnership = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const website = await prisma.website.findUnique({
    where: { id: req.params.websiteId },
    include: { settings: true },
  });
  if (!website) throw notFound('Website not found');
  if (website.userId !== req.user!.id) throw forbidden('You do not own this website');
  res.locals.website = website;
  next();
});

const teacher = [verifyToken, requireOwnership, requireActiveAccount];

const normalizeEmail = (e: string) => e.trim().toLowerCase();

// get-or-create the single "Driving Lesson" service
async function getOrCreateLessonService(
  tx: Prisma.TransactionClient,
  websiteId: string,
  duration: number
) {
  const existing = await tx.service.findFirst({ where: { websiteId, name: 'Driving Lesson' } });
  if (existing) return existing;
  return tx.service.create({ data: { websiteId, name: 'Driving Lesson', duration, price: 0 } });
}

// ===========================================================================
// PUBLIC — static paths first (avoid param-route capture)
// ===========================================================================

const enrollSchema = z.object({
  websiteId: z.string().uuid(),
  enrollmentCode: z.string().min(1).max(64),
  studentName: z.string().min(1).max(120),
  studentEmail: z.string().email(),
  // Phone is required at self-enroll — the teacher needs it for lesson coordination.
  studentPhone: z.string().regex(/^[+\d][\d\s-]{6,18}$/, 'A valid phone number is required'),
});

// POST /driving-school/enroll
router.post(
  '/enroll',
  rateLimit({ keyPrefix: 'enroll', windowSeconds: 60, max: 5 }),
  asyncHandler(async (req, res) => {
    const data = enrollSchema.parse(req.body);
    const email = normalizeEmail(data.studentEmail);
    const submitted = data.enrollmentCode.trim();

    const website = await prisma.website.findUnique({ where: { id: data.websiteId } });
    if (!website || website.status !== 'PUBLISHED') throw notFound('Driving school not found');

    const cfg = normalizeConfig(website);

    // (a) static code, then (b) today's daily code — both timing-safe
    let valid = false;
    if (cfg.enrollmentCode && cfg.enrollmentCode.length >= 4) {
      valid = timingSafeEqualStr(submitted, cfg.enrollmentCode);
    }
    if (!valid && cfg.dailyCodeEnabled) {
      const today = appTodayUtcMidnight(env.APP_TIMEZONE);
      const daily = await prisma.dailyCode.findUnique({
        where: { websiteId_date: { websiteId: website.id, date: today } },
      });
      if (daily && daily.isActive) {
        valid = timingSafeEqualStr(submitted.toUpperCase(), daily.code.toUpperCase());
      }
    }
    if (!valid) throw unauthorized('Invalid enrollment code', 'INVALID_CODE');

    const existing = await prisma.clientEnrollment.findUnique({
      where: { websiteId_studentEmail: { websiteId: website.id, studentEmail: email } },
    });
    if (existing) throw conflict('You are already enrolled with this email', 'ALREADY_ENROLLED');

    let enrollment;
    try {
      enrollment = await prisma.clientEnrollment.create({
        data: {
          websiteId: website.id,
          studentName: data.studentName.trim(),
          studentEmail: email,
          studentPhone: data.studentPhone,
          enrollmentCode: hashEnrollmentCode(submitted),
          status: 'ACTIVE',
        },
      });
    } catch (err) {
      // Concurrent enroll with the same email raced past the check above → friendly 409.
      if ((err as { code?: string }).code === 'P2002') throw conflict('You are already enrolled with this email', 'ALREADY_ENROLLED');
      throw err;
    }

    // fire-and-forget welcome email + teacher notification
    void sendWelcomeEnrollment(email, {
      studentName: enrollment.studentName,
      bookingUrl: `${env.FRONTEND_URL}/p/${website.slug}/book-lesson`,
      brand: siteBrand(website),
    });
    void createNotification(website.userId, {
      type: 'ENROLLMENT',
      title: 'New student enrolled',
      body: `${enrollment.studentName} (${email})`,
    });
    logEvent('enroll_completed', { props: { websiteId: website.id } });

    res.status(201).json({
      enrollment: {
        id: enrollment.id,
        studentName: enrollment.studentName,
        studentEmail: enrollment.studentEmail,
        status: enrollment.status,
      },
    });
  })
);

// POST /driving-school/validate-magic-link
router.post(
  '/validate-magic-link',
  rateLimit({ keyPrefix: 'magic-validate', windowSeconds: 60, max: 10 }),
  asyncHandler(async (req, res) => {
    const { token } = z.object({ token: z.string().min(1) }).parse(req.body);
    const payload = await consumeMagicToken(token);
    if (!payload) throw badRequest('Magic link is invalid or expired', 'MAGIC_INVALID');

    const enrollment = await prisma.clientEnrollment.findUnique({
      where: {
        websiteId_studentEmail: { websiteId: payload.websiteId, studentEmail: payload.email },
      },
      include: { website: { select: { slug: true, status: true } } },
    });
    if (!enrollment) throw notFound('Enrollment not found for this link', 'NOT_ENROLLED');
    // A frozen/unpublished site is offline for students too (SITE_PAUSED policy).
    if (enrollment.website.status !== 'PUBLISHED') throw forbidden('This site is currently paused.', 'SITE_PAUSED');

    res.json({
      email: enrollment.studentEmail,
      websiteId: enrollment.websiteId,
      websiteSlug: enrollment.website.slug,
      studentName: enrollment.studentName,
      studentPhone: enrollment.studentPhone,
      status: enrollment.status,
    });
  })
);

// ===========================================================================
// PUBLIC — param paths
// ===========================================================================

// GET /driving-school/:websiteSlug/public-settings  (by SLUG)
router.get(
  '/:websiteSlug/public-settings',
  asyncHandler(async (req, res) => {
    const website = await prisma.website.findUnique({
      where: { slug: req.params.websiteSlug },
      include: { settings: true, services: true },
    });
    if (!website) throw notFound('Driving school not found');
    // A frozen site (owner's free month lapsed) → return a themed "paused" marker
    // so the public page shows an on-brand "temporarily paused" screen, not an error.
    if (website.status === 'SUSPENDED') {
      const raw = (website.configuration ?? {}) as Record<string, unknown>;
      res.json({
        suspended: true,
        name: website.name,
        locale: website.locale ?? null,
        template: website.selectedPreset ?? (raw.templateChoice as string | undefined) ?? null,
        logoSrc: (raw.logoSrc as string | undefined) ?? null,
        customization: (raw.customization as Record<string, unknown> | undefined) ?? null,
      });
      return;
    }
    if (website.status !== 'PUBLISHED') throw notFound('Driving school not found');

    const cfg = normalizeConfig(website);
    const raw = (website.configuration ?? {}) as Record<string, unknown>;
    res.json({
      id: website.id,
      name: website.name,
      slug: website.slug,
      tagline: website.tagline,
      advanceBookingDays: cfg.advanceBookingDays ?? 1, // students book for the next day only
      bookingCutoffHour: cfg.bookingCutoffHour ?? 18,
      bookingWindowStart: cfg.bookingWindowStart,
      bookingWindowEnd: cfg.bookingWindowEnd,
      classDuration: cfg.classDuration,
      dailyCodeEnabled: cfg.dailyCodeEnabled,
      requiresStaticCode: Boolean(cfg.enrollmentCode && cfg.enrollmentCode.length >= 4),
      businessHours: website.settings?.businessHours ?? {},
      breakTimes: cfg.breakTimes ?? [],
      // presentation tokens for the public site
      teacherName: cfg.teacherName ?? null,
      pricePerClass: cfg.pricePerClass ?? null,
      experienceYears: cfg.experienceYears ?? null,
      passRate: cfg.passRate ?? null,
      services: website.services.map((s) => ({ name: s.name, duration: s.duration, price: s.price })),
      // template + branding tokens so the public site renders the chosen design with the teacher's data
      template: website.selectedPreset ?? (raw.templateChoice as string | undefined) ?? null,
      locale: website.locale ?? null,
      bio: (raw.bio as string | undefined) ?? null,
      experienceLevel: (raw.experienceLevel as string | undefined) ?? null,
      transmission: (raw.transmission as string | undefined) ?? null,
      plans: (raw.plans as unknown[] | undefined) ?? null,
      city: (raw.city as string | undefined) ?? null,
      logoSrc: (raw.logoSrc as string | undefined) ?? null,
      carPhoto: (raw.carPhoto as string | undefined) ?? null,
      instructorPhoto: (raw.instructorPhoto as string | undefined) ?? null,
      gallery: (raw.gallery as string[] | undefined) ?? null,
      contact: (raw.contact as Record<string, string> | undefined) ?? null,
      socialLinks: (raw.socialLinks as Record<string, string> | undefined) ?? null,
      customization: (raw.customization as Record<string, unknown> | undefined) ?? null,
    });
  })
);

// GET /driving-school/:websiteId/check-enrollment?email=
router.get(
  '/:websiteId/check-enrollment',
  rateLimit({ keyPrefix: 'check-enroll', windowSeconds: 60, max: 10 }),
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(String(req.query.email ?? '').slice(0, 200));
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw badRequest('Valid email required');

    const enrollment = await prisma.clientEnrollment.findUnique({
      where: { websiteId_studentEmail: { websiteId: req.params.websiteId, studentEmail: email } },
    });

    if (!enrollment) return res.json({ enrolled: false });
    // This endpoint is public and only gated by knowing an email. Return the two
    // booleans the booking flow needs (enrolled / active) but NOT the student's
    // name or fine-grained status — those were a PII/enumeration leak (H8).
    res.json({
      enrolled: true,
      active: enrollment.status === 'ACTIVE',
    });
  })
);

// GET /driving-school/:websiteId/public-availability?date=&email=
router.get(
  '/:websiteId/public-availability',
  rateLimit({ keyPrefix: 'availability', windowSeconds: 60, max: 20 }),
  asyncHandler(async (req, res) => {
    const date = String(req.query.date ?? '').slice(0, 32);
    const email = normalizeEmail(String(req.query.email ?? '').slice(0, 200));
    if (!/^\d{4}-\d{2}-\d{2}/.test(date)) throw badRequest('Valid date (YYYY-MM-DD) required');

    const website = await prisma.website.findUnique({
      where: { id: req.params.websiteId },
      include: { settings: true },
    });
    if (!website || website.status !== 'PUBLISHED') throw notFound('Driving school not found');

    // must be an enrolled, active student
    const enrollment = await prisma.clientEnrollment.findUnique({
      where: { websiteId_studentEmail: { websiteId: website.id, studentEmail: email } },
    });
    if (!enrollment) throw notFound('You are not enrolled', 'NOT_ENROLLED');
    if (enrollment.status !== 'ACTIVE') throw forbidden('Your enrollment is not active', 'ENROLLMENT_NOT_ACTIVE');

    const cfg = normalizeConfig(website);
    const bookingDate = toUtcMidnight(date);
    const today = appTodayUtcMidnight(env.APP_TIMEZONE);
    const diffDays = diffDaysUtc(today, bookingDate);

    if (diffDays < 0) return res.json({ date, slots: [], classDuration: cfg.classDuration });
    // Never offer slots the student couldn't actually book — mirror the
    // advance-booking cap enforced by POST /book-lesson (M5).
    if (diffDays > (cfg.advanceBookingDays ?? 1)) {
      return res.json({ date, slots: [], classDuration: cfg.classDuration });
    }

    const hours = getDayHours(website.settings, bookingDate);
    if (!hours) return res.json({ date, slots: [], classDuration: cfg.classDuration, closed: true });

    const booked = await prisma.booking.findMany({
      where: { websiteId: website.id, bookingDate, status: { not: 'CANCELLED' } },
      select: { bookingTime: true },
    });

    let slots = generateTimeSlots({
      open: hours.open,
      close: hours.close,
      classDuration: cfg.classDuration,
      bookedTimes: booked.map((b) => b.bookingTime),
      breakTimes: (cfg.breakTimes as BreakTime[]) ?? [],
      restMinutes: cfg.restMinutes,
    });

    // Mirror POST /book-lesson's same-day rules (app timezone wall-clock):
    // after the daily cutoff today is closed, and past times are never offered.
    if (diffDays === 0) {
      const nowMin = parseTimeToMinutes(nowInZone(env.APP_TIMEZONE).hhmm);
      if (nowMin >= (cfg.bookingCutoffHour ?? 18) * 60) {
        return res.json({ date, slots: [], classDuration: cfg.classDuration });
      }
      slots = slots.filter((s) => parseTimeToMinutes(s) > nowMin);
    }

    res.json({ date, slots, classDuration: cfg.classDuration });
  })
);

// POST /driving-school/:websiteId/book-lesson
const bookSchema = z.object({
  studentEmail: z.string().email().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  token: z.string().optional(),
});
router.post(
  '/:websiteId/book-lesson',
  rateLimit({ keyPrefix: 'book', windowSeconds: 60, max: 10 }),
  asyncHandler(async (req, res) => {
    const data = bookSchema.parse(req.body);
    const websiteId = req.params.websiteId;

    // resolve email from body or magic token
    let email = data.studentEmail ? normalizeEmail(data.studentEmail) : '';
    if (!email && data.token) {
      const payload = await consumeMagicToken(data.token);
      if (payload && payload.websiteId === websiteId) email = payload.email;
    }
    if (!email) throw badRequest('studentEmail (or a valid token) is required');

    const website = await prisma.website.findUnique({
      where: { id: websiteId },
      // The owner's email is needed to tell them a lesson was booked (D-11).
      include: { settings: true, user: { select: { email: true } } },
    });
    if (!website || website.status !== 'PUBLISHED') throw notFound('Driving school not found');

    const cfg = normalizeConfig(website);

    // Booking is only open during the teacher's chosen daily window (app timezone).
    // Default window is 00:00–23:59, so unconfigured/seeded sites are never gated.
    const nowMin = parseTimeToMinutes(nowInZone(env.APP_TIMEZONE).hhmm);
    if (nowMin < parseTimeToMinutes(cfg.bookingWindowStart) || nowMin > parseTimeToMinutes(cfg.bookingWindowEnd)) {
      throw badRequest('Booking is closed right now', 'BOOKING_WINDOW_CLOSED');
    }

    const bookingDate = toUtcMidnight(data.date);
    const today = appTodayUtcMidnight(env.APP_TIMEZONE);
    const diffDays = diffDaysUtc(today, bookingDate);

    if (diffDays < 0) throw badRequest('Cannot book a lesson in the past', 'PAST_DATE');
    if (diffDays > (cfg.advanceBookingDays ?? 1)) {
      throw badRequest(`You can only book up to ${cfg.advanceBookingDays} day(s) in advance`, 'ADVANCE_BOOKING_EXCEEDED');
    }
    if (diffDays === 0) {
      const nowMin = parseTimeToMinutes(nowInZone(env.APP_TIMEZONE).hhmm);
      if (nowMin >= (cfg.bookingCutoffHour ?? 18) * 60) {
        throw badRequest('Booking for today is closed', 'BOOKING_CUTOFF_PASSED');
      }
      // Can't book a time that has already passed today (app timezone wall-clock).
      if (parseTimeToMinutes(data.time) <= nowMin) {
        throw badRequest('That time has already passed', 'PAST_TIME');
      }
    }

    // the day must be open and the requested time a real slot
    const hours = getDayHours(website.settings, bookingDate);
    if (!hours) throw badRequest('The school is closed on this day', 'DAY_CLOSED');
    const validSlots = generateTimeSlots({
      open: hours.open,
      close: hours.close,
      classDuration: cfg.classDuration,
      breakTimes: (cfg.breakTimes as BreakTime[]) ?? [],
      restMinutes: cfg.restMinutes,
    });
    if (!validSlots.includes(data.time)) throw badRequest('That time is not a valid slot', 'SLOT_NOT_AVAILABLE');

    try {
      const booking = await prisma.$transaction(async (tx) => {
        const enrollment = await tx.clientEnrollment.findUnique({
          where: { websiteId_studentEmail: { websiteId, studentEmail: email } },
        });
        if (!enrollment) throw notFound('You are not enrolled', 'NOT_ENROLLED');
        if (enrollment.status !== 'ACTIVE') {
          throw forbidden('Your enrollment is not active', 'ENROLLMENT_NOT_ACTIVE');
        }

        const service = await getOrCreateLessonService(tx, websiteId, cfg.classDuration);

        const clash = await tx.booking.findFirst({
          where: { websiteId, bookingDate, bookingTime: data.time, status: { not: 'CANCELLED' } },
        });
        if (clash) throw conflict('That slot was just taken', 'SLOT_NOT_AVAILABLE');

        const created = await tx.booking.create({
          data: {
            websiteId,
            serviceId: service.id,
            customerName: enrollment.studentName,
            customerEmail: enrollment.studentEmail,
            customerPhone: enrollment.studentPhone,
            bookingDate,
            bookingTime: data.time,
            duration: cfg.classDuration,
            status: 'CONFIRMED',
            reminderSent: false,
          },
        });

        await tx.clientEnrollment.update({
          where: { id: enrollment.id },
          data: { classCount: { increment: 1 } },
        });

        return { created, enrollment };
      });

      // fire-and-forget confirmation + teacher notification
      void sendBookingConfirmation(email, {
        studentName: booking.enrollment.studentName,
        date: data.date,
        time: data.time,
        teacherName: cfg.teacherName,
        duration: cfg.classDuration,
        brand: siteBrand(website),
      });
      void createNotification(website.userId, {
        type: 'BOOKING',
        title: 'New lesson booked',
        body: `${booking.enrollment.studentName} — ${data.date} at ${data.time}`,
      });
      // Tell the TEACHER too (D-11). The in-dashboard notification above only reaches an
      // instructor who happens to be looking at the dashboard; an email reaches one who is
      // out teaching, which is the normal case.
      void sendTeacherNewBooking(website.user.email, {
        studentName: booking.enrollment.studentName,
        studentPhone: booking.enrollment.studentPhone,
        date: data.date,
        time: data.time,
        duration: cfg.classDuration,
        brand: siteBrand(website),
      });
      logEvent('booking_created', { props: { websiteId: website.id } });

      res.status(201).json({
        booking: {
          id: booking.created.id,
          date: data.date,
          time: data.time,
          duration: booking.created.duration,
          status: booking.created.status,
        },
      });
    } catch (err) {
      // Unique index race → friendly 409
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: string }).code === 'P2002'
      ) {
        throw conflict('That slot was just taken', 'SLOT_NOT_AVAILABLE');
      }
      throw err;
    }
  })
);

// POST /driving-school/:websiteId/daily-code/validate
router.post(
  '/:websiteId/daily-code/validate',
  rateLimit({ keyPrefix: 'daily-code', windowSeconds: 60, max: 10 }),
  asyncHandler(async (req, res) => {
    const { code, date } = z
      .object({ code: z.string().min(1), date: z.string().regex(/^\d{4}-\d{2}-\d{2}/) })
      .parse(req.body);

    const daily = await prisma.dailyCode.findUnique({
      where: { websiteId_date: { websiteId: req.params.websiteId, date: toUtcMidnight(date) } },
    });
    const valid = Boolean(daily?.isActive && timingSafeEqualStr(code.trim().toUpperCase(), daily.code.toUpperCase()));
    res.json({ valid });
  })
);

// POST /driving-school/:websiteId/request-magic-link  (bonus — emails a booking link)
router.post(
  '/:websiteId/request-magic-link',
  rateLimit({ keyPrefix: 'magic-req', windowSeconds: 60, max: 5 }),
  asyncHandler(async (req, res) => {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const normalized = normalizeEmail(email);

    const website = await prisma.website.findUnique({ where: { id: req.params.websiteId } });
    if (!website) throw notFound('Driving school not found');
    // A frozen/unpublished site must not send branded emails. Report success anyway
    // (never leak who is enrolled or the site's state) but send nothing.
    if (website.status !== 'PUBLISHED') return res.json({ sent: true });

    const enrollment = await prisma.clientEnrollment.findUnique({
      where: { websiteId_studentEmail: { websiteId: website.id, studentEmail: normalized } },
    });
    // Always return success to avoid leaking who is enrolled.
    if (enrollment && enrollment.status === 'ACTIVE') {
      try {
        const { url } = await generateMagicToken(normalized, website.id, website.slug);
        void sendMagicLink(normalized, { magicUrl: url, studentName: enrollment.studentName, brand: siteBrand(website) });
      } catch (e) {
        logger.warn('magic link send failed', (e as Error).message);
      }
    }
    res.json({ sent: true });
  })
);

// ===========================================================================
// TEACHER (auth + ownership)
// ===========================================================================

// GET /driving-school/:websiteId/settings
router.get(
  '/:websiteId/settings',
  ...teacher,
  asyncHandler(async (_req, res) => {
    const website = getWebsite(res);
    const cfg = normalizeConfig(website);
    res.json({
      enrollmentCode: cfg.enrollmentCode ?? '',
      classDuration: cfg.classDuration,
      advanceBookingDays: cfg.advanceBookingDays,
      bookingCutoffHour: cfg.bookingCutoffHour,
      bookingWindowStart: cfg.bookingWindowStart,
      bookingWindowEnd: cfg.bookingWindowEnd,
      reportTime: cfg.reportTime,
      dailyCodeEnabled: cfg.dailyCodeEnabled,
      breakTimes: cfg.breakTimes ?? [],
      restMinutes: cfg.restMinutes ?? 0,
      workingHours: website.settings?.businessHours ?? {},
      // presentation tokens
      teacherName: cfg.teacherName ?? '',
      pricePerClass: cfg.pricePerClass ?? null,
      experienceYears: cfg.experienceYears ?? null,
      passRate: cfg.passRate ?? null,
    });
  })
);

// PUT /driving-school/:websiteId/settings
const settingsSchema = z.object({
  enrollmentCode: z.string().max(64).optional(),
  classDuration: z.number().int().min(15).max(240).optional(),
  advanceBookingDays: z.number().int().min(1).max(90).optional(),
  bookingCutoffHour: z.number().int().min(0).max(23).optional(),
  // Strict HH:MM (00–23 : 00–59) — a loose /\d\d:\d\d/ accepted "24:30"/"99:99",
  // which silently broke the booking window / nightly report (parseTimeToMinutes
  // produced a value no real minute-of-day ever reaches).
  bookingWindowStart: hhmm.optional(),
  bookingWindowEnd: hhmm.optional(),
  reportTime: hhmm.optional(),
  dailyCodeEnabled: z.boolean().optional(),
  breakTimes: z.array(z.object({ start: hhmm, end: hhmm })).max(20).optional(),
  restMinutes: z.number().int().min(0).max(120).optional(),
  workingHours: weekdayHoursSchema.optional(),
  teacherName: z.string().max(120).optional(),
  // Nullable so the teacher can CLEAR these (send null) — not just set them (M13).
  pricePerClass: z.union([z.number().min(0), z.string().max(20)]).nullable().optional(),
  experienceYears: z.union([z.number().int().min(0).max(80), z.string().max(20)]).nullable().optional(),
  passRate: z.number().min(0).max(100).nullable().optional(),
}).superRefine((v, ctx) => {
  // The booking window must be a real forward interval, else students are locked out all day.
  if (v.bookingWindowStart && v.bookingWindowEnd && v.bookingWindowStart >= v.bookingWindowEnd) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['bookingWindowEnd'], message: 'bookingWindowEnd must be after bookingWindowStart' });
  }
});
router.put(
  '/:websiteId/settings',
  ...teacher,
  asyncHandler(async (req, res) => {
    const website = getWebsite(res);
    const data = settingsSchema.parse(req.body);
    const { workingHours, ...configFields } = data;

    // enrollmentCode must be >=4 chars if provided non-empty
    if (configFields.enrollmentCode && configFields.enrollmentCode.length > 0 && configFields.enrollmentCode.length < 4) {
      throw badRequest('Enrollment code must be at least 4 characters', 'CODE_TOO_SHORT');
    }

    const mergedConfig = { ...(website.configuration as object), ...configFields };

    const updated = await prisma.website.update({
      where: { id: website.id },
      data: {
        configuration: mergedConfig,
        ...(workingHours
          ? {
              settings: {
                upsert: {
                  create: { businessHours: workingHours },
                  update: { businessHours: workingHours },
                },
              },
            }
          : {}),
      },
      include: { settings: true },
    });

    const cfg = normalizeConfig(updated);
    res.json({
      enrollmentCode: cfg.enrollmentCode ?? '',
      classDuration: cfg.classDuration,
      advanceBookingDays: cfg.advanceBookingDays,
      bookingCutoffHour: cfg.bookingCutoffHour,
      bookingWindowStart: cfg.bookingWindowStart,
      bookingWindowEnd: cfg.bookingWindowEnd,
      reportTime: cfg.reportTime,
      dailyCodeEnabled: cfg.dailyCodeEnabled,
      breakTimes: cfg.breakTimes ?? [],
      restMinutes: cfg.restMinutes ?? 0,
      workingHours: updated.settings?.businessHours ?? {},
      teacherName: cfg.teacherName ?? '',
      pricePerClass: cfg.pricePerClass ?? null,
      experienceYears: cfg.experienceYears ?? null,
      passRate: cfg.passRate ?? null,
    });
  })
);

// GET /driving-school/:websiteId/students
router.get(
  '/:websiteId/students',
  ...teacher,
  asyncHandler(async (req, res) => {
    const website = getWebsite(res);
    const status = req.query.status ? String(req.query.status).toUpperCase() : undefined;
    // Cap the search string so it can't drive a huge LIKE scan / log-bloat.
    const search = req.query.search ? String(req.query.search).trim().slice(0, 100) : '';
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

    const where: Prisma.ClientEnrollmentWhereInput = { websiteId: website.id };
    if (status && ['ACTIVE', 'INACTIVE', 'COMPLETED'].includes(status)) {
      where.status = status as Prisma.ClientEnrollmentWhereInput['status'];
    }
    if (search) {
      where.OR = [
        { studentName: { contains: search, mode: 'insensitive' } },
        { studentEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.clientEnrollment.findMany({
        where,
        orderBy: { enrolledAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          studentName: true,
          studentEmail: true,
          studentPhone: true,
          status: true,
          classCount: true,
          notes: true,
          enrolledAt: true,
          finishedAt: true,
        },
      }),
      prisma.clientEnrollment.count({ where }),
    ]);

    // Show the honest, non-cancelled lesson count (not the double-counting column).
    const counts = await nonCancelledCountsByEmail(
      website.id,
      students.map((s) => s.studentEmail)
    );
    const withCounts = students.map((s) => ({ ...s, classCount: counts.get(s.studentEmail) ?? 0 }));

    res.json({ students: withCounts, total, page, limit, totalPages: Math.ceil(total / limit) });
  })
);

// POST /driving-school/:websiteId/students  (teacher adds a student manually — no code needed)
const addStudentSchema = z.object({
  studentName: z.string().min(1).max(120),
  studentEmail: z.string().email(),
  // Phone is required — the teacher needs it for lesson coordination, same as self-enroll.
  studentPhone: z.string().regex(/^[+\d][\d\s-]{6,18}$/, 'A valid phone number is required'),
  notes: z.string().max(1000).optional(),
});
router.post(
  '/:websiteId/students',
  ...teacher,
  // Sends a welcome email to an attacker-chosen address — cap per site so a stolen
  // teacher token can't email-bomb third parties.
  rateLimit({ keyPrefix: 'add-student', windowSeconds: 3600, max: 60, keyFn: (req) => req.params.websiteId }),
  asyncHandler(async (req, res) => {
    const website = getWebsite(res);
    const data = addStudentSchema.parse(req.body);
    const email = normalizeEmail(data.studentEmail);

    const existing = await prisma.clientEnrollment.findUnique({
      where: { websiteId_studentEmail: { websiteId: website.id, studentEmail: email } },
    });
    if (existing) throw conflict('A student with this email already exists', 'ALREADY_ENROLLED');

    // No code is required (the teacher is trusted); the unique enrollmentCode column
    // is satisfied with a hashed random secret.
    let enrollment;
    try {
      enrollment = await prisma.clientEnrollment.create({
        data: {
          websiteId: website.id,
          studentName: data.studentName.trim(),
          studentEmail: email,
          studentPhone: data.studentPhone,
          enrollmentCode: hashEnrollmentCode(randomUUID()),
          status: 'ACTIVE',
          notes: data.notes,
        },
      });
    } catch (err) {
      // Concurrent add with the same email raced past the check above → friendly 409.
      if ((err as { code?: string }).code === 'P2002') throw conflict('A student with this email already exists', 'ALREADY_ENROLLED');
      throw err;
    }

    // Welcome the student + notify the teacher, same as a self-enroll.
    void sendWelcomeEnrollment(email, {
      studentName: enrollment.studentName,
      bookingUrl: `${env.FRONTEND_URL}/p/${website.slug}/book-lesson`,
      brand: siteBrand(website),
    });
    void createNotification(website.userId, {
      type: 'ENROLLMENT',
      title: 'New student added',
      body: `${enrollment.studentName} (${email})`,
    });

    res.status(201).json({
      enrollment: {
        id: enrollment.id,
        studentName: enrollment.studentName,
        studentEmail: enrollment.studentEmail,
        studentPhone: enrollment.studentPhone,
        status: enrollment.status,
        classCount: enrollment.classCount,
        notes: enrollment.notes,
        enrolledAt: enrollment.enrolledAt,
        finishedAt: enrollment.finishedAt,
      },
    });
  })
);

// helper to load an owned enrollment
async function loadEnrollment(websiteId: string, enrollmentId: string) {
  const enrollment = await prisma.clientEnrollment.findFirst({
    where: { id: enrollmentId, websiteId },
  });
  if (!enrollment) throw notFound('Student not found');
  return enrollment;
}

/** WHERE matching a student's not-yet-started (future) lessons — used to free their
 *  slots + stop reminders when they're removed/finished/paused. "Future" = tomorrow
 *  onwards OR later today (start still ahead), so a lesson that already happened
 *  earlier today stays in history and completed counts (L13). */
function futureBookingsWhere(websiteId: string, email: string): Prisma.BookingWhereInput {
  const today = appTodayUtcMidnight(env.APP_TIMEZONE);
  const tomorrow = appTomorrowUtcMidnight(env.APP_TIMEZONE);
  const { hhmm: nowHHMM } = nowInZone(env.APP_TIMEZONE);
  return {
    websiteId,
    customerEmail: email,
    status: { in: ['CONFIRMED', 'PENDING'] },
    OR: [{ bookingDate: { gte: tomorrow } }, { bookingDate: today, bookingTime: { gt: nowHHMM } }],
  };
}

/** Real, non-cancelled lesson count per student email (the honest "Classes" number).
 *  The ClientEnrollment.classCount column is incremented per booking and never
 *  decremented on cancel, so it double-counts — derive from Booking rows instead (M1). */
async function nonCancelledCountsByEmail(
  websiteId: string,
  emails: string[]
): Promise<Map<string, number>> {
  if (!emails.length) return new Map();
  const grouped = await prisma.booking.groupBy({
    by: ['customerEmail'],
    where: { websiteId, customerEmail: { in: emails }, status: { not: 'CANCELLED' } },
    _count: { _all: true },
  });
  return new Map(grouped.map((g) => [g.customerEmail, g._count._all]));
}

/**
 * Cancel a student's not-yet-started lessons AND tell them (A-04).
 *
 * Finishing, pausing or deleting a student silently cancelled every future lesson they had
 * booked, with no notification to anyone. A teacher tapping "pause" to mean "she's away for
 * two weeks" destroyed her schedule invisibly — the student either turned up to nothing or
 * simply stopped coming. Reactivating does NOT restore the bookings, so this is effectively
 * irreversible and the student has to be told.
 *
 * Returns the affected bookings so the caller can report the count to the teacher and the
 * UI can warn BEFORE the action ("this will cancel 3 upcoming lessons").
 */
async function cancelFutureLessonsAndNotify(
  website: WebsiteWithSettings,
  enrollment: { studentEmail: string; studentName: string },
  reason: 'finished' | 'paused' | 'removed'
): Promise<number> {
  // Read the rows BEFORE cancelling — afterwards they no longer match the filter, so
  // there would be nothing left to tell the student about.
  const affected = await prisma.booking.findMany({
    where: futureBookingsWhere(website.id, enrollment.studentEmail),
    select: { bookingDate: true, bookingTime: true },
    orderBy: [{ bookingDate: 'asc' }, { bookingTime: 'asc' }],
  });
  if (!affected.length) return 0;

  for (const b of affected) {
    // Fire-and-forget, and reusing the existing teacher-cancelled copy: from the student's
    // side that is exactly what happened — the instructor ended the lesson, not them.
    void sendBookingCancelled(enrollment.studentEmail, {
      recipientName: enrollment.studentName,
      date: b.bookingDate.toISOString().slice(0, 10),
      time: b.bookingTime,
      cancelledBy: 'teacher',
      brand: siteBrand(website),
    });
  }
  logger.info(
    `cancelled ${affected.length} future lesson(s) for ${enrollment.studentEmail} (${reason}) and notified them`
  );
  return affected.length;
}

// PATCH /driving-school/:websiteId/students/:enrollmentId — correct a student's details.
//
// There was no way to edit a student at all (D-12): only finish, pause and delete. A typo
// in an email meant that student could not log in or receive reminders, and the only
// "fix" was delete-and-re-add, which wipes their entire lesson history. `notes` was worse
// than that — settable once in the add form and never changeable again, which made the one
// place a teacher can record anything about a student effectively useless.
//
// studentEmail is deliberately NOT editable here. Bookings carry the email as a snapshot
// rather than a foreign key, so changing it would orphan the student's lessons: their
// history would vanish and pause/finish would no longer free their slots. Correcting an
// email needs a deliberate migration of those rows — a separate, explicit operation.
const editStudentSchema = z.object({
  studentName: z.string().min(1).max(120).optional(),
  studentPhone: z.string().regex(/^[+\d][\d\s-]{6,18}$/, 'A valid phone number is required').optional(),
  // Nullable so a teacher can CLEAR the notes, not only overwrite them.
  notes: z.string().max(1000).nullable().optional(),
}).refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });

router.patch(
  '/:websiteId/students/:enrollmentId',
  ...teacher,
  asyncHandler(async (req, res) => {
    const website = getWebsite(res);
    const data = editStudentSchema.parse(req.body);
    await loadEnrollment(website.id, req.params.enrollmentId); // ownership + existence

    const updated = await prisma.clientEnrollment.update({
      where: { id: req.params.enrollmentId },
      data: {
        ...(data.studentName !== undefined ? { studentName: data.studentName.trim() } : {}),
        ...(data.studentPhone !== undefined ? { studentPhone: data.studentPhone.trim() } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
      select: {
        id: true,
        studentName: true,
        studentEmail: true,
        studentPhone: true,
        status: true,
        classCount: true,
        notes: true,
        enrolledAt: true,
        finishedAt: true,
      },
    });
    res.json({ enrollment: updated });
  })
);

// PATCH /driving-school/:websiteId/students/:enrollmentId/finish
router.patch(
  '/:websiteId/students/:enrollmentId/finish',
  ...teacher,
  asyncHandler(async (req, res) => {
    const website = getWebsite(res);
    const enrollment = await loadEnrollment(website.id, req.params.enrollmentId);
    // Finishing a student frees their future slots (no ghost bookings / stray reminders)
    // and now tells the student their remaining lessons are off (A-04).
    const cancelled = await cancelFutureLessonsAndNotify(website, enrollment, 'finished');
    const [, updated] = await prisma.$transaction([
      prisma.booking.updateMany({ where: futureBookingsWhere(website.id, enrollment.studentEmail), data: { status: 'CANCELLED' } }),
      prisma.clientEnrollment.update({
        where: { id: req.params.enrollmentId },
        data: { status: 'COMPLETED', finishedAt: new Date() },
      }),
    ]);
    res.json({ enrollment: updated, cancelledLessons: cancelled });
  })
);

// PATCH /driving-school/:websiteId/students/:enrollmentId/toggle-status
router.patch(
  '/:websiteId/students/:enrollmentId/toggle-status',
  ...teacher,
  asyncHandler(async (req, res) => {
    const website = getWebsite(res);
    const enrollment = await loadEnrollment(website.id, req.params.enrollmentId);
    const nextStatus = enrollment.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    // Pausing a student frees their future slots too; reactivating just clears finishedAt.
    // NOTE this is not symmetric: reactivating does NOT restore cancelled lessons, which is
    // why the student is emailed on the way out (A-04).
    let cancelled = 0;
    const updated =
      nextStatus === 'INACTIVE'
        ? await (async () => {
            cancelled = await cancelFutureLessonsAndNotify(website, enrollment, 'paused');
            const rows = await prisma.$transaction([
              prisma.booking.updateMany({ where: futureBookingsWhere(website.id, enrollment.studentEmail), data: { status: 'CANCELLED' } }),
              prisma.clientEnrollment.update({ where: { id: enrollment.id }, data: { status: 'INACTIVE' } }),
            ]);
            return rows[1];
          })()
        : await prisma.clientEnrollment.update({ where: { id: enrollment.id }, data: { status: 'ACTIVE', finishedAt: null } });
    res.json({ enrollment: updated, cancelledLessons: cancelled });
  })
);

// DELETE /driving-school/:websiteId/students/:enrollmentId
router.delete(
  '/:websiteId/students/:enrollmentId',
  ...teacher,
  asyncHandler(async (req, res) => {
    const website = getWebsite(res);
    const enrollment = await loadEnrollment(website.id, req.params.enrollmentId);
    // Booking has no FK to the enrollment (matched by email), so deleting the row
    // alone would leave the student's FUTURE lessons occupying their slots forever,
    // and those ghost bookings would bleed onto anyone who re-enrolls with the same
    // email. Cancel the not-yet-started ones in the same transaction to free the slots
    // (H5). Lessons that already happened (incl. earlier today) stay for history (L13).
    const cancelled = await cancelFutureLessonsAndNotify(website, enrollment, 'removed');
    await prisma.$transaction([
      prisma.booking.updateMany({
        where: futureBookingsWhere(website.id, enrollment.studentEmail),
        data: { status: 'CANCELLED' },
      }),
      prisma.clientEnrollment.delete({ where: { id: req.params.enrollmentId } }),
    ]);
    res.json({ deleted: true, cancelledLessons: cancelled });
  })
);

// POST /driving-school/:websiteId/bookings/:bookingId/cancel — teacher cancels a lesson
router.post(
  '/:websiteId/bookings/:bookingId/cancel',
  ...teacher,
  asyncHandler(async (req, res) => {
    const website = getWebsite(res);
    const booking = await prisma.booking.findUnique({ where: { id: req.params.bookingId } });
    if (!booking || booking.websiteId !== website.id) throw notFound('Booking not found');
    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
      throw badRequest('This lesson is not active', 'NOT_ACTIVE');
    }

    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });

    void sendBookingCancelled(booking.customerEmail, {
      recipientName: booking.customerName,
      date: booking.bookingDate.toISOString().slice(0, 10),
      time: booking.bookingTime,
      cancelledBy: 'teacher',
      brand: siteBrand(website),
    });

    res.json({ cancelled: true });
  })
);

/** Resolve the ?day=today|tomorrow query param (default 'today') to its UTC-midnight date. */
function resolveScheduleDate(day: unknown): { day: 'today' | 'tomorrow'; date: Date } {
  const resolved = day === 'tomorrow' ? 'tomorrow' : 'today';
  return { day: resolved, date: resolved === 'tomorrow' ? appTomorrowUtcMidnight(env.APP_TIMEZONE) : appTodayUtcMidnight(env.APP_TIMEZONE) };
}

// GET /driving-school/:websiteId/daily-report?day=today|tomorrow  (default today's full schedule)
router.get(
  '/:websiteId/daily-report',
  ...teacher,
  asyncHandler(async (req, res) => {
    const website = getWebsite(res);
    const { date } = resolveScheduleDate(req.query.day);
    const schedule = await buildDaySchedule(website, website.settings, date);

    // enrich with the honest, non-cancelled lesson count per student (M1)
    const emails = schedule.slots.filter((s) => s.booked && s.studentEmail).map((s) => s.studentEmail!);
    const countByEmail = await nonCancelledCountsByEmail(website.id, emails);

    res.json({
      date: schedule.date,
      isOpen: schedule.isOpen,
      open: schedule.open,
      close: schedule.close,
      slots: schedule.slots.map((s) => ({
        ...s,
        classCount: s.studentEmail ? countByEmail.get(s.studentEmail) ?? 0 : undefined,
      })),
      totals: { booked: schedule.bookedCount, empty: schedule.emptyCount, total: schedule.total },
    });
  })
);

// POST /driving-school/:websiteId/schedule/assign — teacher manually books an ACTIVE
// student into a free slot for today or tomorrow (same effect as the student booking
// it themselves: the slot becomes CONFIRMED so no one else can take it).
const assignSchema = z.object({
  enrollmentId: z.string().uuid(),
  day: z.enum(['today', 'tomorrow']),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});
router.post(
  '/:websiteId/schedule/assign',
  ...teacher,
  asyncHandler(async (req, res) => {
    const website = getWebsite(res);
    const data = assignSchema.parse(req.body);
    const cfg = normalizeConfig(website);
    const targetDate = data.day === 'tomorrow' ? appTomorrowUtcMidnight(env.APP_TIMEZONE) : appTodayUtcMidnight(env.APP_TIMEZONE);
    const dateStr = targetDate.toISOString().slice(0, 10);

    const hours = getDayHours(website.settings, targetDate);
    if (!hours) throw badRequest('The school is closed on this day', 'DAY_CLOSED');
    const validSlots = generateTimeSlots({
      open: hours.open,
      close: hours.close,
      classDuration: cfg.classDuration,
      breakTimes: (cfg.breakTimes as BreakTime[]) ?? [],
      restMinutes: cfg.restMinutes,
    });
    if (!validSlots.includes(data.time)) throw badRequest('That time is not a valid slot', 'SLOT_NOT_AVAILABLE');

    try {
      const result = await prisma.$transaction(async (tx) => {
        const enrollment = await tx.clientEnrollment.findFirst({
          where: { id: data.enrollmentId, websiteId: website.id },
        });
        if (!enrollment) throw notFound('Student not found');
        if (enrollment.status !== 'ACTIVE') {
          throw badRequest('This student is not active', 'ENROLLMENT_NOT_ACTIVE');
        }

        const service = await getOrCreateLessonService(tx, website.id, cfg.classDuration);

        const clash = await tx.booking.findFirst({
          where: { websiteId: website.id, bookingDate: targetDate, bookingTime: data.time, status: { not: 'CANCELLED' } },
        });
        if (clash) throw conflict('That slot was just taken', 'SLOT_NOT_AVAILABLE');

        const created = await tx.booking.create({
          data: {
            websiteId: website.id,
            serviceId: service.id,
            customerName: enrollment.studentName,
            customerEmail: enrollment.studentEmail,
            customerPhone: enrollment.studentPhone,
            bookingDate: targetDate,
            bookingTime: data.time,
            duration: cfg.classDuration,
            status: 'CONFIRMED',
            reminderSent: false,
          },
        });

        await tx.clientEnrollment.update({
          where: { id: enrollment.id },
          data: { classCount: { increment: 1 } },
        });

        return { created, enrollment };
      });

      // Same as a student self-booking: confirmation email + teacher notification.
      // Deliberately NOT a daily-schedule report email — the teacher is already
      // looking at the (now updated) schedule and can request one on demand.
      void sendBookingConfirmation(result.enrollment.studentEmail, {
        studentName: result.enrollment.studentName,
        date: dateStr,
        time: data.time,
        teacherName: cfg.teacherName,
        duration: cfg.classDuration,
        brand: siteBrand(website),
      });
      void createNotification(website.userId, {
        type: 'BOOKING',
        title: 'New lesson booked',
        body: `${result.enrollment.studentName} — ${dateStr} at ${data.time}`,
      });
      logEvent('booking_created', { props: { websiteId: website.id, source: 'teacher_assign' } });

      res.status(201).json({
        booking: {
          id: result.created.id,
          date: dateStr,
          time: data.time,
          duration: result.created.duration,
          status: result.created.status,
        },
      });
    } catch (err) {
      // Unique index race → friendly 409
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: string }).code === 'P2002'
      ) {
        throw conflict('That slot was just taken', 'SLOT_NOT_AVAILABLE');
      }
      throw err;
    }
  })
);

// POST /driving-school/:websiteId/schedule/email-me — send the teacher the
// (up to date) schedule for today or tomorrow, on demand. Independent of the
// automatic daily-rhythm cron report.
router.post(
  '/:websiteId/schedule/email-me',
  ...teacher,
  // Triggers an email send — throttle per site.
  rateLimit({ keyPrefix: 'schedule-email', windowSeconds: 3600, max: 30, keyFn: (req) => req.params.websiteId }),
  asyncHandler(async (req, res) => {
    const website = getWebsite(res);
    const { day } = z.object({ day: z.enum(['today', 'tomorrow']) }).parse(req.body);
    const targetDate = day === 'tomorrow' ? appTomorrowUtcMidnight(env.APP_TIMEZONE) : appTodayUtcMidnight(env.APP_TIMEZONE);

    const teacherUser = await prisma.user.findUnique({
      where: { id: website.userId },
      select: { email: true, name: true },
    });
    if (!teacherUser) throw notFound('Teacher account not found');

    const schedule = await buildDaySchedule(website, website.settings, targetDate);
    await sendEnhancedDailyReport(teacherUser.email, {
      teacherName: teacherUser.name,
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
      when: day,
      brand: siteBrand(website),
    });

    res.json({ sent: true });
  })
);

// ===========================================================================
// STUDENT PORTAL — a per-site account space. Auth = a short student session
// token (email + enrollment code → JWT with kind:'student', scoped to the site).
// ===========================================================================

/** Load the enrollment behind a valid student session (scoped to its site).
 *  Re-checks ACTIVE on every request so pausing/completing a student immediately
 *  revokes their session (a 7-day token must not outlive their access — L10). */
async function loadStudentEnrollment(req: Request) {
  const s = req.student!;
  const enrollment = await prisma.clientEnrollment.findFirst({
    where: { id: s.enrollmentId, websiteId: s.websiteId },
    include: { website: { select: { status: true } } },
  });
  if (!enrollment) throw unauthorized('Your session has expired', 'BAD_IDENTITY');
  if (enrollment.status !== 'ACTIVE') {
    throw forbidden('Your account is paused. Please contact your instructor.', 'ENROLLMENT_NOT_ACTIVE');
  }
  // A frozen (unpaid) site takes its student portal down with it.
  if (enrollment.website.status === 'SUSPENDED') {
    throw forbidden('This site is currently paused.', 'SITE_PAUSED');
  }
  return enrollment;
}

const studentSummary = (e: {
  id: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string | null;
  status: string;
  classCount: number;
}) => ({
  id: e.id,
  name: e.studentName,
  email: e.studentEmail,
  phone: e.studentPhone,
  status: e.status,
  classCount: e.classCount,
});

/** Real lesson counts for a student, from their bookings (not the classCount
 *  column, which is incremented per booking and double-counts). */
async function studentStats(websiteId: string, email: string) {
  const today = appTodayUtcMidnight(env.APP_TIMEZONE);
  const [upcoming, completed] = await Promise.all([
    prisma.booking.count({ where: { websiteId, customerEmail: email, status: 'CONFIRMED', bookingDate: { gte: today } } }),
    prisma.booking.count({ where: { websiteId, customerEmail: email, status: 'CONFIRMED', bookingDate: { lt: today } } }),
  ]);
  return { upcoming, completed, total: upcoming + completed };
}

// Resolve a returning student (by email) to a session on a live site. Shared by the
// email login and the Google login — the ONLY difference is how the email is trusted
// (typed vs. Google-verified). Throws the same friendly errors either way.
async function studentSessionByEmail(websiteId: string, rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  const website = await prisma.website.findUnique({ where: { id: websiteId }, select: { status: true } });
  // A frozen (unpaid) site takes its student portal down with it.
  if (website?.status === 'SUSPENDED') throw forbidden('This site is currently paused.', 'SITE_PAUSED');
  const enrollment = await prisma.clientEnrollment.findUnique({
    where: { websiteId_studentEmail: { websiteId, studentEmail: email } },
  });
  if (!enrollment) {
    throw unauthorized('No account found for this email. New students need the code from their instructor.', 'NO_ACCOUNT');
  }
  if (enrollment.status !== 'ACTIVE') {
    throw forbidden('Your account is paused. Please contact your instructor.', 'ENROLLMENT_NOT_ACTIVE');
  }
  const token = signStudentToken({ sub: enrollment.id, kind: 'student', websiteId, email: enrollment.studentEmail });
  // classCount here is the DERIVED non-cancelled total (the raw column double-counts).
  const stats = await studentStats(websiteId, enrollment.studentEmail);
  return { token, student: { ...studentSummary(enrollment), classCount: stats.total, stats } };
}

// POST /driving-school/:websiteId/student/login — a RETURNING student signs in
// with just their email (no code). The one-time enrollment code is the gate for
// NEW students only (at enroll time). Requires an ACTIVE enrollment.
router.post(
  '/:websiteId/student/login',
  rateLimit({ keyPrefix: 'student-login', windowSeconds: 60, max: 8 }),
  asyncHandler(async (req, res) => {
    const data = z.object({ email: z.string().email() }).parse(req.body);
    res.json(await studentSessionByEmail(req.params.websiteId, data.email));
  })
);

// POST /driving-school/:websiteId/student/google-login — a returning student signs in
// with Google. Stronger than the email-only login (Google PROVES the student owns the
// email) and faster (one click). Still requires an ACTIVE enrollment for THIS site —
// Google sign-in doesn't self-enroll; new students still need their instructor's code.
router.post(
  '/:websiteId/student/google-login',
  rateLimit({ keyPrefix: 'student-google', windowSeconds: 60, max: 8 }),
  asyncHandler(async (req, res) => {
    if (!env.GOOGLE_CLIENT_ID) throw new ApiError(503, 'Google sign-in is not configured', 'GOOGLE_DISABLED');
    const { credential } = z.object({ credential: z.string().min(1).max(4096) }).parse(req.body);
    let claims;
    try {
      claims = await verifyGoogleIdToken(credential, env.GOOGLE_CLIENT_ID);
    } catch {
      throw unauthorized('Google sign-in failed. Please try again.', 'GOOGLE_INVALID');
    }
    if (!claims.email) throw unauthorized('Google did not return an email', 'GOOGLE_NO_EMAIL');
    if (claims.email_verified === false) throw unauthorized('Your Google email is not verified', 'GOOGLE_UNVERIFIED');
    res.json(await studentSessionByEmail(req.params.websiteId, claims.email));
  })
);

// GET /driving-school/:websiteId/student/me — account summary + real lesson counts.
router.get(
  '/:websiteId/student/me',
  requireStudent,
  asyncHandler(async (req, res) => {
    const enrollment = await loadStudentEnrollment(req);
    const stats = await studentStats(req.params.websiteId, enrollment.studentEmail);
    res.json({ student: { ...studentSummary(enrollment), classCount: stats.total, stats } });
  })
);

// PATCH /driving-school/:websiteId/student/profile — student edits their phone.
router.patch(
  '/:websiteId/student/profile',
  requireStudent,
  rateLimit({ keyPrefix: 'student-profile', windowSeconds: 60, max: 10 }),
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        // Phone is required — the teacher needs it for lesson coordination, same as self-enroll.
        studentPhone: z.string().regex(/^[+\d][\d\s-]{6,18}$/, 'A valid phone number is required'),
      })
      .parse(req.body);
    const enrollment = await loadStudentEnrollment(req);
    const updated = await prisma.clientEnrollment.update({
      where: { id: enrollment.id },
      data: { studentPhone: data.studentPhone },
    });
    res.json({ student: studentSummary(updated) });
  })
);

// GET /driving-school/:websiteId/student/lessons — upcoming lessons (session auth).
router.get(
  '/:websiteId/student/lessons',
  requireStudent,
  asyncHandler(async (req, res) => {
    const enrollment = await loadStudentEnrollment(req);
    const bookings = await prisma.booking.findMany({
      where: {
        websiteId: req.params.websiteId,
        customerEmail: enrollment.studentEmail,
        status: 'CONFIRMED',
        bookingDate: { gte: appTodayUtcMidnight(env.APP_TIMEZONE) },
      },
      orderBy: [{ bookingDate: 'asc' }, { bookingTime: 'asc' }],
      select: { id: true, bookingDate: true, bookingTime: true, duration: true },
    });
    res.json({
      lessons: bookings.map((b) => ({
        id: b.id,
        date: b.bookingDate.toISOString().slice(0, 10),
        time: b.bookingTime,
        duration: b.duration,
        // Students cannot cancel — only the teacher can (see the cancel route). Always
        // false so the client never shows a cancel affordance that would just 403.
        cancellable: false,
      })),
    });
  })
);

// GET /driving-school/:websiteId/student/history — past lessons (session auth):
// COMPLETED (a past CONFIRMED booking) + CANCELLED, most recent first. Also returns
// hoursDriven, derived ONLY from real completed-lesson durations (no fabricated data).
router.get(
  '/:websiteId/student/history',
  requireStudent,
  rateLimit({ keyPrefix: 'student-history', windowSeconds: 60, max: 30 }),
  asyncHandler(async (req, res) => {
    const enrollment = await loadStudentEnrollment(req);
    const bookings = await prisma.booking.findMany({
      where: {
        websiteId: req.params.websiteId,
        customerEmail: enrollment.studentEmail,
        bookingDate: { lt: appTodayUtcMidnight(env.APP_TIMEZONE) },
        status: { in: ['CONFIRMED', 'CANCELLED'] },
      },
      orderBy: [{ bookingDate: 'desc' }, { bookingTime: 'desc' }],
      select: { id: true, bookingDate: true, bookingTime: true, duration: true, status: true },
    });
    const minutesDriven = bookings
      .filter((b) => b.status === 'CONFIRMED')
      .reduce((sum, b) => sum + b.duration, 0);
    res.json({
      history: bookings.map((b) => ({
        id: b.id,
        date: b.bookingDate.toISOString().slice(0, 10),
        time: b.bookingTime,
        duration: b.duration,
        status: b.status === 'CONFIRMED' ? 'COMPLETED' : 'CANCELLED',
      })),
      hoursDriven: Math.round((minutesDriven / 60) * 10) / 10,
    });
  })
);

// POST /driving-school/:websiteId/student/lessons/:bookingId/cancel (session auth).
// Policy: students CANNOT cancel — only the teacher can. The route stays mounted
// (so the client gets a clean, localized 403 rather than a 404) but always refuses.
router.post(
  '/:websiteId/student/lessons/:bookingId/cancel',
  requireStudent,
  rateLimit({ keyPrefix: 'student-cancel', windowSeconds: 60, max: 10 }),
  asyncHandler(async (req) => {
    await loadStudentEnrollment(req); // still require a valid, active session
    throw forbidden('Please contact your instructor to change or cancel a lesson.', 'STUDENT_CANNOT_CANCEL');
  })
);

// GET /driving-school/:websiteId/student/messages?after=<iso> — student's chat thread.
router.get(
  '/:websiteId/student/messages',
  requireStudent,
  asyncHandler(async (req, res) => {
    const enrollment = await loadStudentEnrollment(req);
    const after = typeof req.query.after === 'string' ? new Date(req.query.after) : null;
    const messages = await prisma.message.findMany({
      where: {
        enrollmentId: enrollment.id,
        ...(after && !isNaN(after.getTime()) ? { createdAt: { gt: after } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, sender: true, body: true, createdAt: true },
    });
    // mark inbound (teacher → student) as read
    await prisma.message.updateMany({
      where: { enrollmentId: enrollment.id, sender: 'TEACHER', readByStudent: false },
      data: { readByStudent: true },
    });
    res.json({
      messages: messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  })
);

// POST /driving-school/:websiteId/student/messages — student sends a message.
router.post(
  '/:websiteId/student/messages',
  requireStudent,
  rateLimit({ keyPrefix: 'student-message', windowSeconds: 60, max: 20 }),
  asyncHandler(async (req, res) => {
    const data = z.object({ body: z.string().trim().min(1).max(2000) }).parse(req.body);
    const enrollment = await loadStudentEnrollment(req);
    const website = await prisma.website.findUnique({
      where: { id: req.params.websiteId },
      select: { userId: true },
    });
    if (!website) throw notFound('Driving school not found');
    const message = await prisma.message.create({
      data: {
        websiteId: req.params.websiteId,
        enrollmentId: enrollment.id,
        sender: 'STUDENT',
        body: data.body,
        readByStudent: true,
      },
      select: { id: true, sender: true, body: true, createdAt: true },
    });
    void createNotification(website.userId, {
      type: 'MESSAGE',
      title: `New message from ${enrollment.studentName}`,
      body: data.body.slice(0, 120),
    });
    res.status(201).json({
      message: { id: message.id, sender: message.sender, body: message.body, createdAt: message.createdAt.toISOString() },
    });
  })
);

// ===========================================================================
// TEACHER — chat inbox
// ===========================================================================

// GET /driving-school/:websiteId/conversations — one row per student with a thread.
router.get(
  '/:websiteId/conversations',
  ...teacher,
  asyncHandler(async (_req, res) => {
    const website = getWebsite(res);
    const messages = await prisma.message.findMany({
      where: { websiteId: website.id },
      orderBy: { createdAt: 'asc' },
      select: { enrollmentId: true, sender: true, body: true, readByTeacher: true, createdAt: true },
    });
    const byEnrollment = new Map<string, { last: (typeof messages)[number]; unread: number }>();
    for (const m of messages) {
      let c = byEnrollment.get(m.enrollmentId);
      if (!c) { c = { last: m, unread: 0 }; byEnrollment.set(m.enrollmentId, c); }
      c.last = m; // asc order → last iteration wins = latest
      if (m.sender === 'STUDENT' && !m.readByTeacher) c.unread++;
    }
    const ids = [...byEnrollment.keys()];
    const enrollments = ids.length
      ? await prisma.clientEnrollment.findMany({
          where: { id: { in: ids }, websiteId: website.id },
          select: { id: true, studentName: true, studentEmail: true, status: true },
        })
      : [];
    const conversations = enrollments
      .map((e) => {
        const c = byEnrollment.get(e.id)!;
        return {
          enrollmentId: e.id,
          studentName: e.studentName,
          studentEmail: e.studentEmail,
          status: e.status,
          lastMessage: c.last.body,
          lastSender: c.last.sender,
          lastAt: c.last.createdAt.toISOString(),
          unread: c.unread,
        };
      })
      .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
    res.json({ conversations });
  })
);

// GET /driving-school/:websiteId/students/:enrollmentId/messages — a thread.
router.get(
  '/:websiteId/students/:enrollmentId/messages',
  ...teacher,
  asyncHandler(async (req, res) => {
    const website = getWebsite(res);
    const enrollment = await loadEnrollment(website.id, req.params.enrollmentId);
    const messages = await prisma.message.findMany({
      where: { enrollmentId: enrollment.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, sender: true, body: true, createdAt: true },
    });
    await prisma.message.updateMany({
      where: { enrollmentId: enrollment.id, sender: 'STUDENT', readByTeacher: false },
      data: { readByTeacher: true },
    });
    res.json({
      student: { id: enrollment.id, name: enrollment.studentName, email: enrollment.studentEmail, status: enrollment.status },
      messages: messages.map((m) => ({ id: m.id, sender: m.sender, body: m.body, createdAt: m.createdAt.toISOString() })),
    });
  })
);

// POST /driving-school/:websiteId/students/:enrollmentId/messages — teacher replies.
router.post(
  '/:websiteId/students/:enrollmentId/messages',
  ...teacher,
  // Student→teacher sends are limited; mirror that on the teacher side.
  rateLimit({ keyPrefix: 'teacher-message', windowSeconds: 60, max: 30, keyFn: (req) => req.params.websiteId }),
  asyncHandler(async (req, res) => {
    const website = getWebsite(res);
    const enrollment = await loadEnrollment(website.id, req.params.enrollmentId);
    const data = z.object({ body: z.string().trim().min(1).max(2000) }).parse(req.body);
    const message = await prisma.message.create({
      data: {
        websiteId: website.id,
        enrollmentId: enrollment.id,
        sender: 'TEACHER',
        body: data.body,
        readByTeacher: true,
      },
      select: { id: true, sender: true, body: true, createdAt: true },
    });
    res.status(201).json({
      message: { id: message.id, sender: message.sender, body: message.body, createdAt: message.createdAt.toISOString() },
    });
  })
);

// GET /driving-school/:websiteId/daily-code  (get-or-create today's code)
router.get(
  '/:websiteId/daily-code',
  ...teacher,
  asyncHandler(async (_req, res) => {
    const website = getWebsite(res);
    const daily = await ensureDailyCode(website.id);
    res.json({ code: daily.code, date: daily.date.toISOString().slice(0, 10), isActive: daily.isActive });
  })
);

// POST /driving-school/:websiteId/bulk-email
const bulkEmailSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  targetGroup: z.enum(['all', 'active', 'inactive']).default('all'),
  // When present + non-empty, email exactly these enrollments instead of a
  // targetGroup (still scoped to this website — anti-IDOR).
  enrollmentIds: z.array(z.string().uuid()).max(1000).optional(),
});
router.post(
  '/:websiteId/bulk-email',
  ...teacher,
  rateLimit({ keyPrefix: 'bulk-email', windowSeconds: 3600, max: 5, keyFn: (req) => req.params.websiteId }),
  asyncHandler(async (req, res) => {
    const website = getWebsite(res);
    const data = bulkEmailSchema.parse(req.body);

    // "Specific students" mode with an empty selection must NOT silently fall back
    // to emailing the whole site — reject it (M8).
    if (data.enrollmentIds && data.enrollmentIds.length === 0) {
      throw badRequest('Select at least one student to email', 'NO_RECIPIENTS');
    }

    const selectingSpecificStudents = Boolean(data.enrollmentIds && data.enrollmentIds.length > 0);

    // `unsubscribedAt` comes along so an opted-out student is excluded, and `id` so the
    // rest get a working unsubscribe link (A-02).
    let recipients: { id: string; studentName: string; studentEmail: string; unsubscribedAt: Date | null }[];
    let targetGroupToStore: string;
    if (selectingSpecificStudents) {
      recipients = await prisma.clientEnrollment.findMany({
        where: { websiteId: website.id, id: { in: data.enrollmentIds! } },
        select: { id: true, studentName: true, studentEmail: true, unsubscribedAt: true },
      });
      targetGroupToStore = 'selected';
    } else {
      const where: Prisma.ClientEnrollmentWhereInput = { websiteId: website.id };
      if (data.targetGroup === 'active') where.status = 'ACTIVE';
      if (data.targetGroup === 'inactive') where.status = 'INACTIVE';
      recipients = await prisma.clientEnrollment.findMany({
        where,
        select: { id: true, studentName: true, studentEmail: true, unsubscribedAt: true },
      });
      targetGroupToStore = data.targetGroup;
    }

    const log = await prisma.bulkEmail.create({
      data: {
        websiteId: website.id,
        subject: data.subject,
        body: data.body,
        targetGroup: targetGroupToStore,
        status: 'SENDING',
      },
    });

    let sentCount = 0;
    let failedCount = 0;
    // A teacher broadcast is marketing by definition — drop anyone who opted out. Doing it
    // here rather than in the query keeps the reported recipient count honest below.
    const optedOut = recipients.filter((r) => r.unsubscribedAt).length;
    recipients = recipients.filter((r) => !r.unsubscribedAt);

    for (const r of recipients) {
      const ok = await sendBulkCustomEmail(r.studentEmail, {
        subject: data.subject,
        body: data.body,
        studentName: r.studentName,
        brand: siteBrand(website),
        unsubscribeUrl: unsubscribeUrl(r.id),
      });
      if (ok) sentCount++;
      else failedCount++;
    }

    const updated = await prisma.bulkEmail.update({
      where: { id: log.id },
      data: { sentCount, failedCount, status: failedCount && !sentCount ? 'FAILED' : 'COMPLETED', sentAt: new Date() },
    });

    res.json({ id: updated.id, recipients: recipients.length, sentCount, failedCount, unsubscribed: optedOut, status: updated.status });
  })
);

export default router;

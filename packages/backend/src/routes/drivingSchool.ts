import { Router, type Request, type Response, type NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Prisma, Website, SiteSettings } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { verifyToken, requireStudent, signStudentToken } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, conflict, forbidden, notFound, unauthorized } from '../utils/errors.js';
import {
  hashEnrollmentCode,
  timingSafeEqualStr,
  verifyEnrollmentCode,
} from '../utils/crypto.js';
import {
  diffDaysUtc,
  generateTimeSlots,
  nowInZone,
  parseTimeToMinutes,
  todayUtcMidnight,
  toUtcMidnight,
  type BreakTime,
} from '../utils/time.js';
import {
  buildDaySchedule,
  ensureDailyCode,
  getDayHours,
  normalizeConfig,
} from '../services/scheduling/schedulingService.js';
import { consumeMagicToken, generateMagicToken } from '../services/auth/magicLinkService.js';
import { createNotification } from '../services/notifications/notificationService.js';
import { logEvent } from '../services/analytics.js';
import {
  sendBulkCustomEmail,
  sendBookingCancelled,
  sendBookingConfirmation,
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
const teacher = [verifyToken, requireOwnership];

const normalizeEmail = (e: string) => e.trim().toLowerCase();

const STUDENT_CANCEL_CUTOFF_MINUTES = 120; // students can cancel up to 2h before the lesson

/** Email + enrollment-code identity proof for public student actions (anti-IDOR).
 *  Same generic-error pattern as self-deactivate. */
async function proveStudentIdentity(websiteId: string, rawEmail: string, enrollmentCode: string) {
  const email = normalizeEmail(rawEmail);
  const enrollment = await prisma.clientEnrollment.findUnique({
    where: { websiteId_studentEmail: { websiteId, studentEmail: email } },
  });
  if (!enrollment || !verifyEnrollmentCode(enrollmentCode.trim(), enrollment.enrollmentCode)) {
    throw unauthorized('Email or code is incorrect', 'BAD_IDENTITY');
  }
  return { email, enrollment };
}

/** Minutes until a booking starts, in the app timezone wall-clock (negative = already started). */
function minutesUntilLesson(bookingDate: Date, bookingTime: string): number {
  const { ymd, hhmm } = nowInZone(env.APP_TIMEZONE);
  const dayDiff = diffDaysUtc(toUtcMidnight(ymd), bookingDate);
  return dayDiff * 24 * 60 + (parseTimeToMinutes(bookingTime) - parseTimeToMinutes(hhmm));
}

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
    if (!website) throw notFound('Driving school not found');

    const cfg = normalizeConfig(website);

    // (a) static code, then (b) today's daily code — both timing-safe
    let valid = false;
    if (cfg.enrollmentCode && cfg.enrollmentCode.length >= 4) {
      valid = timingSafeEqualStr(submitted, cfg.enrollmentCode);
    }
    if (!valid && cfg.dailyCodeEnabled) {
      const today = todayUtcMidnight();
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

    const enrollment = await prisma.clientEnrollment.create({
      data: {
        websiteId: website.id,
        studentName: data.studentName.trim(),
        studentEmail: email,
        studentPhone: data.studentPhone,
        enrollmentCode: hashEnrollmentCode(submitted),
        status: 'ACTIVE',
      },
    });

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
      include: { website: { select: { slug: true } } },
    });
    if (!enrollment) throw notFound('Enrollment not found for this link', 'NOT_ENROLLED');

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

// POST /driving-school/self-deactivate
router.post(
  '/self-deactivate',
  rateLimit({ keyPrefix: 'self-deactivate', windowSeconds: 60, max: 10 }),
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        email: z.string().email(),
        websiteId: z.string().uuid(),
        enrollmentCode: z.string().min(1),
      })
      .parse(req.body);
    const email = normalizeEmail(data.email);

    const enrollment = await prisma.clientEnrollment.findUnique({
      where: { websiteId_studentEmail: { websiteId: data.websiteId, studentEmail: email } },
    });
    // Verify the code as identity proof (anti-IDOR). Generic error either way.
    if (!enrollment || !verifyEnrollmentCode(data.enrollmentCode.trim(), enrollment.enrollmentCode)) {
      throw unauthorized('Email or code is incorrect', 'BAD_IDENTITY');
    }

    await prisma.clientEnrollment.update({
      where: { id: enrollment.id },
      data: { status: 'INACTIVE' },
    });
    res.json({ status: 'INACTIVE', message: 'Your lessons are paused. Contact your teacher to resume.' });
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
    if (!website || website.status !== 'PUBLISHED') throw notFound('Driving school not found');

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
    const email = normalizeEmail(String(req.query.email ?? ''));
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw badRequest('Valid email required');

    const enrollment = await prisma.clientEnrollment.findUnique({
      where: { websiteId_studentEmail: { websiteId: req.params.websiteId, studentEmail: email } },
    });

    if (!enrollment) return res.json({ enrolled: false });
    // Deliberately no phone number here — this endpoint is public and only
    // gated by knowing an email address.
    res.json({
      enrolled: true,
      active: enrollment.status === 'ACTIVE',
      status: enrollment.status,
      studentName: enrollment.studentName,
    });
  })
);

// GET /driving-school/:websiteId/public-availability?date=&email=
router.get(
  '/:websiteId/public-availability',
  rateLimit({ keyPrefix: 'availability', windowSeconds: 60, max: 20 }),
  asyncHandler(async (req, res) => {
    const date = String(req.query.date ?? '');
    const email = normalizeEmail(String(req.query.email ?? ''));
    if (!/^\d{4}-\d{2}-\d{2}/.test(date)) throw badRequest('Valid date (YYYY-MM-DD) required');

    const website = await prisma.website.findUnique({
      where: { id: req.params.websiteId },
      include: { settings: true },
    });
    if (!website) throw notFound('Driving school not found');

    // must be an enrolled, active student
    const enrollment = await prisma.clientEnrollment.findUnique({
      where: { websiteId_studentEmail: { websiteId: website.id, studentEmail: email } },
    });
    if (!enrollment) throw notFound('You are not enrolled', 'NOT_ENROLLED');
    if (enrollment.status !== 'ACTIVE') throw forbidden('Your enrollment is not active', 'ENROLLMENT_NOT_ACTIVE');

    const cfg = normalizeConfig(website);
    const bookingDate = toUtcMidnight(date);
    const today = todayUtcMidnight();
    const diffDays = diffDaysUtc(today, bookingDate);

    if (diffDays < 0) return res.json({ date, slots: [], classDuration: cfg.classDuration });

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

    // Drop past slots when booking for today (UTC).
    if (diffDays === 0) {
      const now = new Date();
      const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();
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
      include: { settings: true },
    });
    if (!website) throw notFound('Driving school not found');

    const cfg = normalizeConfig(website);

    // Booking is only open during the teacher's chosen daily window (app timezone).
    // Default window is 00:00–23:59, so unconfigured/seeded sites are never gated.
    const nowMin = parseTimeToMinutes(nowInZone(env.APP_TIMEZONE).hhmm);
    if (nowMin < parseTimeToMinutes(cfg.bookingWindowStart) || nowMin > parseTimeToMinutes(cfg.bookingWindowEnd)) {
      throw badRequest('Booking is closed right now', 'BOOKING_WINDOW_CLOSED');
    }

    const bookingDate = toUtcMidnight(data.date);
    const today = todayUtcMidnight();
    const diffDays = diffDaysUtc(today, bookingDate);

    if (diffDays < 0) throw badRequest('Cannot book a lesson in the past', 'PAST_DATE');
    if (diffDays > (cfg.advanceBookingDays ?? 1)) {
      throw badRequest(`You can only book up to ${cfg.advanceBookingDays} day(s) in advance`, 'ADVANCE_BOOKING_EXCEEDED');
    }
    if (diffDays === 0) {
      const now = new Date();
      if (now.getUTCHours() >= (cfg.bookingCutoffHour ?? 18)) {
        throw badRequest('Booking for today is closed', 'BOOKING_CUTOFF_PASSED');
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
  bookingWindowStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  bookingWindowEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  reportTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  dailyCodeEnabled: z.boolean().optional(),
  breakTimes: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
  restMinutes: z.number().int().min(0).max(120).optional(),
  workingHours: z.record(z.object({ isOpen: z.boolean(), open: z.string(), close: z.string() })).optional(),
  teacherName: z.string().max(120).optional(),
  pricePerClass: z.union([z.number().min(0), z.string().max(20)]).optional(),
  experienceYears: z.union([z.number().int().min(0).max(80), z.string().max(20)]).optional(),
  passRate: z.number().min(0).max(100).optional(),
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
    const search = req.query.search ? String(req.query.search).trim() : '';
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

    const where: Prisma.ClientEnrollmentWhereInput = { websiteId: website.id };
    if (status && ['ACTIVE', 'INACTIVE', 'COMPLETED', 'SUSPENDED'].includes(status)) {
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

    res.json({ students, total, page, limit, totalPages: Math.ceil(total / limit) });
  })
);

// POST /driving-school/:websiteId/students  (teacher adds a student manually — no code needed)
const addStudentSchema = z.object({
  studentName: z.string().min(1).max(120),
  studentEmail: z.string().email(),
  studentPhone: z
    .string()
    .regex(/^[+\d][\d\s-]{6,18}$/, 'Invalid phone')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  notes: z.string().max(1000).optional(),
});
router.post(
  '/:websiteId/students',
  ...teacher,
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
    const enrollment = await prisma.clientEnrollment.create({
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

// PATCH /driving-school/:websiteId/students/:enrollmentId/finish
router.patch(
  '/:websiteId/students/:enrollmentId/finish',
  ...teacher,
  asyncHandler(async (req, res) => {
    const website = getWebsite(res);
    await loadEnrollment(website.id, req.params.enrollmentId);
    const updated = await prisma.clientEnrollment.update({
      where: { id: req.params.enrollmentId },
      data: { status: 'COMPLETED', finishedAt: new Date() },
    });
    res.json({ enrollment: updated });
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
    const updated = await prisma.clientEnrollment.update({
      where: { id: enrollment.id },
      data: { status: nextStatus, ...(nextStatus === 'ACTIVE' ? { finishedAt: null } : {}) },
    });
    res.json({ enrollment: updated });
  })
);

// DELETE /driving-school/:websiteId/students/:enrollmentId
router.delete(
  '/:websiteId/students/:enrollmentId',
  ...teacher,
  asyncHandler(async (req, res) => {
    const website = getWebsite(res);
    await loadEnrollment(website.id, req.params.enrollmentId);
    await prisma.clientEnrollment.delete({ where: { id: req.params.enrollmentId } });
    res.json({ deleted: true });
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

// GET /driving-school/:websiteId/daily-report  (today's full schedule)
router.get(
  '/:websiteId/daily-report',
  ...teacher,
  asyncHandler(async (_req, res) => {
    const website = getWebsite(res);
    const schedule = await buildDaySchedule(website, website.settings, todayUtcMidnight());

    // enrich with classCount per student
    const emails = schedule.slots.filter((s) => s.booked && s.studentEmail).map((s) => s.studentEmail!);
    const enrollments = emails.length
      ? await prisma.clientEnrollment.findMany({
          where: { websiteId: website.id, studentEmail: { in: emails } },
          select: { studentEmail: true, classCount: true },
        })
      : [];
    const countByEmail = new Map(enrollments.map((e) => [e.studentEmail, e.classCount]));

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

// POST /driving-school/:websiteId/my-bookings — student lists their upcoming
// lessons. POST (not GET) so the enrollment code never lands in URLs/logs.
router.post(
  '/:websiteId/my-bookings',
  rateLimit({ keyPrefix: 'my-bookings', windowSeconds: 60, max: 10 }),
  asyncHandler(async (req, res) => {
    const data = z
      .object({ email: z.string().email(), enrollmentCode: z.string().min(1) })
      .parse(req.body);
    const { email } = await proveStudentIdentity(req.params.websiteId, data.email, data.enrollmentCode);

    const bookings = await prisma.booking.findMany({
      where: {
        websiteId: req.params.websiteId,
        customerEmail: email,
        status: 'CONFIRMED',
        bookingDate: { gte: todayUtcMidnight() },
      },
      orderBy: [{ bookingDate: 'asc' }, { bookingTime: 'asc' }],
      select: { id: true, bookingDate: true, bookingTime: true, duration: true },
    });

    res.json({
      bookings: bookings.map((b) => ({
        id: b.id,
        date: b.bookingDate.toISOString().slice(0, 10),
        time: b.bookingTime,
        duration: b.duration,
        cancellable: minutesUntilLesson(b.bookingDate, b.bookingTime) > STUDENT_CANCEL_CUTOFF_MINUTES,
      })),
    });
  })
);

// POST /driving-school/:websiteId/bookings/:bookingId/cancel-by-student
router.post(
  '/:websiteId/bookings/:bookingId/cancel-by-student',
  rateLimit({ keyPrefix: 'cancel-booking', windowSeconds: 60, max: 10 }),
  asyncHandler(async (req, res) => {
    const data = z
      .object({ email: z.string().email(), enrollmentCode: z.string().min(1) })
      .parse(req.body);
    const { email } = await proveStudentIdentity(req.params.websiteId, data.email, data.enrollmentCode);

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      include: { website: { include: { user: { select: { email: true, name: true } } } } },
    });
    // Anti-IDOR: the booking must belong to this site AND to the proven student.
    if (!booking || booking.websiteId !== req.params.websiteId || booking.customerEmail !== email) {
      throw notFound('Booking not found');
    }
    if (booking.status !== 'CONFIRMED') throw badRequest('This lesson is not active', 'NOT_ACTIVE');
    if (minutesUntilLesson(booking.bookingDate, booking.bookingTime) <= STUDENT_CANCEL_CUTOFF_MINUTES) {
      throw badRequest(
        'Lessons can be cancelled up to 2 hours before they start. Please contact your instructor directly.',
        'CANCEL_TOO_LATE'
      );
    }

    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });

    const date = booking.bookingDate.toISOString().slice(0, 10);
    void sendBookingCancelled(booking.website.user.email, {
      recipientName: booking.website.user.name,
      date,
      time: booking.bookingTime,
      cancelledBy: 'student',
      studentName: booking.customerName,
      brand: siteBrand(booking.website),
    });
    void createNotification(booking.website.userId, {
      type: 'BOOKING',
      title: 'Lesson cancelled by student',
      body: `${booking.customerName} cancelled ${date} at ${booking.bookingTime} — the slot is free again`,
    });

    res.json({ cancelled: true });
  })
);

// ===========================================================================
// STUDENT PORTAL — a per-site account space. Auth = a short student session
// token (email + enrollment code → JWT with kind:'student', scoped to the site).
// ===========================================================================

/** Load the enrollment behind a valid student session (scoped to its site). */
async function loadStudentEnrollment(req: Request) {
  const s = req.student!;
  const enrollment = await prisma.clientEnrollment.findFirst({
    where: { id: s.enrollmentId, websiteId: s.websiteId },
  });
  if (!enrollment) throw unauthorized('Your session has expired', 'BAD_IDENTITY');
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
  const today = todayUtcMidnight();
  const [upcoming, completed] = await Promise.all([
    prisma.booking.count({ where: { websiteId, customerEmail: email, status: 'CONFIRMED', bookingDate: { gte: today } } }),
    prisma.booking.count({ where: { websiteId, customerEmail: email, status: 'CONFIRMED', bookingDate: { lt: today } } }),
  ]);
  return { upcoming, completed, total: upcoming + completed };
}

// POST /driving-school/:websiteId/student/login — a RETURNING student signs in
// with just their email (no code). The one-time enrollment code is the gate for
// NEW students only (at enroll time). Requires an ACTIVE enrollment.
router.post(
  '/:websiteId/student/login',
  rateLimit({ keyPrefix: 'student-login', windowSeconds: 60, max: 8 }),
  asyncHandler(async (req, res) => {
    const data = z.object({ email: z.string().email() }).parse(req.body);
    const email = normalizeEmail(data.email);
    const enrollment = await prisma.clientEnrollment.findUnique({
      where: { websiteId_studentEmail: { websiteId: req.params.websiteId, studentEmail: email } },
    });
    if (!enrollment) {
      throw unauthorized('No account found for this email. New students need the code from their instructor.', 'NO_ACCOUNT');
    }
    if (enrollment.status !== 'ACTIVE') {
      throw forbidden('Your account is paused. Please contact your instructor.', 'ENROLLMENT_NOT_ACTIVE');
    }
    const token = signStudentToken({
      sub: enrollment.id,
      kind: 'student',
      websiteId: req.params.websiteId,
      email: enrollment.studentEmail,
    });
    res.json({ token, student: studentSummary(enrollment) });
  })
);

// GET /driving-school/:websiteId/student/me — account summary + real lesson counts.
router.get(
  '/:websiteId/student/me',
  requireStudent,
  asyncHandler(async (req, res) => {
    const enrollment = await loadStudentEnrollment(req);
    const stats = await studentStats(req.params.websiteId, enrollment.studentEmail);
    res.json({ student: { ...studentSummary(enrollment), stats } });
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
        studentPhone: z
          .string()
          .regex(/^[+\d][\d\s-]{6,18}$/, 'Invalid phone')
          .optional()
          .or(z.literal('').transform(() => undefined)),
      })
      .parse(req.body);
    const enrollment = await loadStudentEnrollment(req);
    const updated = await prisma.clientEnrollment.update({
      where: { id: enrollment.id },
      data: { studentPhone: data.studentPhone ?? null },
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
        bookingDate: { gte: todayUtcMidnight() },
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
        cancellable: minutesUntilLesson(b.bookingDate, b.bookingTime) > STUDENT_CANCEL_CUTOFF_MINUTES,
      })),
    });
  })
);

// POST /driving-school/:websiteId/student/lessons/:bookingId/cancel (session auth).
router.post(
  '/:websiteId/student/lessons/:bookingId/cancel',
  requireStudent,
  rateLimit({ keyPrefix: 'student-cancel', windowSeconds: 60, max: 10 }),
  asyncHandler(async (req, res) => {
    const enrollment = await loadStudentEnrollment(req);
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      include: { website: { include: { user: { select: { email: true, name: true } } } } },
    });
    if (!booking || booking.websiteId !== req.params.websiteId || booking.customerEmail !== enrollment.studentEmail) {
      throw notFound('Booking not found');
    }
    if (booking.status !== 'CONFIRMED') throw badRequest('This lesson is not active', 'NOT_ACTIVE');
    if (minutesUntilLesson(booking.bookingDate, booking.bookingTime) <= STUDENT_CANCEL_CUTOFF_MINUTES) {
      throw badRequest(
        'Lessons can be cancelled up to 2 hours before they start. Please contact your instructor directly.',
        'CANCEL_TOO_LATE'
      );
    }
    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });
    const date = booking.bookingDate.toISOString().slice(0, 10);
    void sendBookingCancelled(booking.website.user.email, {
      recipientName: booking.website.user.name,
      date,
      time: booking.bookingTime,
      cancelledBy: 'student',
      studentName: booking.customerName,
      brand: siteBrand(booking.website),
    });
    void createNotification(booking.website.userId, {
      type: 'BOOKING',
      title: 'Lesson cancelled by student',
      body: `${booking.customerName} cancelled ${date} at ${booking.bookingTime} — the slot is free again`,
    });
    res.json({ cancelled: true });
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
});
router.post(
  '/:websiteId/bulk-email',
  ...teacher,
  rateLimit({ keyPrefix: 'bulk-email', windowSeconds: 3600, max: 5, keyFn: (req) => req.params.websiteId }),
  asyncHandler(async (req, res) => {
    const website = getWebsite(res);
    const data = bulkEmailSchema.parse(req.body);

    const where: Prisma.ClientEnrollmentWhereInput = { websiteId: website.id };
    if (data.targetGroup === 'active') where.status = 'ACTIVE';
    if (data.targetGroup === 'inactive') where.status = { in: ['INACTIVE', 'SUSPENDED'] };

    const recipients = await prisma.clientEnrollment.findMany({
      where,
      select: { studentName: true, studentEmail: true },
    });

    const log = await prisma.bulkEmail.create({
      data: {
        websiteId: website.id,
        subject: data.subject,
        body: data.body,
        targetGroup: data.targetGroup,
        status: 'SENDING',
      },
    });

    let sentCount = 0;
    let failedCount = 0;
    for (const r of recipients) {
      const ok = await sendBulkCustomEmail(r.studentEmail, {
        subject: data.subject,
        body: data.body,
        studentName: r.studentName,
        brand: siteBrand(website),
      });
      if (ok) sentCount++;
      else failedCount++;
    }

    const updated = await prisma.bulkEmail.update({
      where: { id: log.id },
      data: { sentCount, failedCount, status: failedCount && !sentCount ? 'FAILED' : 'COMPLETED', sentAt: new Date() },
    });

    res.json({ id: updated.id, recipients: recipients.length, sentCount, failedCount, status: updated.status });
  })
);

export default router;

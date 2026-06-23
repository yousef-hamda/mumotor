import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import type { Prisma, Website, SiteSettings } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { verifyToken } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, conflict, forbidden, notFound, unauthorized } from '../utils/errors.js';
import {
  generateDailyCodeValue,
  hashEnrollmentCode,
  timingSafeEqualStr,
  verifyEnrollmentCode,
} from '../utils/crypto.js';
import {
  diffDaysUtc,
  generateTimeSlots,
  parseTimeToMinutes,
  todayUtcMidnight,
  toUtcMidnight,
  type BreakTime,
} from '../utils/time.js';
import {
  buildDaySchedule,
  getDayHours,
  normalizeConfig,
} from '../services/scheduling/schedulingService.js';
import { consumeMagicToken, generateMagicToken } from '../services/auth/magicLinkService.js';
import {
  sendBulkCustomEmail,
  sendBookingConfirmation,
  sendMagicLink,
  sendWelcomeEnrollment,
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
  studentPhone: z
    .string()
    .regex(/^[+\d][\d\s-]{6,18}$/, 'Invalid phone')
    .optional()
    .or(z.literal('').transform(() => undefined)),
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

    // fire-and-forget welcome email
    void sendWelcomeEnrollment(email, {
      studentName: enrollment.studentName,
      schoolName: website.name,
      bookingUrl: `${env.FRONTEND_URL}/p/${website.slug}/book-lesson`,
    });

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
    res.json({
      id: website.id,
      name: website.name,
      slug: website.slug,
      tagline: website.tagline,
      advanceBookingDays: cfg.advanceBookingDays ?? 14, // public default 14
      bookingCutoffHour: cfg.bookingCutoffHour ?? 18,
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
    res.json({
      enrolled: true,
      active: enrollment.status === 'ACTIVE',
      status: enrollment.status,
      studentName: enrollment.studentName,
      studentPhone: enrollment.studentPhone,
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

      // fire-and-forget confirmation
      void sendBookingConfirmation(email, {
        studentName: booking.enrollment.studentName,
        date: data.date,
        time: data.time,
        teacherName: cfg.teacherName,
        duration: cfg.classDuration,
      });

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
        void sendMagicLink(normalized, { magicUrl: url, studentName: enrollment.studentName });
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

// GET /driving-school/:websiteId/daily-code  (get-or-create today's code)
router.get(
  '/:websiteId/daily-code',
  ...teacher,
  asyncHandler(async (_req, res) => {
    const website = getWebsite(res);
    const today = todayUtcMidnight();
    const daily = await prisma.dailyCode.upsert({
      where: { websiteId_date: { websiteId: website.id, date: today } },
      update: {},
      create: { websiteId: website.id, date: today, code: generateDailyCodeValue(), isActive: true },
    });
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

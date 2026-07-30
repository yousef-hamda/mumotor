import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { verifyToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { forbidden, notFound } from '../utils/errors.js';
import { restoreUserSites } from '../services/billing/siteFreeze.js';
import { getAccountState } from '../services/billing/accountState.js';
import { logger } from '../lib/logger.js';

const router = Router();

const requireAdmin = asyncHandler(async (req, _res, next) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user || user.role !== 'ADMIN') throw forbidden('Admin access only', 'NOT_ADMIN');
  next();
});

router.use(verifyToken, requireAdmin);

/** Event counts per name since a given date. */
async function eventCounts(since: Date): Promise<Record<string, number>> {
  const rows = await prisma.analyticsEvent.groupBy({
    by: ['name'],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((r) => [r.name, r._count._all]));
}

// GET /admin/stats
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const now = Date.now();
    const d7 = new Date(now - 7 * 24 * 3600 * 1000);
    const d30 = new Date(now - 30 * 24 * 3600 * 1000);
    const [users, websites, published, enrollments, bookings, reviews, events7, events30] = await Promise.all([
      prisma.user.count(),
      prisma.website.count(),
      prisma.website.count({ where: { status: 'PUBLISHED' } }),
      prisma.clientEnrollment.count(),
      prisma.booking.count(),
      prisma.review.count(),
      eventCounts(d7),
      eventCounts(d30),
    ]);
    res.json({
      stats: {
        users,
        websites,
        published,
        enrollments,
        bookings,
        reviews,
        events: {
          last7: events7,
          last30: events30,
          funnel: {
            wizardStarted7d: events7.wizard_started ?? 0,
            published7d: events7.site_published ?? 0,
          },
        },
      },
    });
  })
);

// GET /admin/users
router.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { id: true, email: true, name: true, role: true, createdAt: true, _count: { select: { websites: true } } },
    });
    res.json({ users });
  })
);

// GET /admin/websites
router.get(
  '/websites',
  asyncHandler(async (_req, res) => {
    const websites = await prisma.website.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        user: { select: { email: true } },
        _count: { select: { enrollments: true, bookings: true } },
      },
    });
    res.json({ websites });
  })
);

// POST /admin/users/:userId/entitlement — the manual escape hatch.
//
// Until Stripe is live there is no self-service way for a teacher whose free month
// lapsed to get their site back, and support ("just fix my site") must not require
// hand-editing the database. This grants an entitlement directly: extend the trial
// by N days, and/or set the plan + seat count, then bring any frozen site back online.
//
// Deliberately admin-only and deliberately explicit — `plan` is never inferred.
const entitlementSchema = z
  .object({
    /** Extend (or restart) the free window this many days from now. */
    trialDays: z.number().int().min(0).max(3650).optional(),
    /** Set the plan outright — use PRO for "this teacher has paid me directly". */
    plan: z.enum(['FREE', 'PRO', 'STUDIO']).optional(),
    /** How many live websites the account is entitled to. */
    websiteQuota: z.number().int().min(0).max(100).optional(),
    /** Short note for the audit log (who authorised this, why). */
    reason: z.string().max(200).optional(),
  })
  .refine((v) => v.trialDays !== undefined || v.plan !== undefined || v.websiteQuota !== undefined, {
    message: 'Provide at least one of trialDays, plan or websiteQuota',
  });

router.post(
  '/users/:userId/entitlement',
  asyncHandler(async (req, res) => {
    const data = entitlementSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: { id: true, email: true },
    });
    if (!user) throw notFound('User not found');

    const trialEndsAt =
      data.trialDays === undefined
        ? undefined
        : new Date(Date.now() + data.trialDays * 24 * 60 * 60 * 1000);

    // Clearing the notified stamp re-arms the trial-expiry job, so a granted extension
    // is handled cleanly (and re-notified) when it eventually runs out.
    const update = {
      ...(data.plan ? { plan: data.plan, status: 'ACTIVE' as const } : {}),
      ...(data.websiteQuota !== undefined ? { websiteQuota: data.websiteQuota } : {}),
      ...(trialEndsAt ? { trialEndsAt, trialExpiredNotifiedAt: null } : {}),
    };
    await prisma.subscription.upsert({
      where: { userId: user.id },
      update,
      create: { userId: user.id, plan: data.plan ?? 'FREE', websiteQuota: data.websiteQuota ?? 1, trialEndsAt },
    });

    // Anything frozen by a lapsed trial comes back online, capped at the new quota.
    const restored = await restoreUserSites(user.id);
    const account = await getAccountState(user.id);

    logger.info(
      `admin entitlement: ${user.email} → ${JSON.stringify(update)} (restored ${restored} site(s))` +
        `${data.reason ? ` — ${data.reason}` : ''} by admin ${req.user!.email}`
    );
    res.json({ granted: true, restored, account });
  })
);

export default router;

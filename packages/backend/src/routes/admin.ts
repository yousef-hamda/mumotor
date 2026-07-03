import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { forbidden } from '../utils/errors.js';

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

export default router;

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

// GET /admin/stats
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [users, websites, published, enrollments, bookings, reviews] = await Promise.all([
      prisma.user.count(),
      prisma.website.count(),
      prisma.website.count({ where: { status: 'PUBLISHED' } }),
      prisma.clientEnrollment.count(),
      prisma.booking.count(),
      prisma.review.count(),
    ]);
    res.json({ stats: { users, websites, published, enrollments, bookings, reviews } });
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

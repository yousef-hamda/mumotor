import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound, forbidden } from '../utils/errors.js';

const router = Router();
router.use(verifyToken);

// GET /notifications
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.notification.count({ where: { userId: req.user!.id, read: false } }),
    ]);
    res.json({ notifications: items, unread });
  })
);

// PATCH /notifications/:id/read
router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const n = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!n) throw notFound('Notification not found');
    if (n.userId !== req.user!.id) throw forbidden('Not yours');
    await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
    res.json({ ok: true });
  })
);

// POST /notifications/read-all
router.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({ where: { userId: req.user!.id, read: false }, data: { read: true } });
    res.json({ ok: true });
  })
);

export default router;

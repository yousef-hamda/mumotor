import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { verifyToken } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { forbidden, notFound } from '../utils/errors.js';
import { createNotification } from '../services/notifications/notificationService.js';

const router = Router();

async function ownReview(id: string, userId: string) {
  const review = await prisma.review.findUnique({ where: { id }, include: { website: { select: { userId: true } } } });
  if (!review) throw notFound('Review not found');
  if (review.website.userId !== userId) throw forbidden('Not your review');
  return review;
}

// POST /reviews — public: a student leaves a review (PENDING until approved)
router.post(
  '/',
  rateLimit({ keyPrefix: 'review', windowSeconds: 60, max: 5 }),
  asyncHandler(async (req, res) => {
    const data = z
      .object({ websiteId: z.string().uuid(), studentName: z.string().min(1).max(80), rating: z.number().int().min(1).max(5), comment: z.string().min(1).max(1000) })
      .parse(req.body);
    const site = await prisma.website.findUnique({ where: { id: data.websiteId }, select: { id: true, userId: true } });
    if (!site) throw notFound('Driving school not found');
    const review = await prisma.review.create({ data: { ...data, status: 'PENDING' } });
    void createNotification(site.userId, {
      type: 'REVIEW',
      title: 'New review awaiting approval',
      body: `${data.studentName} left a ${data.rating}-star review`,
    });
    res.status(201).json({ review: { id: review.id, status: review.status } });
  })
);

// GET /reviews/public/:websiteId — approved reviews (for the public site)
router.get(
  '/public/:websiteId',
  asyncHandler(async (req, res) => {
    const reviews = await prisma.review.findMany({
      where: { websiteId: req.params.websiteId, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      select: { studentName: true, rating: true, comment: true, reply: true, createdAt: true },
    });
    res.json({ reviews });
  })
);

// --- teacher ---
router.use(verifyToken);

// GET /reviews?websiteId=
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const websiteId = String(req.query.websiteId ?? '');
    const site = await prisma.website.findUnique({ where: { id: websiteId } });
    if (!site) throw notFound('Website not found');
    if (site.userId !== req.user!.id) throw forbidden('Not your website');
    const reviews = await prisma.review.findMany({ where: { websiteId }, orderBy: { createdAt: 'desc' } });
    res.json({ reviews });
  })
);

// PATCH /reviews/:id — approve/reject/reply
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = z.object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(), reply: z.string().max(1000).optional() }).parse(req.body);
    await ownReview(req.params.id, req.user!.id);
    const review = await prisma.review.update({ where: { id: req.params.id }, data });
    res.json({ review });
  })
);

// DELETE /reviews/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await ownReview(req.params.id, req.user!.id);
    await prisma.review.delete({ where: { id: req.params.id } });
    res.json({ deleted: true });
  })
);

export default router;

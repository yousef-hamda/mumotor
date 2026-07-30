import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import authRoutes from './auth.js';
import websiteRoutes from './websites.js';
import drivingSchoolRoutes from './drivingSchool.js';
import reviewRoutes from './reviews.js';
import subscriptionRoutes from './subscriptions.js';
import mediaRoutes from './media.js';
import notificationRoutes from './notifications.js';
import adminRoutes from './admin.js';
import photoRoutes from './photos.js';
import wizardDraftRoutes from './wizardDraft.js';
import eventsRoutes from './events.js';

const router = Router();

/**
 * Health check — the endpoint the host uses to decide whether a deploy is good (G-03).
 *
 * It used to return ok unconditionally, without touching the database. That made the
 * safety net decorative: a deploy that could not reach Postgres still passed its
 * healthcheck, so it REPLACED the working version instead of being rolled back. The
 * trivial query below is what makes a bad deploy fail closed.
 */
router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      logger.error('health check failed: database unreachable', (err as Error).message);
      res.status(503).json({ status: 'unhealthy', service: 'mumotor', database: 'unreachable' });
      return;
    }
    res.json({ status: 'ok', service: 'mumotor', database: 'ok', time: new Date().toISOString() });
  })
);

router.use('/auth', authRoutes);
router.use('/websites', websiteRoutes);
router.use('/driving-school', drivingSchoolRoutes);
router.use('/reviews', reviewRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/photos', photoRoutes);
router.use('/wizard-draft', wizardDraftRoutes);
router.use('/events', eventsRoutes);
router.use(mediaRoutes);

export default router;

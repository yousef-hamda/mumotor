import { Router } from 'express';
import authRoutes from './auth.js';
import websiteRoutes from './websites.js';
import drivingSchoolRoutes from './drivingSchool.js';
import aiGenerationRoutes from './aiGeneration.js';
import reviewRoutes from './reviews.js';
import subscriptionRoutes from './subscriptions.js';
import mediaRoutes from './media.js';
import notificationRoutes from './notifications.js';
import adminRoutes from './admin.js';
import photoRoutes from './photos.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mumotor', time: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/websites', websiteRoutes);
router.use('/driving-school', drivingSchoolRoutes);
router.use('/ai/v2', aiGenerationRoutes);
router.use('/reviews', reviewRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/photos', photoRoutes);
router.use(mediaRoutes);

export default router;

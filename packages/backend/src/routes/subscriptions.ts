import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { verifyToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

export const PLANS = [
  { id: 'FREE', name: 'Free', price: 0, features: ['1 published site (DriveSawa badge)', 'Up to 25 students', 'Online booking', 'Daily codes'] },
  { id: 'PRO', name: 'Pro', price: 29, features: ['Badge removed', 'Unlimited students', 'Custom domain', 'Bulk email', 'Daily schedule reports'] },
  { id: 'STUDIO', name: 'Studio', price: 79, features: ['Everything in Pro', 'Multiple sites / locations', 'Priority generation', 'Early features'] },
];

router.use(verifyToken);

// GET /subscriptions — current plan + catalog
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const subscription = await prisma.subscription.findUnique({ where: { userId: req.user!.id } });
    res.json({
      subscription: subscription
        ? { plan: subscription.plan, status: subscription.status, currentPeriodEnd: subscription.currentPeriodEnd }
        : { plan: 'FREE', status: 'ACTIVE', currentPeriodEnd: null },
      plans: PLANS,
    });
  })
);

// POST /subscriptions/checkout — demo plan switch (real Stripe requires keys)
router.post(
  '/checkout',
  asyncHandler(async (req, res) => {
    const { plan } = z.object({ plan: z.enum(['FREE', 'PRO', 'STUDIO']) }).parse(req.body);
    const subscription = await prisma.subscription.upsert({
      where: { userId: req.user!.id },
      update: { plan, status: 'ACTIVE' },
      create: { userId: req.user!.id, plan, status: 'ACTIVE' },
    });
    res.json({
      success: true,
      plan: subscription.plan,
      note: 'Demo mode: plan switched without payment. Configure STRIPE_SECRET_KEY for real checkout.',
    });
  })
);

export default router;

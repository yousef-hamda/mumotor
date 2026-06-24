import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { stripe, PRICE_IDS } from '../lib/stripe.js';
import { verifyToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

export const PLANS = [
  { id: 'FREE', name: 'Free', price: 0, features: ['1 published site (Mumotor badge)', 'Up to 25 students', 'Online booking', 'Daily codes'] },
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

// POST /subscriptions/checkout — real Stripe Checkout when configured, else demo switch
router.post(
  '/checkout',
  asyncHandler(async (req, res) => {
    const { plan } = z.object({ plan: z.enum(['FREE', 'PRO', 'STUDIO']) }).parse(req.body);
    const userId = req.user!.id;

    // Real Stripe Checkout (paid plans, when keys + price ids are set)
    if (plan !== 'FREE' && stripe && PRICE_IDS[plan]) {
      const existing = await prisma.subscription.findUnique({ where: { userId } });
      let customerId = existing?.stripeCustomerId ?? undefined;
      if (!customerId) {
        const customer = await stripe.customers.create({ email: req.user!.email, metadata: { userId } });
        customerId = customer.id;
        await prisma.subscription.upsert({
          where: { userId },
          update: { stripeCustomerId: customerId },
          create: { userId, stripeCustomerId: customerId },
        });
      }
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: PRICE_IDS[plan]!, quantity: 1 }],
        success_url: `${env.FRONTEND_URL}/dashboard/billing?success=1`,
        cancel_url: `${env.FRONTEND_URL}/dashboard/billing?canceled=1`,
        metadata: { userId, plan },
      });
      return res.json({ mode: 'stripe', url: session.url });
    }

    // Demo fallback (and FREE downgrades): switch plan immediately
    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: { plan, status: 'ACTIVE' },
      create: { userId, plan, status: 'ACTIVE' },
    });
    res.json({
      success: true,
      mode: 'demo',
      plan: subscription.plan,
      note: 'Demo mode: plan switched without payment. Set STRIPE_SECRET_KEY + price ids for real checkout.',
    });
  })
);

export default router;

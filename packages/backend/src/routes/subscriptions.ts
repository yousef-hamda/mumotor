import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { env, isProd } from '../config/env.js';
import { stripe, PRICE_IDS } from '../lib/stripe.js';
import { ApiError } from '../utils/errors.js';
import { verifyToken } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getAccountState } from '../services/billing/accountState.js';
import { restoreUserSites } from '../services/billing/siteFreeze.js';

const router = Router();

export const PLANS = [
  {
    id: 'PRO',
    name: 'Mumotor',
    price: 199,
    currency: '₪',
    period: 'month',
    note: 'Cancel anytime',
    features: [
      'Your own published website',
      'Unlimited students',
      'Online booking — students pick a free slot',
      'A fresh access code every day',
      'Automatic “booking is open” emails to students',
      'Instant booking confirmations',
      'Tomorrow’s schedule emailed to you daily',
      'Custom domain',
    ],
  },
];

router.use(verifyToken);

// GET /subscriptions — current plan + catalog
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const subscription = await prisma.subscription.findUnique({ where: { userId: req.user!.id } });
    const account = await getAccountState(req.user!.id);
    res.json({
      subscription: subscription
        ? { plan: subscription.plan, status: subscription.status, currentPeriodEnd: subscription.currentPeriodEnd }
        : { plan: 'FREE', status: 'ACTIVE', currentPeriodEnd: null },
      account,
      plans: PLANS,
    });
  })
);

// POST /subscriptions/checkout — real Stripe Checkout when configured, else demo switch
router.post(
  '/checkout',
  // Creates Stripe customers + Checkout sessions (external API cost) — cap per account.
  rateLimit({ keyPrefix: 'checkout', windowSeconds: 3600, max: 20, keyFn: (req) => req.user?.id ?? req.ip ?? 'anon' }),
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

    // In production a paid plan is NEVER granted without going through Stripe —
    // the demo fallback below is a dev/test convenience only.
    if (plan !== 'FREE' && isProd) {
      throw new ApiError(503, 'Billing is not configured yet. Please try again later.', 'BILLING_NOT_CONFIGURED');
    }

    // Demo fallback (and FREE downgrades): switch plan immediately
    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: { plan, status: 'ACTIVE', ...(plan !== 'FREE' ? { trialExpiredNotifiedAt: null } : {}) },
      create: { userId, plan, status: 'ACTIVE' },
    });
    // Paying re-activates a frozen account: bring any paused site back online.
    let restored = 0;
    if (plan !== 'FREE') restored = await restoreUserSites(userId);
    res.json({
      success: true,
      mode: 'demo',
      plan: subscription.plan,
      restored,
      note: 'Demo mode: plan switched without payment. Set STRIPE_SECRET_KEY + price ids for real checkout.',
    });
  })
);

export default router;

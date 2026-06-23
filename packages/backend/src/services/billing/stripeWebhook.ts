import type { Request, Response } from 'express';
import type Stripe from 'stripe';
import { stripe } from '../../lib/stripe.js';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

/** Stripe webhook — must receive the RAW request body for signature verification. */
export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    res.status(503).json({ error: 'Stripe not configured' });
    return;
  }
  const sig = req.headers['stripe-signature'];
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig as string, env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    logger.warn('Stripe signature verification failed', (e as Error).message);
    res.status(400).send('Invalid signature');
    return;
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = s.metadata?.userId;
      const plan = s.metadata?.plan as 'PRO' | 'STUDIO' | undefined;
      if (userId && plan) {
        await prisma.subscription.upsert({
          where: { userId },
          update: { plan, status: 'ACTIVE', stripeCustomerId: String(s.customer), stripeSubscriptionId: String(s.subscription) },
          create: { userId, plan, status: 'ACTIVE', stripeCustomerId: String(s.customer), stripeSubscriptionId: String(s.subscription) },
        });
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.subscription.updateMany({ where: { stripeSubscriptionId: sub.id }, data: { status: 'CANCELED', plan: 'FREE' } });
    } else if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { status: sub.status === 'active' ? 'ACTIVE' : sub.status === 'past_due' ? 'PAST_DUE' : 'INCOMPLETE' },
      });
    }
  } catch (e) {
    logger.error('Stripe webhook handling error', (e as Error).message);
  }
  res.json({ received: true });
}

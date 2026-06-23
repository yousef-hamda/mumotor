import Stripe from 'stripe';
import { env } from '../config/env.js';

/** Stripe client — null when no secret key is configured (billing runs in demo mode). */
export const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

/** Map plan → Stripe price id (set via env). */
export const PRICE_IDS: Record<string, string | undefined> = {
  PRO: env.STRIPE_PRICE_PRO,
  STUDIO: env.STRIPE_PRICE_STUDIO,
};

export const stripeEnabled = Boolean(stripe);

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

/**
 * True only when a teacher could actually complete a payment right now: a Stripe
 * client AND at least one usable price id. Distinct from `stripeEnabled` — a secret
 * key with no price ids still cannot take money.
 *
 * The trial-expiry job reads this so it never freezes an account that has no way to
 * pay (that combination locks the owner out of their own dashboard behind a Subscribe
 * button that 503s, with no self-service route back).
 */
export const canAcceptPayment = Boolean(stripe) && Object.values(PRICE_IDS).some(Boolean);

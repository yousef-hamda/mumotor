import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';

/**
 * Free-trial + per-website paywall — the single source of truth for "what is this
 * account allowed to do right now". Everything (website-create guard, the
 * requireActiveAccount middleware, /auth/me, the freeze cron, the frontend
 * paywall) reads its answer from here so the rules can never drift apart.
 *
 * The product rule (Stripe-ready, Stripe-dormant):
 *  - Every new teacher gets ONE website free for the first month (from signup).
 *  - During the trial the account is fully active (quota = 1 website).
 *  - When the month runs out and they have not paid, the account is LOCKED: its
 *    published site is frozen (SUSPENDED) and teacher actions are blocked until
 *    they subscribe.
 *  - Additional websites cost ₪199/mo each — modelled as extra paid "seats"
 *    (`websiteQuota`, = the Stripe subscription quantity once billing is live).
 */

/** Days the first website is free, from signup. */
export const TRIAL_DAYS = env.TRIAL_DAYS;
/** Price per website per month, in ₪ — after the free month / for extra sites. */
export const WEBSITE_PRICE = 199;

export type AccountState = {
  plan: 'FREE' | 'PRO' | 'STUDIO';
  status: string;
  /** true while the FREE month is still running. */
  onTrial: boolean;
  /** whole days left in the trial (0 when not on trial / expired). */
  trialDaysLeft: number;
  trialEndsAt: Date | null;
  /** true when the account is on an active paid plan. */
  paid: boolean;
  /** number of live websites the account is entitled to right now. */
  quota: number;
  websiteCount: number;
  publishedCount: number;
  /** can the account create one more website without paying? */
  canAddWebsite: boolean;
  /** true when the account has no entitlement (trial over / not paid) → frozen. */
  locked: boolean;
  /** ₪ price per additional website / to re-activate. */
  websitePrice: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getAccountState(userId: string): Promise<AccountState> {
  const [sub, websiteCount, publishedCount] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.website.count({ where: { userId } }),
    prisma.website.count({ where: { userId, status: 'PUBLISHED' } }),
  ]);

  const now = Date.now();
  const plan = (sub?.plan ?? 'FREE') as AccountState['plan'];
  const status = sub?.status ?? 'ACTIVE';
  const trialEndsAt = sub?.trialEndsAt ?? null;

  // A paid account is one on a non-FREE plan that Stripe hasn't cancelled/lapsed.
  const paid = plan !== 'FREE' && (status === 'ACTIVE' || status === 'TRIALING' || status === 'PAST_DUE');

  const onTrial = plan === 'FREE' && !!trialEndsAt && trialEndsAt.getTime() > now;
  const trialDaysLeft = onTrial ? Math.max(0, Math.ceil((trialEndsAt!.getTime() - now) / DAY_MS)) : 0;

  // Entitlement: paid → the seats they bought (≥1); on trial → 1; otherwise 0.
  const quota = paid ? Math.max(1, sub?.websiteQuota ?? 1) : onTrial ? 1 : 0;
  const canAddWebsite = websiteCount < quota;
  // Locked = the account has run out of entitlement. (A brand-new account with 0
  // websites and an active trial is NOT locked — quota is 1.)
  const locked = quota === 0;

  return {
    plan,
    status,
    onTrial,
    trialDaysLeft,
    trialEndsAt,
    paid,
    quota,
    websiteCount,
    publishedCount,
    canAddWebsite,
    locked,
    websitePrice: WEBSITE_PRICE,
  };
}

import { nanoid } from 'nanoid';
import { kv } from '../../lib/redis.js';
import { env } from '../../config/env.js';
import { tooMany } from '../../utils/errors.js';

const TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
const RATE_WINDOW_SECONDS = 60 * 60; // 1 hour
const RATE_MAX = 5; // 5 tokens per email per hour

interface MagicPayload {
  email: string;
  websiteId: string;
}

/**
 * Generate a one-time, website-scoped magic token for an email.
 * Rate-limited to 5 per email per hour. Returns the token + ready-to-send URL.
 */
export async function generateMagicToken(
  email: string,
  websiteId: string,
  websiteSlug: string
): Promise<{ token: string; url: string }> {
  const normalized = email.trim().toLowerCase();
  const rateKey = `magic-rate:${normalized}`;
  const count = await kv.incrWithExpiry(rateKey, RATE_WINDOW_SECONDS);
  if (count > RATE_MAX) {
    throw tooMany('Too many magic-link requests for this email. Try again later.', 'MAGIC_RATE_LIMITED');
  }

  const token = nanoid(32);
  const payload: MagicPayload = { email: normalized, websiteId };
  await kv.setex(`magic:${token}`, TOKEN_TTL_SECONDS, JSON.stringify(payload));

  const url = `${env.FRONTEND_URL}/p/${websiteSlug}/book-lesson?token=${token}`;
  return { token, url };
}

/** Atomically consume (validate + invalidate) a magic token. Returns payload or null. */
export async function consumeMagicToken(token: string): Promise<MagicPayload | null> {
  if (!token) return null;
  const raw = await kv.getdel(`magic:${token}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MagicPayload;
  } catch {
    return null;
  }
}

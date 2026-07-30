import type { NextFunction, Request, Response } from 'express';
import { kv } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import { tooMany } from '../utils/errors.js';
import { isTest } from '../config/env.js';

/** Last time each limiter warned that it had failed open, so an outage can't flood the log. */
const lastWarnAt = new Map<string, number>();

interface RateLimitOptions {
  windowSeconds: number;
  max: number;
  keyPrefix: string;
  /** Derive the rate-limit subject (defaults to client IP). */
  keyFn?: (req: Request) => string;
}

/**
 * The rate-limit subject IP. Uses Express's `req.ip`, which — with
 * `app.set('trust proxy', 1)` — is the real client address (the last hop appended
 * by our own proxy). We deliberately do NOT parse `X-Forwarded-For` ourselves: its
 * FIRST token is fully attacker-controlled, so trusting it let anyone rotate the
 * rate-limit key per request by spoofing the header, defeating every IP-keyed limit.
 */
export function clientIp(req: Request): string {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

/** Sliding-window-ish fixed-window rate limiter backed by the KV store. */
export function rateLimit(opts: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (isTest) return next(); // bypass during the integration suite
    try {
      const subject = opts.keyFn ? opts.keyFn(req) : clientIp(req);
      const key = `rl:${opts.keyPrefix}:${subject}`;
      const count = await kv.incrWithExpiry(key, opts.windowSeconds);
      res.setHeader('X-RateLimit-Limit', String(opts.max));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, opts.max - count)));
      if (count > opts.max) {
        return next(tooMany(`Rate limit exceeded. Try again in ${opts.windowSeconds}s.`));
      }
      next();
    } catch (err) {
      // Fail OPEN: blocking real customers because our own counter broke is worse than
      // briefly losing the limit. But it must be LOUD (E-06) — this used to swallow the
      // error silently, so a Redis outage removed every rate limit (login brute-force,
      // enrolment guessing, email flooding) with nothing in the logs to say so. Throttled
      // to one line a minute per limiter so an outage can't itself flood the log.
      const now = Date.now();
      const last = lastWarnAt.get(opts.keyPrefix) ?? 0;
      if (now - last > 60_000) {
        lastWarnAt.set(opts.keyPrefix, now);
        logger.error(
          `RATE LIMIT DISABLED for "${opts.keyPrefix}" — the counter store is failing, so ` +
            `requests are passing unchecked: ${(err as Error).message}`
        );
      }
      next();
    }
  };
}

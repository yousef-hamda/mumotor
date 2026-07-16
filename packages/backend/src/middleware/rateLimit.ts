import type { NextFunction, Request, Response } from 'express';
import { kv } from '../lib/redis.js';
import { tooMany } from '../utils/errors.js';
import { isTest } from '../config/env.js';

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
    } catch {
      // Never block a request because the limiter itself failed.
      next();
    }
  };
}

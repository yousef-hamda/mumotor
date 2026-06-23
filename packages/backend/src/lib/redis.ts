import Redis from 'ioredis';
import { env } from '../config/env.js';
import { logger } from './logger.js';

/**
 * A tiny key/value store used for magic-link tokens and per-actor rate limits.
 * Backed by Redis when REDIS_URL is set and reachable, otherwise an in-memory
 * fallback so the app runs standalone with zero external services.
 */
export interface KVStore {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<void>;
  /** Atomic get-then-delete (one-time-use tokens, TOCTOU-safe). */
  getdel(key: string): Promise<string | null>;
  del(key: string): Promise<void>;
  /** Increment a counter, set TTL on first creation, return the new value. */
  incrWithExpiry(key: string, seconds: number): Promise<number>;
  isRedis: boolean;
}

class RedisStore implements KVStore {
  isRedis = true;
  constructor(private client: Redis) {}

  async get(key: string) {
    return this.client.get(key);
  }
  async setex(key: string, seconds: number, value: string) {
    await this.client.set(key, value, 'EX', seconds);
  }
  async getdel(key: string) {
    // GETDEL is available in Redis 6.2+; emulate via MULTI for older servers.
    const client = this.client as Redis & { getdel?: (k: string) => Promise<string | null> };
    if (typeof client.getdel === 'function') {
      try {
        return await client.getdel(key);
      } catch {
        /* fall through to MULTI */
      }
    }
    const res = await this.client.multi().get(key).del(key).exec();
    const value = res?.[0]?.[1];
    return (value as string | null) ?? null;
  }
  async del(key: string) {
    await this.client.del(key);
  }
  async incrWithExpiry(key: string, seconds: number) {
    const count = await this.client.incr(key);
    if (count === 1) await this.client.expire(key, seconds);
    return count;
  }
}

class MemoryStore implements KVStore {
  isRedis = false;
  private store = new Map<string, { value: string; expiresAt: number }>();

  private isExpired(entry: { expiresAt: number }) {
    return entry.expiresAt !== 0 && entry.expiresAt < Date.now();
  }
  private sweep(key: string) {
    const e = this.store.get(key);
    if (e && this.isExpired(e)) this.store.delete(key);
  }

  async get(key: string) {
    this.sweep(key);
    return this.store.get(key)?.value ?? null;
  }
  async setex(key: string, seconds: number, value: string) {
    this.store.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
  }
  async getdel(key: string) {
    this.sweep(key);
    const v = this.store.get(key)?.value ?? null;
    this.store.delete(key);
    return v;
  }
  async del(key: string) {
    this.store.delete(key);
  }
  async incrWithExpiry(key: string, seconds: number) {
    this.sweep(key);
    const existing = this.store.get(key);
    const next = existing ? String(Number(existing.value) + 1) : '1';
    const expiresAt = existing ? existing.expiresAt : Date.now() + seconds * 1000;
    this.store.set(key, { value: next, expiresAt });
    return Number(next);
  }
}

function build(): KVStore {
  if (env.REDIS_URL) {
    try {
      const client = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 2,
        lazyConnect: false,
        retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
      });
      client.on('error', (err) => logger.warn('Redis error', err.message));
      client.on('connect', () => logger.info('Redis connected'));
      return new RedisStore(client);
    } catch (err) {
      logger.warn('Failed to init Redis, using in-memory store', (err as Error).message);
    }
  }
  logger.info('Using in-memory KV store (set REDIS_URL to enable Redis)');
  return new MemoryStore();
}

export const kv: KVStore = build();

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars').optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Redis (optional — falls back to in-memory store if unset/unreachable)
  REDIS_URL: z.string().optional(),

  // Public URLs
  APP_URL: z.string().default('http://localhost:4000'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // Email — RESEND_API_KEY sends via Resend's HTTPS API (works on hosts that
  // block outbound SMTP ports, e.g. Railway); otherwise SMTP_* is used, and
  // with neither set mail falls back to the console transport.
  RESEND_API_KEY: z.string().optional(),
  // SMTP (optional — falls back to console transport if unset)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.coerce.boolean().default(false),
  EMAIL_FROM: z.string().default('Mumotor Driving School <no-reply@mumotor.local>'),

  // Stripe (billing runs in demo mode when these are unset)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_STUDIO: z.string().optional(),
  // Per-website price (₪) charged after the free month — Stripe-ready, display + copy.
  STRIPE_PRICE_WEBSITE: z.string().optional(),

  // Free trial: how many days the first website is free from signup (default 30).
  TRIAL_DAYS: z.coerce.number().int().min(1).max(365).default(30),

  // Unsplash (photo search proxy — used by Customize "find a photo").
  // Only the access key is used (sent as a Client-ID); no secret is stored.
  UNSPLASH_ACCESS_KEY: z.string().optional(),

  // Toggle cron jobs (off during tests)
  ENABLE_CRON: z
    .union([z.boolean(), z.string()])
    .transform((v) => v === true || v === 'true')
    .default(true),

  // Wall-clock timezone for the daily rhythm (booking-open email, teacher report,
  // booking-window gate). Israel by default — the target market. Everything else
  // (slots/dates/cutoff) stays UTC.
  APP_TIMEZONE: z.string().default('Asia/Jerusalem'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const data = parsed.data;
const prod = data.NODE_ENV === 'production';

// --- Production hard requirements (fail fast, never fall back) --------------
const DEV_JWT_FALLBACK = 'dev-secret-change-me-in-production';
if (prod) {
  if (!data.JWT_SECRET || data.JWT_SECRET.length < 32 || data.JWT_SECRET === DEV_JWT_FALLBACK) {
    console.error('❌ JWT_SECRET is required in production (min 32 chars, no dev fallback).');
    console.error('   Generate one with: openssl rand -hex 32');
    process.exit(1);
  }
  if (data.STRIPE_SECRET_KEY && !data.STRIPE_WEBHOOK_SECRET) {
    console.error('❌ STRIPE_WEBHOOK_SECRET is required when STRIPE_SECRET_KEY is set in production');
    console.error('   (without it, anyone could forge subscription webhooks).');
    process.exit(1);
  }
} else if (!data.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set — using an insecure dev fallback (dev/test only).');
}

export const env = { ...data, JWT_SECRET: data.JWT_SECRET ?? DEV_JWT_FALLBACK };
export const isProd = prod;
export const isTest = data.NODE_ENV === 'test';

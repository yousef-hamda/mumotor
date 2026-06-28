import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars').default('dev-secret-change-me-in-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Redis (optional — falls back to in-memory store if unset/unreachable)
  REDIS_URL: z.string().optional(),

  // Public URLs
  APP_URL: z.string().default('http://localhost:4000'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

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

  // Unsplash (photo search proxy — used by Customize "find a photo").
  // Only the access key is used (sent as a Client-ID); no secret is stored.
  UNSPLASH_ACCESS_KEY: z.string().optional(),

  // Toggle cron jobs (off during tests)
  ENABLE_CRON: z
    .union([z.boolean(), z.string()])
    .transform((v) => v === true || v === 'true')
    .default(true),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { existsSync } from 'node:fs';
import path from 'node:path';
import routes from './routes/index.js';
import siteServingRoutes from './routes/siteServing.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';
import { uploadsDir } from './lib/uploads.js';
import { logger } from './lib/logger.js';
import { stripeWebhookHandler } from './services/billing/stripeWebhook.js';

/** Locate the built frontend (for single-service Railway deploys). Null in dev. */
function resolveFrontendDist(): string | null {
  const candidates = [
    process.env.FRONTEND_DIST,
    path.resolve(process.cwd(), 'packages/frontend/dist'),
    path.resolve(process.cwd(), '../frontend/dist'),
    path.resolve(process.cwd(), 'frontend/dist'),
  ].filter(Boolean) as string[];
  return candidates.find((p) => existsSync(path.join(p, 'index.html'))) ?? null;
}
const frontendDist = resolveFrontendDist();

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  // Flexible CORS: localhost, the configured frontend, and the platform's
  // production domains (mumotor.com + per-teacher subdomains, Vercel, Railway).
  const allowed = [/^https?:\/\/localhost(:\d+)?$/, /^https?:\/\/127\.0\.0\.1(:\d+)?$/];
  const prodHosts = [/\.mumotor\.com$/, /mumotor\.com$/, /\.vercel\.app$/, /\.up\.railway\.app$/];
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true); // same-origin / curl / server-to-server
        if (origin === env.FRONTEND_URL) return cb(null, true);
        if (allowed.some((r) => r.test(origin))) return cb(null, true);
        if (prodHosts.some((r) => r.test(new URL(origin).host))) return cb(null, true);
        return cb(null, true); // permissive in this build; tighten with an allowlist in prod
      },
      credentials: true,
    })
  );
  // Stripe webhook needs the raw body — register BEFORE the JSON parser.
  app.post('/api/checkout/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));
  app.use('/api', routes);
  app.use('/api', notFoundHandler); // JSON 404 for unknown API routes
  app.use(siteServingRoutes); // GET /site/:slug (published teacher sites)

  // Single-service deploy (Railway-only): serve the built SPA from this server.
  // /api, /site and /uploads are handled above; everything else → the SPA shell.
  if (frontendDist) {
    logger.info(`Serving frontend SPA from ${frontendDist}`);
    app.use(express.static(frontendDist, { index: false, maxAge: '1h' }));
    app.get('*', (_req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
  } else {
    app.get('/', (_req, res) => res.json({ name: 'Mumotor API', docs: '/api/health' }));
    app.use(notFoundHandler);
  }

  app.use(errorHandler);

  return app;
}

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { existsSync } from 'node:fs';
import path from 'node:path';
import routes from './routes/index.js';
import siteServingRoutes from './routes/siteServing.js';
import seoRoutes from './routes/seo.js';
import contentRoutes from './routes/content.js';
import prerenderRoutes from './routes/prerender.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { rateLimit } from './middleware/rateLimit.js';
import { env, isProd } from './config/env.js';
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

  // Canonical host: redirect www.* → the apex so the app has ONE origin. This fixes
  // Google sign-in `origin_mismatch` when a visitor lands on www (only the apex is a
  // registered OAuth JS origin) and is the canonical host for SEO. GET/HEAD only, so a
  // 301 never method-changes an API POST. The apex/localhost/internal healthcheck host
  // don't start with "www." → untouched (no redirect loop).
  app.use((req, res, next) => {
    const host = req.hostname;
    if ((req.method === 'GET' || req.method === 'HEAD') && host.startsWith('www.')) {
      return res.redirect(301, `https://${host.slice(4)}${req.originalUrl}`);
    }
    next();
  });

  // Security headers on every response (CSP is intentionally omitted: published
  // teacher sites and the SPA rely on inline styles/scripts).
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (isProd) res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    next();
  });

  // CORS allowlist: the configured frontend + the platform's production domains
  // (mumotor.com + per-teacher subdomains, Vercel, Railway). Localhost only
  // outside production. Unknown origins get no CORS headers (browser blocks).
  const devOrigins = [/^https?:\/\/localhost(:\d+)?$/, /^https?:\/\/127\.0\.0\.1(:\d+)?$/];
  // Exact hosts only — a `*.vercel.app`-style wildcard would make ANY free
  // deployment a credentialed origin (a standing CSRF trap if cookie auth ever
  // returns). The app's own Railway host comes from the platform env.
  const prodHosts = [/(^|\.)mumotor\.com$/];
  const selfHost = process.env.RAILWAY_PUBLIC_DOMAIN || null;
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true); // same-origin / curl / server-to-server
        if (origin === env.FRONTEND_URL) return cb(null, true);
        if (!isProd && devOrigins.some((r) => r.test(origin))) return cb(null, true);
        try {
          const host = new URL(origin).host;
          if (prodHosts.some((r) => r.test(host))) return cb(null, true);
          if (selfHost && host === selfHost) return cb(null, true);
        } catch {
          /* malformed Origin header → not allowed */
        }
        return cb(null, false);
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
  // Baseline per-IP backstop across the whole API — a generous ceiling that never
  // touches normal dashboard/booking traffic but caps any single IP flooding a route
  // that lacks its own (tighter) limiter. Per-route limits still apply on top.
  app.use('/api', rateLimit({ keyPrefix: 'api-global', windowSeconds: 60, max: 1000 }));
  app.use('/api', routes);
  app.use('/api', notFoundHandler); // JSON 404 for unknown API routes
  // These public routers live OUTSIDE /api, so the global backstop above never
  // sees them — and a cache-missed /site/:slug (or /sitemap.xml) costs a DB
  // query per request. Generous per-IP ceiling; humans never get near it.
  app.use(
    ['/site', '/robots.txt', '/sitemap.xml', '/llms.txt', '/llms-full.txt', '/guides', '/he/guides', '/ar/guides'],
    rateLimit({ keyPrefix: 'public-pages', windowSeconds: 60, max: 300 })
  );
  app.use(siteServingRoutes); // GET /site/:slug (published teacher sites)
  app.use(seoRoutes); // GET /robots.txt + /sitemap.xml + /llms.txt (search + AI engines)
  app.use(contentRoutes); // GET /guides + /guides/:slug (server-rendered GEO content, trilingual)
  app.use(prerenderRoutes); // bot-only server-rendered snapshots of / and /templates

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

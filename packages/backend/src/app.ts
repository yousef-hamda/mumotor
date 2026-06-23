import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import siteServingRoutes from './routes/siteServing.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  // Flexible CORS: localhost, the configured frontend, and the platform's
  // production domains (drivesawa.com + per-teacher subdomains, Vercel, Railway).
  const allowed = [/^https?:\/\/localhost(:\d+)?$/, /^https?:\/\/127\.0\.0\.1(:\d+)?$/];
  const prodHosts = [/\.drivesawa\.com$/, /drivesawa\.com$/, /\.vercel\.app$/, /\.up\.railway\.app$/];
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
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get('/', (_req, res) => res.json({ name: 'DriveSawa API', docs: '/api/health' }));
  app.use('/api', routes);
  app.use(siteServingRoutes); // GET /site/:slug (published teacher sites)

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

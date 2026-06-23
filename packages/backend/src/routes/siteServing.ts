import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { kv } from '../lib/redis.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const CACHE_TTL = 300; // 5 minutes

function notFoundHtml(slug: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Not found</title>
  <style>body{font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;background:#fafafa;color:#18181b;text-align:center}</style></head>
  <body><div><h1 style="font-size:48px;margin:0">404</h1>
  <p style="color:#71717a">No published site found at <code>/${slug}</code>.</p></div></body></html>`;
}

// GET /site/:slug — serve a teacher's published website (Redis-cached HTML)
router.get(
  '/site/:slug',
  asyncHandler(async (req, res) => {
    const slug = req.params.slug;
    const cacheKey = `site:${slug}`;

    const cached = await kv.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT').type('html').send(cached);
      return;
    }

    const website = await prisma.website.findUnique({ where: { slug } });
    if (!website || website.status !== 'PUBLISHED' || !website.publishedHtml) {
      res.status(404).type('html').send(notFoundHtml(slug));
      return;
    }

    await kv.setex(cacheKey, CACHE_TTL, website.publishedHtml);
    res.set('X-Cache', 'MISS').type('html').send(website.publishedHtml);
  })
);

export default router;

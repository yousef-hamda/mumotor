import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/** Public origin the app is reachable at (no trailing slash). */
const baseUrl = env.FRONTEND_URL.replace(/\/+$/, '');

const xmlEscape = (s: string) =>
  s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string));

// GET /robots.txt — crawlers may index the marketing pages and published
// teacher sites; the private app surface stays out of search results.
router.get('/robots.txt', (_req, res) => {
  res
    .type('text/plain')
    .send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        'Disallow: /uploads/',
        'Disallow: /dashboard',
        'Disallow: /admin',
        'Disallow: /builder',
        'Disallow: /customize/',
        'Disallow: /editor/',
        'Disallow: /login',
        'Disallow: /register',
        '',
        `Sitemap: ${baseUrl}/sitemap.xml`,
        '',
      ].join('\n')
    );
});

// GET /sitemap.xml — marketing pages + every published teacher site.
router.get(
  '/sitemap.xml',
  asyncHandler(async (_req, res) => {
    const sites = await prisma.website.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    const staticPages = [
      { loc: `${baseUrl}/`, priority: '1.0' },
      { loc: `${baseUrl}/templates`, priority: '0.8' },
    ];

    const urls = [
      ...staticPages.map(
        (p) => `<url><loc>${xmlEscape(p.loc)}</loc><changefreq>weekly</changefreq><priority>${p.priority}</priority></url>`
      ),
      ...sites.map(
        (s) =>
          `<url><loc>${xmlEscape(`${baseUrl}/p/${s.slug}`)}</loc><lastmod>${s.updatedAt.toISOString().slice(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
      ),
    ];

    res
      .type('application/xml')
      .set('Cache-Control', 'public, max-age=3600')
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
      );
  })
);

export default router;

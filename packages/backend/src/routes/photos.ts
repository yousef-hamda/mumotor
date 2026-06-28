import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { env } from '../config/env.js';

const router = Router();

const querySchema = z.object({
  q: z.string().min(1).max(80),
  page: z.coerce.number().min(1).max(20).default(1),
  per_page: z.coerce.number().min(1).max(30).default(12),
  orientation: z.enum(['landscape', 'portrait', 'squarish']).optional(),
});

interface UnsplashPhoto {
  id: string;
  alt_description: string | null;
  urls: { thumb: string; small: string; regular: string };
  user: { name: string; links: { html: string } };
  links: { download_location: string };
}

// GET /api/photos/search?q=&page=&per_page=&orientation=
router.get(
  '/search',
  rateLimit({ keyPrefix: 'photos', windowSeconds: 60, max: 40 }),
  asyncHandler(async (req, res) => {
    if (!env.UNSPLASH_ACCESS_KEY) {
      res.status(503).json({ error: 'Photo search is not configured', code: 'NO_PHOTO_PROVIDER' });
      return;
    }
    const { q, page, per_page, orientation } = querySchema.parse(req.query);
    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', q);
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', String(per_page));
    url.searchParams.set('content_filter', 'high');
    if (orientation) url.searchParams.set('orientation', orientation);

    const r = await fetch(url, {
      headers: { Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}`, 'Accept-Version': 'v1' },
    });
    if (!r.ok) {
      res.status(502).json({ error: 'Photo provider error', code: 'PHOTO_PROVIDER_ERROR', status: r.status });
      return;
    }
    const data = (await r.json()) as { results: UnsplashPhoto[]; total: number };
    const results = (data.results ?? []).map((p) => ({
      id: p.id,
      alt: p.alt_description ?? q,
      thumb: p.urls.thumb,
      small: p.urls.small,
      regular: p.urls.regular,
      author: p.user?.name ?? 'Unsplash',
      authorUrl: p.user?.links?.html ?? 'https://unsplash.com',
      downloadLocation: p.links?.download_location ?? null,
    }));
    res.json({ results, total: data.total ?? results.length });
  })
);

export default router;

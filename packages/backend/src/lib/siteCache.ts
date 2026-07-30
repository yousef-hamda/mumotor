import { kv } from './redis.js';

/**
 * Every cache key derived from a site's slug, in one place.
 *
 * These keys were previously listed inline at five call sites (publish, unpublish, patch,
 * delete, freeze/restore). Adding a sixth cached artefact meant remembering all five — and
 * a missed one serves stale branding for up to the TTL, which is invisible in testing and
 * confusing in production ("I republished and the WhatsApp preview still shows the old
 * name"). Add new slug-derived caches HERE and every call site picks them up.
 */
export const SITE_CACHE_KEYS = (slug: string): string[] => [
  `site:${slug}`, // legacy server-generated page HTML
  `manifest:${slug}:path`, // PWA manifest, apex (/p/:slug scope)
  `manifest:${slug}:sub`, // PWA manifest, subdomain scope
  `icon:${slug}`, // generated maskable app icon
  `pmeta:${slug}`, // SPA shell with the teacher's head tags
  `pbot:${slug}`, // server-rendered content for non-JS crawlers
];

/** Drop every cached artefact for a site. Safe to call when nothing is cached. */
export async function clearSiteCache(slug: string): Promise<void> {
  await Promise.all(SITE_CACHE_KEYS(slug).map((k) => kv.del(k)));
}

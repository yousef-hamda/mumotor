import { prisma } from '../../lib/prisma.js';
import { kv } from '../../lib/redis.js';

/** Drop every cache key derived from a site's slug (HTML + PWA manifest/icon). */
async function clearSiteCache(slug: string): Promise<void> {
  await Promise.all([
    kv.del(`site:${slug}`),
    kv.del(`manifest:${slug}:path`),
    kv.del(`manifest:${slug}:sub`),
    kv.del(`icon:${slug}`),
  ]);
}

/**
 * Freeze all of a user's live sites (PUBLISHED → SUSPENDED) and drop their caches
 * so they go dark immediately. Used when a free month lapses. Data is untouched —
 * only the status flips, so it's fully reversible with restoreUserSites().
 */
export async function freezeUserSites(userId: string): Promise<number> {
  const sites = await prisma.website.findMany({
    where: { userId, status: 'PUBLISHED' },
    select: { id: true, slug: true },
  });
  if (!sites.length) return 0;
  await prisma.website.updateMany({
    where: { id: { in: sites.map((s) => s.id) } },
    data: { status: 'SUSPENDED' },
  });
  await Promise.all(sites.map((s) => clearSiteCache(s.slug)));
  return sites.length;
}

/**
 * Bring a user's frozen sites back online (SUSPENDED → PUBLISHED) once they pay.
 * Only sites that still have published HTML are restored (a DRAFT stays a draft).
 */
export async function restoreUserSites(userId: string): Promise<number> {
  const sites = await prisma.website.findMany({
    where: { userId, status: 'SUSPENDED', publishedHtml: { not: null } },
    select: { id: true, slug: true },
  });
  if (!sites.length) return 0;
  await prisma.website.updateMany({
    where: { id: { in: sites.map((s) => s.id) } },
    data: { status: 'PUBLISHED' },
  });
  await Promise.all(sites.map((s) => clearSiteCache(s.slug)));
  return sites.length;
}

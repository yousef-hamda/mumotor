import { prisma } from '../../lib/prisma.js';
import { clearSiteCache } from '../../lib/siteCache.js';
import { getAccountState } from './accountState.js';

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
 * Only sites that still have published HTML are restored (a DRAFT stays a draft),
 * and never more than the seats the account is entitled to right now.
 */
export async function restoreUserSites(userId: string): Promise<number> {
  const state = await getAccountState(userId);
  const room = Math.max(0, state.quota - state.publishedCount);
  if (!room) return 0;
  const sites = await prisma.website.findMany({
    where: { userId, status: 'SUSPENDED', publishedHtml: { not: null } },
    select: { id: true, slug: true },
    orderBy: { createdAt: 'asc' },
    take: room,
  });
  if (!sites.length) return 0;
  await prisma.website.updateMany({
    where: { id: { in: sites.map((s) => s.id) } },
    data: { status: 'PUBLISHED' },
  });
  await Promise.all(sites.map((s) => clearSiteCache(s.slug)));
  return sites.length;
}

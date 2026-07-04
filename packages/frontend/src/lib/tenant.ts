import { useParams } from 'react-router-dom';

/**
 * Per-teacher subdomains: a published site is reachable at `{slug}.mumotor.com`
 * (and `{slug}.localhost:<port>` in dev) as well as the shared `mumotor.com/p/{slug}`
 * path. This resolves the tenant slug from the hostname so the whole student
 * experience (site + enroll + booking + account) can run under the teacher's own
 * subdomain. Returns null on the apex/app host, where the normal app renders.
 */

// Hosts that are the platform itself, never a teacher.
const RESERVED = new Set(['www', 'app', 'api', 'mumotor', 'admin', 'staging', '']);

export function getTenantSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname; // no port
  let sub: string | null = null;

  if (host.endsWith('.localhost')) {
    // dev: davids-driving.localhost
    sub = host.split('.')[0];
  } else if (host.endsWith('.mumotor.com')) {
    // prod: davids-driving.mumotor.com  (apex mumotor.com has no leading label)
    const parts = host.split('.');
    if (parts.length >= 3) sub = parts[0];
  }

  if (!sub || RESERVED.has(sub)) return null;
  return sub;
}

/** True when the app is running under a teacher's own subdomain. */
export function isTenantHost(): boolean {
  return getTenantSlug() !== null;
}

/**
 * The active site slug for public/student pages: the `/p/:websiteSlug` route
 * param when present, otherwise the subdomain. Lets one component serve both
 * `mumotor.com/p/{slug}/account` and `{slug}.mumotor.com/account`.
 */
export function useTenantSlug(): string {
  const { websiteSlug } = useParams();
  return websiteSlug ?? getTenantSlug() ?? '';
}

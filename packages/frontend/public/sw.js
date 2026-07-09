/*
 * Mumotor service worker — makes the app + every teacher site installable and
 * fast on repeat visits, WITHOUT ever serving stale data.
 *
 * Caching contract (deliberately conservative — see CLAUDE.md "Installable PWA"):
 *   • /api/*, /uploads/*, /site/*, *.webmanifest  → NOT handled here → network
 *     (always-fresh booking data + always-fresh per-teacher dynamic manifest).
 *   • navigations (mode: 'navigate')              → network-first, offline → cached app shell.
 *   • other same-origin GETs (hashed JS/CSS/img)  → stale-while-revalidate.
 *   • cross-origin (Google Fonts, etc.)           → NOT handled → network.
 *
 * Bump CACHE_VERSION whenever this file changes so old caches are pruned.
 */
const CACHE_VERSION = 'mm-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const SHELL_URL = '/index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(['/', SHELL_URL]))
      .catch(() => undefined)
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// Lets the app trigger an immediate update after a new SW is installed.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isBypassed(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/uploads/') ||
    url.pathname.startsWith('/site/') ||
    url.pathname.endsWith('.webmanifest')
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // cross-origin → network
  if (isBypassed(url)) return; // never cache API/uploads/site HTML/manifests

  // Navigations → network-first, fall back to the cached app shell offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match(SHELL_URL)) || (await cache.match('/')) || Response.error();
      })
    );
    return;
  }

  // Static assets → stale-while-revalidate.
  event.respondWith(
    (async () => {
      const cache = await caches.open(ASSET_CACHE);
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })()
  );
});

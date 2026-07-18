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

/** On-brand "temporarily paused" page for a frozen site (uses its own template colours). */
function pausedHtml(name: string, template: string | null, theme: Record<string, unknown>): string {
  const c = resolveSiteColors(template, theme);
  const onAccent = luminance(c.accent) > 0.55 ? '#000' : '#fff';
  const safe = escapeXml(name || 'This site');
  const initial = escapeXml(siteInitial(name || 'M'));
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safe} — paused</title>
  <style>*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;margin:0;min-height:100vh;min-height:100dvh;display:grid;place-items:center;background:${c.bg};color:${c.ink};text-align:center;padding:24px}
  .badge{width:76px;height:76px;border-radius:22px;display:grid;place-items:center;background:${c.accent};color:${onAccent};font-size:38px;font-weight:700;margin:0 auto 22px;box-shadow:0 12px 40px -12px ${c.accent}66}
  h1{font-size:clamp(24px,5vw,32px);font-weight:600;letter-spacing:-.02em;margin:0 0 10px}
  p{max-width:30rem;margin:0 auto;color:${c.ink};opacity:.62;font-size:16px;line-height:1.55}</style></head>
  <body><div><div class="badge">${initial}</div>
  <h1>${safe} is taking a short break</h1>
  <p>This website is temporarily paused. Please check back soon.</p></div></body></html>`;
}

// ── PWA branding per template ────────────────────────────────────────────────
// Mirrors the frontend COLOR_SLOTS / templateTheme accent map (packages/frontend/
// src/templates/customize/overrides.ts + lib/templateTheme.ts) so the installed
// app's colours match the site the teacher actually chose. Each entry names the
// template's bg / ink / accent CSS vars + their default hex; a teacher's
// `customization.theme` override (keyed by CSS var → hex) wins when present.
type ThemeSpec = { bg: [string, string]; ink: [string, string]; accent: [string, string] };
const TEMPLATE_THEME: Record<string, ThemeSpec> = {
  mumotor: { bg: ['--mm-bg', '#FFFFFF'], ink: ['--mm-ink', '#1D1D1F'], accent: ['--mm-accent', '#0071E3'] },
  meridian: { bg: ['--mr-paper', '#E6E7E0'], ink: ['--mr-ink', '#1A1F1D'], accent: ['--mr-route', '#B03060'] },
  bezel: { bg: ['--bz-case', '#16181B'], ink: ['--bz-ink', '#EDEBE6'], accent: ['--bz-signal', '#E5484D'] },
  solari: { bg: ['--sl-board', '#17140F'], ink: ['--sl-text', '#EDE7D8'], accent: ['--sl-amber', '#F5A623'] },
  cadence: { bg: ['--cd-paper', '#F1EFE9'], ink: ['--cd-ink', '#141318'], accent: ['--cd-accent', '#2E22CE'] },
  circuit: { bg: ['--ci-carbon', '#0C0D10'], ink: ['--ci-ink', '#EDF1F5'], accent: ['--ci-red', '#FF2E3D'] },
  press: { bg: ['--ps-paper', '#F1EBDD'], ink: ['--ps-ink', '#1B1A18'], accent: ['--ps-accent', '#1F4D3D'] },
  reel: { bg: ['--rl-bg', '#0B0B0D'], ink: ['--rl-ink', '#F4F1EA'], accent: ['--rl-accent', '#E5533D'] },
  slate: { bg: ['--st-slate', '#1E2622'], ink: ['--st-chalk', '#EDEAE0'], accent: ['--st-accent', '#E4897B'] },
  primary: { bg: ['--pm-paper', '#F0E9DA'], ink: ['--pm-ink', '#161514'], accent: ['--pm-blue', '#2340D9'] },
  gallery: { bg: ['--ga-wall', '#EEEAE1'], ink: ['--ga-ink', '#1C1A17'], accent: ['--ga-accent', '#B5662E'] },
  gilt: { bg: ['--gt-charcoal', '#17161B'], ink: ['--gt-ink', '#EFE9DD'], accent: ['--gt-gold', '#C7A96B'] },
  sumi: { bg: ['--su-paper', '#F2EEE4'], ink: ['--su-ink', '#1A1815'], accent: ['--su-vermilion', '#C4392E'] },
  console: { bg: ['--co-bg', '#0E1013'], ink: ['--co-ink', '#E7EAEE'], accent: ['--co-accent', '#5B8CFF'] },
  transit: { bg: ['--tr-bg', '#F5F6F8'], ink: ['--tr-ink', '#16181D'], accent: ['--tr-line', '#1F5FE0'] },
  ledger: { bg: ['--le-bg', '#F7F7F4'], ink: ['--le-ink', '#14140F'], accent: ['--le-accent', '#0E7C66'] },
  'grid-ink': { bg: ['--paper', '#FAFAF7'], ink: ['--ink', '#111111'], accent: ['--red', '#E4002B'] },
  'open-road': { bg: ['--cream', '#F4E9D8'], ink: ['--brown', '#3A2A1E'], accent: ['--orange', '#D2691E'] },
};
const DEFAULT_THEME: ThemeSpec = TEMPLATE_THEME.mumotor;

/** A safe #rrggbb (or #rgb) hex, else the fallback — never trust stored values into CSS/JSON. */
function safeHex(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())
    ? value.trim()
    : fallback;
}

/** Resolve the site's bg / ink / accent from its template defaults + Customize overrides. */
function resolveSiteColors(template: string | null, theme: Record<string, unknown>) {
  const spec = (template && TEMPLATE_THEME[template]) || DEFAULT_THEME;
  const pick = (slot: [string, string]) => safeHex(theme[slot[0]], slot[1]);
  return { bg: pick(spec.bg), ink: pick(spec.ink), accent: pick(spec.accent) };
}

/** First visible (non-space) character of the site name, uppercased. Falls back to "M". */
function siteInitial(name: string): string {
  const ch = Array.from(name.trim())[0];
  return ch ? ch.toUpperCase() : 'M';
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string));
}

/** A maskable app icon (full-bleed accent, centred initial well inside the 80% safe zone). */
function iconSvg(initial: string, accent: string, onAccent: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img">
  <rect width="512" height="512" fill="${accent}"/>
  <text x="256" y="256" font-family="-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="248" font-weight="700" fill="${onAccent}" text-anchor="middle" dominant-baseline="central">${escapeXml(initial)}</text>
</svg>`;
}

/** Relative luminance (0..1) of a #rgb/#rrggbb hex — picks black vs white foreground. */
function luminance(hex: string): number {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Load the minimal branding needed for the manifest/icon (name, template, theme). */
async function loadSiteBrand(slug: string) {
  const website = await prisma.website.findUnique({ where: { slug } });
  if (!website || website.status !== 'PUBLISHED') return null;
  const raw = (website.configuration ?? {}) as Record<string, unknown>;
  const template = website.selectedPreset ?? (raw.templateChoice as string | undefined) ?? null;
  const customization = (raw.customization as Record<string, unknown> | undefined) ?? {};
  const theme = (customization.theme as Record<string, unknown> | undefined) ?? {};
  const { bg, ink, accent } = resolveSiteColors(template, theme);
  const onAccent = luminance(accent) > 0.6 ? '#141414' : '#FFFFFF';
  return { name: website.name || 'Driving lessons', bg, ink, accent, onAccent };
}

/** True when the request is served from the teacher's own subdomain ({slug}.mumotor.com). */
function isSubdomainHost(req: { headers: Record<string, unknown> }, slug: string): boolean {
  const host = String(req.headers.host ?? '').split(':')[0].toLowerCase();
  return host.split('.')[0] === slug.toLowerCase();
}

// GET /site/:slug/manifest.webmanifest — per-teacher Web App Manifest so an
// installed teacher site becomes THAT instructor's app (own name/colour/icon).
router.get(
  '/site/:slug/manifest.webmanifest',
  asyncHandler(async (req, res) => {
    const slug = req.params.slug;
    const subdomain = isSubdomainHost(req, slug);
    const scope = subdomain ? '/' : `/p/${slug}/`;
    const cacheKey = `manifest:${slug}:${subdomain ? 'sub' : 'path'}`;

    const cached = await kv.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT').type('application/manifest+json').send(cached);
      return;
    }

    const brand = await loadSiteBrand(slug);
    if (!brand) {
      res.status(404).type('application/manifest+json').send('{}');
      return;
    }

    const iconHref = `/site/${slug}/icon.svg`;
    const manifest = {
      id: scope,
      name: brand.name,
      short_name: brand.name.length > 12 ? `${brand.name.slice(0, 11)}…` : brand.name,
      description: `${brand.name} — book driving lessons and manage your account.`,
      start_url: scope,
      scope,
      display: 'standalone',
      orientation: 'portrait',
      background_color: brand.bg,
      theme_color: brand.accent,
      icons: [
        { src: iconHref, sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        { src: iconHref, sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
      ],
    };
    const body = JSON.stringify(manifest);
    await kv.setex(cacheKey, CACHE_TTL, body);
    res.set('X-Cache', 'MISS').type('application/manifest+json').send(body);
  })
);

// GET /site/:slug/icon.svg — generated maskable app icon tinted with the site accent.
router.get(
  '/site/:slug/icon.svg',
  asyncHandler(async (req, res) => {
    const slug = req.params.slug;
    const cacheKey = `icon:${slug}`;

    const cached = await kv.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT').type('image/svg+xml').send(cached);
      return;
    }

    const brand = await loadSiteBrand(slug);
    if (!brand) {
      res.status(404).type('image/svg+xml').send(iconSvg('M', '#0071E3', '#FFFFFF'));
      return;
    }

    const svg = iconSvg(siteInitial(brand.name), brand.accent, brand.onAccent);
    await kv.setex(cacheKey, CACHE_TTL, svg);
    res.set('X-Cache', 'MISS').set('Cache-Control', 'public, max-age=300').type('image/svg+xml').send(svg);
  })
);

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
    // Frozen site (owner's free month lapsed) → on-brand "paused" page, not a 404.
    if (website && website.status === 'SUSPENDED') {
      const raw = (website.configuration ?? {}) as Record<string, unknown>;
      const theme = ((raw.customization as { theme?: Record<string, unknown> } | undefined)?.theme) ?? {};
      res
        .status(503)
        .set('Retry-After', '86400')
        .type('html')
        .send(pausedHtml(website.name, website.selectedPreset ?? (raw.templateChoice as string) ?? null, theme));
      return;
    }
    if (!website || website.status !== 'PUBLISHED' || !website.publishedHtml) {
      res.status(404).type('html').send(notFoundHtml(slug));
      return;
    }

    await kv.setex(cacheKey, CACHE_TTL, website.publishedHtml);
    res.set('X-Cache', 'MISS').type('html').send(website.publishedHtml);
  })
);

export default router;

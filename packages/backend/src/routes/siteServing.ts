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

// ── PWA branding per template ────────────────────────────────────────────────
// Mirrors the frontend COLOR_SLOTS / templateTheme accent map (packages/frontend/
// src/templates/customize/overrides.ts + lib/templateTheme.ts) so the installed
// app's colours match the site the teacher actually chose. Each entry names the
// template's bg / ink / accent CSS vars + their default hex; a teacher's
// `customization.theme` override (keyed by CSS var → hex) wins when present.
type ThemeSpec = { bg: [string, string]; ink: [string, string]; accent: [string, string] };
const TEMPLATE_THEME: Record<string, ThemeSpec> = {
  mumotor: { bg: ['--mm-bg', '#FFFFFF'], ink: ['--mm-ink', '#1D1D1F'], accent: ['--mm-accent', '#0071E3'] },
  aurora: { bg: ['--au-bg', '#F6F8FC'], ink: ['--au-ink', '#0B1220'], accent: ['--au-blue', '#5B8DEF'] },
  obsidian: { bg: ['--ob-bg', '#0B0D10'], ink: ['--ob-ink', '#EAEEF2'], accent: ['--ob-accent', '#9FB6CC'] },
  bento: { bg: ['--bn-bg', '#EEF2F8'], ink: ['--bn-ink', '#0B1220'], accent: ['--bn-accent', '#4F46E5'] },
  prism: { bg: ['--pr-bg', '#101114'], ink: ['--pr-ink', '#F4F5F7'], accent: ['--pr-c1', '#FF4D9D'] },
  frosted: { bg: ['--fr-bg', '#0E1116'], ink: ['--fr-ink', '#0B1220'], accent: ['--fr-accent', '#E8A14B'] },
  'grid-ink': { bg: ['--paper', '#FAFAF7'], ink: ['--ink', '#111111'], accent: ['--red', '#E4002B'] },
  'open-road': { bg: ['--cream', '#F4E9D8'], ink: ['--brown', '#3A2A1E'], accent: ['--orange', '#D2691E'] },
  'night-shift': { bg: ['--ns-bg', '#0A0A0F'], ink: ['--ns-white', '#EAF2FF'], accent: ['--ns-cyan', '#22D3EE'] },
  prestige: { bg: ['--black', '#0C0C0C'], ink: ['--cream', '#F5F1E8'], accent: ['--gold', '#C9A24B'] },
  'full-throttle': { bg: ['--bg', '#F2F0E9'], ink: ['--black', '#000000'], accent: ['--blue', '#2D52FF'] },
  'easy-lane': { bg: ['--bg', '#FFFDFA'], ink: ['--ink', '#243B53'], accent: ['--blue', '#3B82F6'] },
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
    if (!website || website.status !== 'PUBLISHED' || !website.publishedHtml) {
      res.status(404).type('html').send(notFoundHtml(slug));
      return;
    }

    await kv.setex(cacheKey, CACHE_TTL, website.publishedHtml);
    res.set('X-Cache', 'MISS').type('html').send(website.publishedHtml);
  })
);

export default router;

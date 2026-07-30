import { Router } from 'express';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { prisma } from '../lib/prisma.js';
import { kv } from '../lib/redis.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isBot } from './prerender.js';

/**
 * Server-side identity + content for a published teacher site at `/p/:slug` (A-03 / B-01).
 *
 * THE PROBLEM THIS SOLVES. `/p/:slug` is a client-rendered React route, so the HTML that
 * leaves the server is the shared SPA shell — which carries Mumotor's OWN title,
 * description and og:image. A link-preview crawler (WhatsApp, Facebook, Instagram,
 * LinkedIn, Twitter, Slack) never runs JavaScript, so every teacher who shared their own
 * website was publishing an advert for Mumotor: "Mumotor — Websites & booking for driving
 * instructors", over Mumotor's stock photo. In a market where instructors share their
 * business over WhatsApp, that broke the core promise of the product. Non-JS search
 * crawlers saw the same empty shell, while /sitemap.xml told them these pages mattered.
 *
 * THE APPROACH. Two layers, deliberately:
 *
 *  1. EVERY request for /p/:slug gets the SPA shell with the teacher's real <title>,
 *     description, Open Graph + Twitter card tags, canonical and DrivingSchool JSON-LD
 *     substituted in. Humans still get the identical single-page app — only the head
 *     differs — so
 *     there is no second rendering path to keep in sync and no cloaking: bots and humans
 *     are served the same document.
 *
 *  2. A crawler that does not run JavaScript ALSO gets readable body content (headings,
 *     about text, packages with prices, areas covered, opening hours, reviews) instead of
 *     an empty <div id="root">. Google permits this "dynamic rendering" explicitly; the
 *     rule is content parity, which is why every fact below comes from the same stored
 *     configuration the React page renders.
 *
 * Cached in the KV store under `pmeta:` / `pbot:` keys, both dropped on publish/unpublish/
 * delete alongside `site:` and the PWA manifest keys.
 */

const router = Router();
const CACHE_TTL = 300; // 5 minutes, matching the published-HTML cache

/** HTML text escape. Also escapes `'` so a value is safe inside a single-quoted attribute. */
const esc = (s: string) =>
  String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c] as string));

const LOCALE_TAG: Record<string, string> = { HE: 'he', AR: 'ar', EN: 'en' };
const RTL = new Set(['he', 'ar']);

type SiteConfig = {
  tagline?: string;
  teacherName?: string;
  bio?: string;
  city?: string;
  transmission?: string;
  experienceYears?: string | number;
  passRate?: number;
  pricePerClass?: string | number;
  classDuration?: number;
  instructorPhoto?: string;
  carPhoto?: string;
  logoSrc?: string;
  contact?: { phone?: string; email?: string; address?: string };
  plans?: Array<{ name?: string; price?: number; period?: string; features?: string[] }>;
  areas?: Array<{ name?: string } | string>;
  hero?: { sub?: string };
};

/**
 * Only a URL a crawler can actually fetch. A `data:`/`blob:` URL (Customize produces one
 * for an uploaded photo) or a bare relative path is useless as og:image — worse than
 * omitting it, because the preview then renders broken instead of falling back.
 */
function absoluteImage(src: string | undefined, origin: string): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('/')) return `${origin}${src}`;
  return undefined;
}

/**
 * The ONE canonical origin, deliberately not the request's host.
 *
 * A canonical URL and an og:url must be stable — if the same site answered on both the
 * apex and a subdomain and each echoed its own host, search engines would see two
 * competing canonicals for one page and split its ranking. Pinning the configured origin
 * also keeps the render cache to two keys per slug instead of one per host seen, which is
 * what makes eviction on publish reliable.
 */
const CANONICAL_ORIGIN = env.FRONTEND_URL.replace(/\/+$/, '');

async function loadSite(slug: string) {
  return prisma.website.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      tagline: true,
      locale: true,
      status: true,
      selectedPreset: true,
      configuration: true,
      settings: { select: { businessHours: true } },
      reviews: {
        where: { status: 'APPROVED' },
        select: { studentName: true, rating: true, comment: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });
}

type LoadedSite = NonNullable<Awaited<ReturnType<typeof loadSite>>>;

/** The shared facts both layers render, derived once from stored configuration. */
function describe(site: LoadedSite, origin: string) {
  const cfg = (site.configuration ?? {}) as SiteConfig;
  const lang = LOCALE_TAG[site.locale] ?? 'en';
  const teacher = cfg.teacherName?.trim() || site.name;
  const tagline = site.tagline?.trim() || cfg.tagline?.trim() || '';
  const city = cfg.city?.trim() || cfg.contact?.address?.trim() || '';

  const title = tagline ? `${site.name} — ${tagline}` : `${site.name} — Driving lessons`;

  // Prefer the teacher's own words; otherwise state only facts we actually hold.
  const description =
    cfg.bio?.trim().slice(0, 300) ||
    cfg.hero?.sub?.trim().slice(0, 300) ||
    [
      `Book driving lessons with ${teacher}`,
      city ? ` in ${city}` : '',
      '. Check availability and schedule online.',
    ].join('');

  const image =
    absoluteImage(cfg.instructorPhoto, origin) ??
    absoluteImage(cfg.carPhoto, origin) ??
    `${origin}/img/default-lesson.jpg`;

  return {
    lang,
    rtl: RTL.has(lang),
    teacher,
    tagline,
    city,
    title,
    description,
    image,
    url: `${origin}/p/${site.slug}`,
    cfg,
  };
}

/** schema.org DrivingSchool — mirrors the JSON-LD the React page emits (content parity). */
function jsonLd(site: LoadedSite, d: ReturnType<typeof describe>) {
  const prices = (d.cfg.plans ?? []).map((p) => p.price).filter((n): n is number => Number.isFinite(n) && (n as number) > 0);
  const areas = (d.cfg.areas ?? [])
    .map((a) => (typeof a === 'string' ? a : a?.name))
    .filter((s): s is string => Boolean(s));
  const ratings = site.reviews.map((r) => r.rating).filter((n) => Number.isFinite(n));

  return {
    '@context': 'https://schema.org',
    '@type': 'DrivingSchool',
    name: site.name,
    description: d.description,
    url: d.url,
    image: d.image,
    inLanguage: d.lang,
    ...(d.cfg.contact?.phone ? { telephone: d.cfg.contact.phone } : {}),
    ...(d.cfg.contact?.email ? { email: d.cfg.contact.email } : {}),
    ...(d.cfg.contact?.address ? { address: d.cfg.contact.address } : {}),
    ...(prices.length
      ? {
          priceRange:
            Math.min(...prices) === Math.max(...prices)
              ? `₪${Math.min(...prices)}`
              : `₪${Math.min(...prices)}–₪${Math.max(...prices)}`,
        }
      : {}),
    ...(areas.length ? { areaServed: areas } : {}),
    ...(ratings.length
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1),
            reviewCount: ratings.length,
          },
        }
      : {}),
  };
}

/** The <head> block that replaces Mumotor's own tags in the shell. */
function headTags(site: LoadedSite, d: ReturnType<typeof describe>): string {
  return [
    `<title>${esc(d.title)}</title>`,
    `<meta name="description" content="${esc(d.description)}"/>`,
    `<link rel="canonical" href="${esc(d.url)}"/>`,
    `<meta property="og:type" content="website"/>`,
    `<meta property="og:site_name" content="${esc(site.name)}"/>`,
    `<meta property="og:title" content="${esc(d.title)}"/>`,
    `<meta property="og:description" content="${esc(d.description)}"/>`,
    `<meta property="og:url" content="${esc(d.url)}"/>`,
    `<meta property="og:image" content="${esc(d.image)}"/>`,
    `<meta property="og:locale" content="${esc(d.lang)}"/>`,
    `<meta name="twitter:card" content="summary_large_image"/>`,
    `<meta name="twitter:title" content="${esc(d.title)}"/>`,
    `<meta name="twitter:description" content="${esc(d.description)}"/>`,
    `<meta name="twitter:image" content="${esc(d.image)}"/>`,
    `<meta name="apple-mobile-web-app-title" content="${esc(site.name)}"/>`,
    `<link rel="manifest" href="/site/${esc(site.slug)}/manifest.webmanifest"/>`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd(site, d))}</script>`,
  ].join('\n    ');
}

/**
 * Swap the shell's Mumotor identity for this teacher's.
 *
 * Every tag we are about to add is stripped first, so re-running is idempotent and no
 * duplicate og:title can survive (a crawler seeing two would pick arbitrarily). The
 * manifest link is replaced rather than appended for the same reason — two manifests
 * make the installed-app identity non-deterministic.
 */
function personaliseShell(shell: string, site: LoadedSite, d: ReturnType<typeof describe>): string {
  let html = shell
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="description"[^>]*>/gi, '')
    .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '')
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '')
    .replace(/<meta\s+name="apple-mobile-web-app-title"[^>]*>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>/gi, '')
    .replace(/<link\s+rel="manifest"[^>]*>/gi, '');

  // The document language drives font fallback and screen-reader pronunciation.
  html = html.replace(/<html([^>]*)\slang="[^"]*"/i, '<html$1').replace(/<html([^>]*)>/i, `<html$1 lang="${d.lang}"${d.rtl ? ' dir="rtl"' : ''}>`);

  return html.replace(/<\/head>/i, `    ${headTags(site, d)}\n  </head>`);
}

/** Readable body content for a crawler that will not run our JavaScript. */
function botBody(site: LoadedSite, d: ReturnType<typeof describe>): string {
  const cfg = d.cfg;
  const rows: string[] = [];

  rows.push(`<h1>${esc(site.name)}</h1>`);
  if (d.tagline) rows.push(`<p class="lead">${esc(d.tagline)}</p>`);
  rows.push(`<p>${esc(d.description)}</p>`);

  const facts: string[] = [];
  if (d.teacher) facts.push(`Instructor: ${esc(d.teacher)}`);
  if (d.city) facts.push(`Area: ${esc(d.city)}`);
  if (cfg.transmission) facts.push(`Transmission: ${esc(cfg.transmission)}`);
  if (cfg.experienceYears) facts.push(`Experience: ${esc(String(cfg.experienceYears))} years`);
  if (cfg.classDuration) facts.push(`Lesson length: ${esc(String(cfg.classDuration))} minutes`);
  if (cfg.pricePerClass) facts.push(`From ₪${esc(String(cfg.pricePerClass))} per lesson`);
  if (facts.length) rows.push(`<ul>${facts.map((f) => `<li>${f}</li>`).join('')}</ul>`);

  const plans = (cfg.plans ?? []).filter((p) => p?.name);
  if (plans.length) {
    rows.push('<h2>Lessons &amp; packages</h2>');
    rows.push(
      `<ul>${plans
        .map((p) => {
          const price = Number.isFinite(p.price) ? ` — ₪${esc(String(p.price))}${p.period ? ` ${esc(p.period)}` : ''}` : '';
          const feats = (p.features ?? []).filter(Boolean).slice(0, 6);
          return `<li><b>${esc(p.name!)}</b>${price}${feats.length ? `<br>${feats.map(esc).join(' · ')}` : ''}</li>`;
        })
        .join('')}</ul>`
    );
  }

  const areas = (cfg.areas ?? []).map((a) => (typeof a === 'string' ? a : a?.name)).filter(Boolean) as string[];
  if (areas.length) {
    rows.push('<h2>Areas covered</h2>');
    rows.push(`<p>${areas.map(esc).join(' · ')}</p>`);
  }

  const hours = (site.settings?.businessHours ?? {}) as Record<string, { isOpen?: boolean; open?: string; close?: string }>;
  const openDays = Object.entries(hours).filter(([, v]) => v?.isOpen);
  if (openDays.length) {
    rows.push('<h2>Opening hours</h2>');
    rows.push(
      `<ul>${openDays
        .map(([day, v]) => `<li>${esc(day[0].toUpperCase() + day.slice(1))}: ${esc(v.open ?? '')}–${esc(v.close ?? '')}</li>`)
        .join('')}</ul>`
    );
  }

  if (site.reviews.length) {
    rows.push('<h2>Student reviews</h2>');
    rows.push(
      site.reviews
        .map((r) => `<blockquote><p>${esc(r.comment)}</p><footer>${esc(r.studentName)} — ${r.rating}/5</footer></blockquote>`)
        .join('')
    );
  }

  const contact: string[] = [];
  if (cfg.contact?.phone) contact.push(`Phone: ${esc(cfg.contact.phone)}`);
  if (cfg.contact?.email) contact.push(`Email: ${esc(cfg.contact.email)}`);
  if (cfg.contact?.address) contact.push(`Address: ${esc(cfg.contact.address)}`);
  if (contact.length) {
    rows.push('<h2>Contact</h2>');
    rows.push(`<p>${contact.join('<br>')}</p>`);
  }

  rows.push(
    `<h2>Book a lesson</h2><p><a href="${esc(d.url)}/enroll">Enroll with your code</a> · <a href="${esc(d.url)}/book-lesson">Book a lesson</a> · <a href="${esc(d.url)}/account">Your account</a></p>`
  );

  return `<!doctype html>
<html lang="${d.lang}"${d.rtl ? ' dir="rtl"' : ''}>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="index, follow"/>
    ${headTags(site, d)}
<style>
body{margin:0;font:17px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,Arial,sans-serif;color:#1d1d1f}
main{max-width:900px;margin:0 auto;padding:24px}
h1{font-size:clamp(30px,6vw,48px);line-height:1.08;letter-spacing:-.03em;margin:.2em 0 .3em}
h2{font-size:24px;letter-spacing:-.02em;margin:1.8em 0 .4em}
.lead{font-size:20px;color:#444}
ul{padding-inline-start:1.2em}
blockquote{margin:0 0 14px;padding:12px 16px;border:1px solid #e5e5ea;border-radius:10px}
blockquote p{margin:0 0 6px}footer{color:#6e6e73;font-size:14px}
a{color:#0071e3}
</style>
</head>
<body><main>${rows.join('\n')}</main></body></html>`;
}

/**
 * Locate the built SPA shell. Null in dev (Vite serves index.html itself).
 *
 * The shell references HASHED asset filenames (`/assets/index-a1b2c3.js`), which change on
 * every build. That makes a cached copy of the shell deploy-specific — see SHELL_FINGERPRINT.
 */
function resolveShellPath(): string | null {
  const candidates = [
    process.env.FRONTEND_DIST,
    path.resolve(process.cwd(), 'packages/frontend/dist'),
    path.resolve(process.cwd(), '../frontend/dist'),
    path.resolve(process.cwd(), 'frontend/dist'),
  ].filter(Boolean) as string[];
  for (const dir of candidates) {
    const p = path.join(dir, 'index.html');
    try {
      readFileSync(p, 'utf8');
      return p;
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}
const shellPath = resolveShellPath();

/**
 * The shell, read once, plus a fingerprint of its contents.
 *
 * WHY THE FINGERPRINT (caught by e2e/lazy-routes). The personalised shell embeds hashed
 * asset URLs, so caching it makes the cached value valid only for the build that produced
 * it. Without this guard, the first 5 minutes after every deploy served teachers a shell
 * pointing at asset files that no longer existed — the browser got `text/html` back for a
 * `.js`/`.css` request and refused it, leaving a blank, unstyled page. The cache is
 * therefore stamped with the fingerprint and a mismatch is treated as a miss, so a deploy
 * self-invalidates without anyone remembering to flush anything.
 *
 * Read once at module load: a deploy restarts the process, so the file cannot change under
 * a running server, and this avoids a synchronous disk read on every request.
 */
const SHELL_HTML = shellPath ? readFileSync(shellPath, 'utf8') : null;
const SHELL_FINGERPRINT = SHELL_HTML
  ? createHash('sha256').update(SHELL_HTML).digest('hex').slice(0, 12)
  : 'none';

// GET /p/:slug — the published teacher site.
//
// Registered BEFORE the SPA catch-all in app.ts. Sub-paths (/enroll, /book-lesson,
// /account, /review) deliberately fall through to the plain shell: they are private-ish
// action pages, not content anyone shares or should index.
router.get('/p/:slug', asyncHandler(async (req, res, next) => {
  const slug = req.params.slug;
  const bot = isBot(req.get('user-agent'));

  // The crawler snapshot builds its own document, so it works with or without a built
  // SPA shell. Only the human path needs the shell to personalise — in dev there isn't
  // one (Vite serves index.html), so fall through and let the SPA handle it. Keeping the
  // bot path alive in dev matters: it is the half that can be tested without a build.
  if (!bot && !shellPath) return next();
  const cacheKey = `${bot ? 'pbot' : 'pmeta'}:${slug}`;

  // Stamped with the build fingerprint: a cached shell from a previous deploy references
  // asset files that no longer exist, so it must be discarded rather than served.
  const cached = await kv.get(cacheKey);
  if (cached) {
    const split = cached.indexOf('\n');
    const stamp = split === -1 ? '' : cached.slice(0, split);
    if (stamp === SHELL_FINGERPRINT) {
      res.set('X-Cache', 'HIT').type('html').send(cached.slice(split + 1));
      return;
    }
    // Stale build → fall through and re-render (the write below overwrites the key).
  }

  const site = await loadSite(slug);
  // Unknown, draft or frozen → the SPA handles it (it renders the themed paused screen
  // and the not-found state). Never cache that decision here.
  if (!site || site.status !== 'PUBLISHED') return next();

  const d = describe(site, CANONICAL_ORIGIN);
  const html = bot ? botBody(site, d) : personaliseShell(SHELL_HTML!, site, d);

  await kv.setex(cacheKey, CACHE_TTL, `${SHELL_FINGERPRINT}\n${html}`);
  res.set('X-Cache', 'MISS').type('html').send(html);
}));

export default router;

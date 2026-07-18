import { Router } from 'express';
import { env } from '../config/env.js';

/**
 * Dynamic rendering for AI/search crawlers.
 *
 * The landing page and /templates are client-rendered React — a non-JS crawler
 * (GPTBot, PerplexityBot, Google-Extended, ClaudeBot, …) sees only the empty
 * <head>. This middleware detects known crawler user-agents and serves a
 * SERVER-RENDERED HTML snapshot with the SAME substantive content and facts a
 * human sees in the SPA (Google explicitly permits dynamic rendering; the point
 * is content parity, not cloaking — never serve bots different claims). Humans
 * fall through untouched to the SPA. Mounted before express.static / the SPA
 * catch-all in app.ts.
 *
 * NOTE: the copy below mirrors the frontend `landing.*` i18n and the templates
 * registry — keep them in sync if the marketing copy or template list changes.
 */

const router = Router();
const baseUrl = env.FRONTEND_URL.replace(/\/+$/, '');

const esc = (s: string) =>
  s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] as string));

// Known crawler / AI-agent user agents that benefit from a rendered snapshot.
const BOT_RE =
  /bot|crawler|spider|slurp|gptbot|oai-searchbot|chatgpt-user|claudebot|claude-web|claude-searchbot|anthropic|perplexity|google-extended|googlebot|bingbot|applebot|ccbot|bytespider|amazonbot|meta-external|facebookexternalhit|linkedinbot|twitterbot|duckduckbot|duckassist|cohere|yandex|baidu/i;
export const isBot = (ua?: string): boolean => !!ua && BOT_RE.test(ua);

const CSS = `
:root{--ink:#1d1d1f;--muted:#6e6e73;--line:#e5e5ea;--accent:#0071e3;--bg:#fff;--band:#f5f5f7}
*{box-sizing:border-box}
body{margin:0;font:17px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,Arial,sans-serif;color:var(--ink)}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
header,main,footer{max-width:900px;margin:0 auto;padding:20px 24px}
header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line)}
.brand{font-weight:700;font-size:20px;letter-spacing:-.02em;color:var(--ink)}
.eyebrow{color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-size:13px;font-weight:600;margin:0}
h1{font-size:clamp(32px,6vw,54px);line-height:1.05;letter-spacing:-.03em;font-weight:700;margin:.15em 0 .3em}
h2{font-size:28px;letter-spacing:-.02em;margin:1.8em 0 .4em}
h3{font-size:18px;margin:1.2em 0 .2em}
.lead{font-size:20px;color:#333;max-width:640px}
.cta{display:inline-block;background:var(--accent);color:#fff;padding:13px 26px;border-radius:999px;font-weight:600;margin:14px 0}
.cta:hover{text-decoration:none;opacity:.92}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;margin:18px 0}
.card{border:1px solid var(--line);border-radius:14px;padding:18px}
.card h3{margin-top:0}.card p{color:var(--muted);margin:.3em 0 0}
.faq{border-top:1px solid var(--line);padding-top:8px;margin-top:14px}
footer{border-top:1px solid var(--line);color:var(--muted);font-size:14px}
.price{font-size:20px;font-weight:600}
`;

function feature(t: string, d: string) {
  return `<div class="card"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`;
}

// ── The landing snapshot (mirrors frontend landing.* en copy) ───────────────
function landingHtml(): string {
  const faqs = [
    {
      q: 'Do I need any design or tech skills?',
      a: 'None. You answer a few questions, Mumotor builds the site, and you can fine-tune anything in a visual editor — no code, ever.',
    },
    {
      q: 'Which languages are supported?',
      a: 'Every site is built trilingual — Hebrew, Arabic and English — with full right-to-left support. Students see it in their language automatically.',
    },
    {
      q: 'How do students book lessons?',
      a: 'They enroll with a code you share, then book straight into your real availability. You are notified and your calendar updates instantly.',
    },
    {
      q: 'Can I change my site after publishing?',
      a: 'Yes. Edit text, photos, colours and layout anytime in the editor, then re-publish in one click. Your booking data is never affected.',
    },
    {
      q: 'How much does it cost?',
      a: 'One simple plan — ₪199 per month — with everything included: your website, unlimited students, online booking, a fresh daily code, and the automatic emails to students and to you. Cancel anytime.',
    },
  ];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'Mumotor',
        url: baseUrl,
        logo: `${baseUrl}/favicon.svg`,
        description:
          'All-in-one, no-code website builder and booking platform built specifically for driving instructors and small driving schools. Trilingual (Hebrew, Arabic, English) with RTL.',
        knowsLanguage: ['he', 'ar', 'en'],
        areaServed: { '@type': 'Country', name: 'Israel' },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Mumotor',
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'Website Builder',
        operatingSystem: 'Web, iOS, Android (PWA)',
        url: baseUrl,
        description:
          'No-code website builder and booking platform for driving instructors: a professional site (1 of 12 designs), online lesson booking, one-time-code student enrollment, a student account area, packages, reviews and automatic reminders. Trilingual Hebrew/Arabic/English with RTL.',
        offers: { '@type': 'Offer', price: '199', priceCurrency: 'ILS' },
        audience: { '@type': 'Audience', audienceType: 'Driving instructors and small driving schools' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };

  const features = [
    ['12 professional templates', 'Designs built for driving instructors, tailored in a visual editor — no code required.'],
    ['Enrollment codes', 'Share a code and students self-enroll. No accounts or passwords for you to manage.'],
    ['Online booking', 'Students book into your real availability, and your calendar updates the instant a lesson is taken.'],
    ['Student roster', 'Every student, their lesson count and their progress — organised in one place.'],
    ['Automatic reminders', 'Booking confirmations and lesson reminders send on their own, so no one forgets.'],
    ['No double-bookings', 'Transactional booking keeps your schedule accurate and your slots honest.'],
  ];
  const steps = [
    ['1 · Describe your school', 'A short wizard covers your hours, pricing and teaching style.'],
    ['2 · Pick a template', 'Choose one of 12 designs and customise it in the editor.'],
    ['3 · Publish', 'Go live at your own address in minutes — trilingual by default.'],
    ['4 · Take bookings', 'Students enroll and book; you manage it all from one dashboard.'],
  ];
  const faqHtml = faqs.map((f) => `<div class="faq"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Mumotor — Website builder &amp; booking for driving instructors</title>
<meta name="description" content="Mumotor builds a professional, trilingual driving-instructor website in minutes and runs the whole business behind it — enrollments, bookings and reminders — from one dashboard. No code. ₪199/month."/>
<link rel="canonical" href="${baseUrl}/"/>
<meta name="robots" content="index, follow"/>
<meta property="og:type" content="website"/>
<meta property="og:title" content="Mumotor — Websites &amp; booking for driving instructors"/>
<meta property="og:url" content="${baseUrl}/"/>
<meta property="og:site_name" content="Mumotor"/>
<link rel="icon" href="/favicon.svg"/>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>${CSS}</style>
</head>
<body>
<header><a class="brand" href="${baseUrl}/">Mumotor</a><nav><a href="${baseUrl}/templates">Designs</a> &nbsp; <a href="${baseUrl}/guides">Guides</a> &nbsp; <a href="${baseUrl}/builder">Get started</a></nav></header>
<main>
  <p class="eyebrow">For independent driving instructors</p>
  <h1>Your driving school, online in minutes.</h1>
  <p class="lead">Mumotor builds you a beautiful, trilingual website and runs the whole business behind it — enrollments, bookings and reminders — from one calm dashboard.</p>
  <p class="eyebrow">No design skills needed · Hebrew · Arabic · English</p>
  <p><a class="cta" href="${baseUrl}/builder">Build your website</a></p>
  <p class="price">Everything for ₪199 / month — cancel anytime.</p>

  <h2>Built for solo instructors</h2>
  <p class="lead">Not bloated school software — just the tools one teacher actually needs, done beautifully.</p>
  <div class="grid">${features.map(([t, d]) => feature(t, d)).join('')}</div>

  <h2>Everything a driving instructor's site needs</h2>
  <div class="grid">
    ${feature('Lesson packages & pricing', 'Show your single-lesson and package prices clearly, in the local currency.')}
    ${feature('Manual & automatic', 'List the gearbox types, vehicles and licence categories you teach.')}
    ${feature('Areas you cover', 'The towns and pickup points you serve, so students know you reach them.')}
    ${feature('Student reviews', 'Real reviews and pass stories build trust before a student ever calls.')}
    ${feature('Online booking', 'Students book lessons into your real availability — no phone tag.')}
    ${feature('WhatsApp & contact', 'One tap to message you, call, or get directions to your meeting point.')}
  </div>

  <h2>From first question to first booking</h2>
  <div class="grid">${steps.map(([t, d]) => feature(t, d)).join('')}</div>

  <h2>Questions, answered</h2>
  ${faqHtml}

  <h2>Put your driving school online today</h2>
  <p class="lead">Create your account, set your hours, and share your first enrollment code today — it takes about five minutes.</p>
  <p><a class="cta" href="${baseUrl}/builder">Build your website</a></p>
  <p><a href="${baseUrl}/templates">See the 12 designs</a> · <a href="${baseUrl}/guides">Read the guides</a></p>
</main>
<footer><p>© Mumotor — professional websites and booking for independent driving instructors. Trilingual, no code. <a href="${baseUrl}/">mumotor.com</a></p></footer>
</body></html>`;
}

// ── The /templates snapshot (mirrors the templates registry) ────────────────
const TEMPLATES: Array<[string, string, string]> = [
  ['Mumotor', 'Apple-minimal', 'The Mumotor look — clean white, one calm accent and soft aurora. Recolour the whole site with a tap.'],
  ['Meridian', 'Topographic survey', 'An atlas plate — engraved serif titles, contour hairlines and a route line that draws itself down the page as you scroll.'],
  ['Bezel', 'Machined instrument', 'Precision-engineered — milled charcoal panels, knurled edges and stat dials whose needles sweep up like a real gauge.'],
  ['Solari', 'Split-flap departures', 'A mechanical departure board — brushed brass, amber flaps and words that clatter into place as you scroll.'],
  ['Cadence', 'Kinetic typography', 'Type is the whole design — oversized letters that lean with your scroll speed over a warm bone paper.'],
  ['Circuit', 'Motorsport telemetry', 'A pit-wall broadcast — a car laps a hand-drawn circuit as you scroll while a live timing tower ticks off the sectors.'],
  ['Press', 'Letterpress print', 'A fine letterpress prospectus — type debossed into cotton paper, copper fleurons and a wax seal that stamps as you scroll.'],
  ['Reel', '35mm cinema', 'A film print — letterboxed hero, a sprocket-holed filmstrip that scrubs frame-by-frame as you scroll and an academy-leader countdown.'],
  ['Slate', 'Chalkboard classroom', 'A schoolroom blackboard — hand-drawn chalk road diagrams that draw themselves and eraser-wipe transitions.'],
  ['Primary', 'Bauhaus geometry', 'A Bauhaus poster — flat circles, triangles and bars in primary colours that assemble as you scroll.'],
  ['Gallery', 'Museum exhibition', 'The work as a curated exhibition — framed prints with museum wall-labels and a spotlight that follows you down the wall.'],
  ['Gilt', 'Foil-stamped luxury', 'A foil-stamped invitation — deep charcoal and champagne-gold headlines with a sheen that rakes across them as you scroll.'],
  ['Sumi', 'Sumi-e ink wash', 'A sumi-e brush painting — warm washi paper, a hand-brushed enso that draws itself and a vermilion hanko seal that stamps as you scroll.'],
  ['Atelier', 'Bespoke tailor', 'A tailor’s atelier — a course cut to fit you. Warm ivory paper, a thread-red accent, a measuring-tape rail and a seam that sews itself as you scroll.'],
  ['Nocturne', 'Celestial navigation', 'A night drive charted by the stars — deep midnight indigo, brass constellations that light and connect as you scroll, a drawn course line and a compass.'],
  ['Deco', 'Golden-age Deco', 'The 1920s golden age of motoring — champagne ivory, emerald and gold Art-Deco geometry, sunburst fans and an elevator floor-dial that ticks as you scroll.'],
  ['Grid & Ink', 'Swiss editorial', 'Strict typographic grid, hairline rules and numbered sections. Confident, magazine-grade, zero clutter.'],
  ['Open Road', 'Retro automotive', 'Warm 70s road-trip energy — sunburst hero, enamel badges, grain and dashed-road dividers.'],
];

function templatesHtml(): string {
  const cards = TEMPLATES.map(
    ([name, style, blurb]) =>
      `<div class="card"><h3>${esc(name)}</h3><p><b>${esc(style)}</b></p><p>${esc(blurb)}</p></div>`
  ).join('\n');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Mumotor website designs for driving instructors',
    description: '12 professional, fully-editable website designs for driving instructors — trilingual (Hebrew, Arabic, English).',
    url: `${baseUrl}/templates`,
    isPartOf: { '@type': 'WebSite', name: 'Mumotor', url: baseUrl },
  };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>12 website designs for driving instructors | Mumotor</title>
<meta name="description" content="Browse 12 professional, fully-editable website designs for driving instructors — trilingual (Hebrew, Arabic, English), no code. Pick one and publish in minutes with Mumotor."/>
<link rel="canonical" href="${baseUrl}/templates"/>
<meta name="robots" content="index, follow"/>
<meta property="og:title" content="12 website designs for driving instructors | Mumotor"/>
<meta property="og:url" content="${baseUrl}/templates"/>
<link rel="icon" href="/favicon.svg"/>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>${CSS}</style>
</head>
<body>
<header><a class="brand" href="${baseUrl}/">Mumotor</a><nav><a href="${baseUrl}/guides">Guides</a> &nbsp; <a href="${baseUrl}/builder">Get started</a></nav></header>
<main>
  <p class="eyebrow">Designs</p>
  <h1>12 website designs for driving instructors</h1>
  <p class="lead">Every design is built for driving instructors and fully editable in a visual editor — no code. All trilingual (Hebrew, Arabic, English) with right-to-left support.</p>
  <p><a class="cta" href="${baseUrl}/builder">Build your website</a></p>
  <div class="grid">${cards}</div>
</main>
<footer><p>© Mumotor — professional websites and booking for driving instructors. <a href="${baseUrl}/">mumotor.com</a></p></footer>
</body></html>`;
}

// Bot-only: serve the rendered snapshot; humans fall through to the SPA.
router.get('/', (req, res, next) => {
  if (!isBot(req.get('user-agent'))) return next();
  res.type('html').set('Cache-Control', 'public, max-age=1800').send(landingHtml());
});
router.get('/templates', (req, res, next) => {
  if (!isBot(req.get('user-agent'))) return next();
  res.type('html').set('Cache-Control', 'public, max-age=1800').send(templatesHtml());
});

export default router;

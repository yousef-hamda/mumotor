// Deterministic generator: builds a complete, self-contained, responsive
// driving-teacher website (single HTML document) from a preset + the teacher's
// business config. Enroll/Book CTAs deep-link into the live booking flow.

import { getPreset, type Preset } from './templatePresets.js';
import { getSiteStrings, fmt, type SiteStrings } from './templateStrings.js';
import { env } from '../../config/env.js';

export interface LessonType {
  name: string;
  description?: string;
  price?: string | number;
  duration?: string | number;
}
export interface Faq {
  q: string;
  a: string;
}
export interface Testimonial {
  name: string;
  rating?: number;
  comment: string;
}

export interface GeneratedSiteConfig {
  teacherName?: string;
  tagline?: string;
  bio?: string;
  pricePerClass?: string | number;
  classDuration?: number;
  passRate?: number;
  experienceYears?: string | number;
  studentsTaught?: string | number;
  rating?: string | number;
  advanceBookingDays?: number;
  bookingCutoffHour?: number;
  shiftStart?: string;
  shiftEnd?: string;
  breakTimes?: { start: string; end: string }[];
  lessonTypes?: LessonType[];
  faqs?: Faq[];
  testimonials?: Testimonial[];
  galleryPhotos?: string[];
  carPhoto?: { url?: string } | string;
  heroPhoto?: string;
  socialLinks?: Record<string, string>;
  contact?: { phone?: string; email?: string; address?: string; whatsapp?: string };
  enabledSections?: string[];
  locale?: 'he' | 'ar' | 'en';
  colors?: { primary?: string; accent?: string };
}

export interface BuildOpts {
  website: { id?: string; name: string; slug: string };
  config?: GeneratedSiteConfig;
  presetId?: string | null;
  frontendUrl?: string;
}

const PEXELS = (id: number, w = 1600) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
const HERO_ID = 9518029;
const ABOUT_ID = 6817037;
const GALLERY_IDS = [9518029, 6817037, 8550826, 3136673, 228094, 2526127, 210182, 9518030, 9518016];

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const DEFAULT_SERVICES: LessonType[] = [
  { name: 'Driving Lesson', description: 'A standard one-on-one lesson tailored to your level.', price: 50, duration: 45 },
  { name: 'First Lesson', description: 'A gentle introduction for brand-new drivers.', price: 40, duration: 45 },
  { name: 'Test Preparation', description: 'Mock test on real routes to get you exam-ready.', price: 55, duration: 60 },
  { name: 'Highway Lesson', description: 'Build confidence at speed on the open road.', price: 55, duration: 60 },
];

const DEFAULT_FAQS: Faq[] = [
  { q: 'How many lessons will I need?', a: 'Most students take between 10 and 20 lessons, depending on prior experience and how quickly they build confidence.' },
  { q: 'What vehicle will I drive?', a: 'A modern, fully insured dual-control car, so your instructor can assist safely at any moment.' },
  { q: 'How do I book a lesson?', a: 'Get an enrollment code from your instructor, register on this site, then pick any open slot that suits you.' },
  { q: 'What is your cancellation policy?', a: 'Cancellations are free up to 24 hours before a lesson. Later cancellations are charged at 50%.' },
  { q: 'Do you teach automatic and manual?', a: 'Yes — both. Let your instructor know your preference when you enroll.' },
];

const DEFAULT_REVIEWS: Testimonial[] = [
  { name: 'Anna K.', rating: 5, comment: 'Passed first time! Calm, patient and incredibly clear. I never felt rushed.' },
  { name: 'Sam B.', rating: 5, comment: 'Booking lessons online made everything so easy. Highly recommend.' },
  { name: 'Omar J.', rating: 5, comment: 'Went from nervous to confident in a few weeks. The best decision I made.' },
];

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function darken(hex: string, f: number): string {
  const n = hex.replace('#', '');
  if (n.length !== 6) return hex;
  const ch = (i: number) => Math.max(0, Math.round(parseInt(n.slice(i, i + 2), 16) * (1 - f)));
  return `#${[0, 2, 4].map((i) => ch(i).toString(16).padStart(2, '0')).join('')}`;
}

export function buildSiteHtml(opts: BuildOpts): { html: string; metadata: Record<string, unknown> } {
  const preset = getPreset(opts.presetId);
  const c = opts.config ?? {};
  const colors = { ...preset.colors, ...(c.colors?.primary ? { primary: c.colors.primary } : {}), ...(c.colors?.accent ? { accent: c.colors.accent } : {}) };
  if (c.colors?.primary) colors.primaryDark = darken(c.colors.primary, 0.18);
  const frontendUrl = opts.frontendUrl ?? env.FRONTEND_URL;
  const slug = opts.website.slug;
  const schoolName = opts.website.name;
  const teacher = c.teacherName || schoolName;
  const tagline = c.tagline || 'Your road to confidence';
  const locale = c.locale || 'en';
  const dir = locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr';

  const passRate = num(c.passRate, 95);
  const years = c.experienceYears ?? '10+';
  const students = c.studentsTaught ?? '500+';
  const rating = c.rating ?? '4.9';
  const price = c.pricePerClass ?? 50;
  const duration = num(c.classDuration, 45);

  const t = getSiteStrings(locale);
  const services = c.lessonTypes && c.lessonTypes.length ? c.lessonTypes : t.servicesDefault;
  const faqs = c.faqs && c.faqs.length ? c.faqs : t.faq.defaults.map((f) => ({ q: f.q, a: f.a }));
  const reviews = c.testimonials && c.testimonials.length ? c.testimonials : t.reviews.defaults;
  const gallery = c.galleryPhotos && c.galleryPhotos.length ? c.galleryPhotos : GALLERY_IDS.slice(0, 6).map((id) => PEXELS(id, 900));
  const carPhoto = typeof c.carPhoto === 'string' ? c.carPhoto : c.carPhoto?.url;
  const heroImg = c.heroPhoto || carPhoto || `${frontendUrl}/img/ai-hero.png`;
  const aboutImg = carPhoto || `${frontendUrl}/img/ai-about.png`;

  const enrollUrl = `${frontendUrl}/p/${slug}/enroll`;
  const bookUrl = `${frontendUrl}/p/${slug}/book-lesson`;

  const enabled = (s: string) => !c.enabledSections || c.enabledSections.includes(s);
  const order = preset.sections.filter((s) => enabled(s));
  // in-page booking widget, placed just before the final CTA
  const ctaIdx = order.indexOf('cta');
  if (ctaIdx >= 0) order.splice(ctaIdx, 0, 'book');
  else order.push('book');

  const ctx = {
    preset, c, t, slug, schoolName, teacher, tagline, enrollUrl, bookUrl,
    websiteId: opts.website.id ?? '', advanceDays: Number(c.advanceBookingDays ?? 14), cutoffHour: Number(c.bookingCutoffHour ?? 18),
    passRate, years, students, rating, price, duration, services, faqs, reviews, gallery, heroImg, aboutImg,
  };

  const sectionHtml = order.map((s) => renderSection(s, ctx)).join('\n');

  const html = `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(schoolName)} — ${esc(tagline)}</title>
<meta name="description" content="${esc(`Learn to drive with ${schoolName}. ${tagline}. Enroll with your code and book lessons online.`)}">
<meta property="og:title" content="${esc(schoolName)}">
<meta property="og:description" content="${esc(tagline)}">
<meta property="og:type" content="website">
<meta property="og:image" content="${esc(PEXELS(HERO_ID, 1200))}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${preset.fonts.googleHref}" rel="stylesheet">
<style>${css(preset, colors)}</style>
</head>
<body>
<script>document.documentElement.className+=' js'</script>
${renderNav(ctx)}
<main>
${sectionHtml}
</main>
${renderFooter(ctx)}
<script>${runtimeJs()}</script>
</body>
</html>`;

  const metadata = {
    preset: preset.id,
    schoolName,
    slug,
    sections: order,
    locale,
    generatedAt: null, // stamped by caller
  };
  return { html, metadata };
}

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------
function css(p: Preset, colors: typeof p.colors): string {
  const k = colors;
  return `
:root{
  --primary:${k.primary};--primary-dark:${k.primaryDark};--accent:${k.accent};
  --bg:${k.bg};--surface:${k.surface};--fg:${k.fg};--muted:${k.muted};--border:${k.border};
  --font-h:'${p.fonts.heading}',Georgia,serif;--font-b:'${p.fonts.body}',system-ui,sans-serif;
  --radius:16px;--maxw:1140px;
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--font-b);color:var(--fg);background:var(--bg);line-height:1.6;-webkit-font-smoothing:antialiased}
h1,h2,h3,h4{font-family:var(--font-h);font-weight:700;line-height:1.1;letter-spacing:-.02em}
a{color:inherit;text-decoration:none}
img{max-width:100%;display:block}
.container{max-width:var(--maxw);margin:0 auto;padding:0 24px}
section{padding:88px 0}
.eyebrow{font-family:var(--font-b);font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--primary)}
.h2{font-size:clamp(28px,4vw,42px);margin:12px 0}
.lead{color:var(--muted);font-size:18px;max-width:560px}
.btn{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-b);font-weight:600;font-size:15px;padding:13px 24px;border-radius:12px;cursor:pointer;border:1px solid transparent;transition:transform .15s ease,box-shadow .15s ease,background .15s ease}
.btn:active{transform:translateY(1px)}
.btn-primary{background:var(--primary);color:#fff;box-shadow:0 8px 24px -8px ${k.primary}66}
.btn-primary:hover{background:var(--primary-dark)}
.btn-ghost{background:transparent;color:var(--fg);border-color:var(--border)}
.btn-ghost:hover{background:var(--surface)}
.btn-white{background:#fff;color:var(--primary)}
/* nav */
.nav{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--bg) 86%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--border)}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:68px}
.brand{display:flex;align-items:center;gap:10px;font-family:var(--font-h);font-weight:700;font-size:20px}
.brand-mark{width:34px;height:34px;border-radius:9px;background:var(--primary);color:#fff;display:grid;place-items:center}
.nav-links{display:flex;align-items:center;gap:28px}
.nav-links a{font-size:15px;color:var(--muted);font-weight:500}
.nav-links a:hover{color:var(--fg)}
.nav-cta{display:flex;align-items:center;gap:10px}
.menu-btn{display:none;background:none;border:0;cursor:pointer}
/* hero */
.hero{padding:80px 0 64px}
.hero-split{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center}
.hero h1{font-size:clamp(36px,6vw,60px)}
.hero p.lead{margin:22px 0 30px}
.hero-actions{display:flex;gap:14px;flex-wrap:wrap}
.hero-media{position:relative}
.hero-media img{width:100%;height:480px;object-fit:cover;border-radius:24px;box-shadow:0 30px 60px -25px rgba(0,0,0,.35)}
.hero-badge{position:absolute;bottom:-18px;inset-inline-start:-18px;background:#fff;border:1px solid var(--border);border-radius:16px;padding:14px 18px;box-shadow:0 18px 40px -18px rgba(0,0,0,.25)}
.hero-badge b{font-family:var(--font-h);font-size:24px;color:var(--primary)}
.hero-center{text-align:center;max-width:780px;margin:0 auto}
.hero-center .hero-actions{justify-content:center}
.hero-center .hero-media img{height:420px;margin-top:48px;border-radius:24px}
.hero-editorial h1{font-size:clamp(42px,8vw,84px);max-width:14ch}
.hero-overlay{position:relative;color:#fff;border-radius:28px;overflow:hidden;padding:0}
.hero-overlay .ov-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero-overlay .ov-tint{position:absolute;inset:0;background:linear-gradient(120deg,${k.primaryDark}f2,${k.primary}99)}
.hero-overlay .ov-inner{position:relative;padding:96px 56px}
.hero-overlay h1{color:#fff}.hero-overlay .lead{color:#ffffffcc}
/* stats */
.stats{background:var(--surface);border-block:1px solid var(--border)}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;text-align:center}
.stat b{display:block;font-family:var(--font-h);font-size:clamp(30px,4vw,44px);color:var(--primary)}
.stat span{color:var(--muted);font-size:14px}
/* how */
.how-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:48px}
.step{position:relative;padding-top:18px;border-top:2px solid var(--primary)}
.step .n{font-family:var(--font-h);font-size:14px;color:var(--primary);font-weight:700}
.step h3{font-size:19px;margin:8px 0 6px}
.step p{color:var(--muted);font-size:15px}
/* about */
.about-grid{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
.about-grid img{width:100%;height:440px;object-fit:cover;border-radius:24px}
.about ul{list-style:none;margin-top:20px;display:grid;gap:12px}
.about li{display:flex;gap:10px;color:var(--fg)}
.about li::before{content:'✓';color:var(--primary);font-weight:800}
/* services */
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:48px}
.card{background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:26px;transition:transform .2s ease,box-shadow .2s ease}
.card:hover{transform:translateY(-4px);box-shadow:0 24px 48px -28px rgba(0,0,0,.28)}
.card h3{font-size:19px}
.card .price{font-family:var(--font-h);font-size:26px;color:var(--primary);margin-top:14px}
.card .dur{color:var(--muted);font-size:14px}
/* gallery */
.gallery-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:40px}
.gallery-grid img{width:100%;height:240px;object-fit:cover;border-radius:14px}
/* reviews */
.reviews-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:48px}
.review{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:26px}
.review .stars{color:#f5b301;letter-spacing:2px}
.review p{margin:14px 0;color:var(--fg)}
.review b{color:var(--muted);font-weight:600;font-size:14px}
/* faq */
.faq{max-width:760px;margin:40px auto 0}
.faq-item{border-bottom:1px solid var(--border)}
.faq-q{width:100%;text-align:start;background:none;border:0;cursor:pointer;padding:22px 0;font-family:var(--font-h);font-weight:700;font-size:18px;color:var(--fg);display:flex;justify-content:space-between;gap:16px}
.faq-q .ic{color:var(--primary);transition:transform .2s ease}
.faq-a{max-height:0;overflow:hidden;transition:max-height .3s ease;color:var(--muted)}
.faq-item.open .faq-a{max-height:240px;padding-bottom:22px}
.faq-item.open .faq-q .ic{transform:rotate(45deg)}
/* contact */
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px}
.contact-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:28px}
.contact-row{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)}
.contact-row:last-child{border-bottom:0}
.contact-row span{color:var(--muted);min-width:88px}
/* cta */
.cta-band{background:var(--primary);color:#fff;border-radius:28px;text-align:center;padding:72px 32px}
.cta-band h2{color:#fff;font-size:clamp(28px,4vw,40px)}
.cta-band p{color:#ffffffd0;max-width:520px;margin:14px auto 28px}
/* services over looping car video */
.services-video{position:relative;overflow:hidden;background:#0a0a0a}
.services-video .svc-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.9}
.services-video .svc-tint{position:absolute;inset:0;background:linear-gradient(180deg,${k.primaryDark}cc,#0a0a0aE6)}
.services-video .container{position:relative}
.services-video .eyebrow{color:#fff}
.services-video .h2{color:#fff}
.services-video .card{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.18);backdrop-filter:blur(8px);color:#fff}
.services-video .card h3{color:#fff}
.services-video .card .price{color:#fff}
.services-video .card p,.services-video .card .dur{color:#ffffffcc}
/* in-page booking */
.book .book-shell{margin-top:40px;display:grid;gap:28px}
.book-panel{background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:28px;max-width:560px;margin:0 auto;width:100%}
.book-aside{display:none}
.book-field{margin-bottom:14px}
.book-field label{display:block;font-size:13px;font-weight:600;color:var(--muted);margin-bottom:6px}
.book-field input{width:100%;padding:12px 14px;border:1px solid var(--border);border-radius:10px;font:inherit;background:var(--bg);color:var(--fg)}
.book-btn{display:inline-flex;align-items:center;gap:8px;background:var(--primary);color:#fff;border:0;border-radius:10px;padding:12px 22px;font:inherit;font-weight:600;cursor:pointer}
.book-btn:hover{background:var(--primary-dark)}
.book-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px;margin-top:8px}
.book-chip{border:1px solid var(--border);background:var(--bg);border-radius:10px;padding:10px 8px;font:inherit;font-size:14px;cursor:pointer;text-align:center;color:var(--fg)}
.book-chip:hover{border-color:var(--primary);background:var(--surface)}
.book-chip.sel{background:var(--primary);color:#fff;border-color:var(--primary)}
.book-note{color:var(--muted);font-size:14px;margin-top:8px}
.book-ok{text-align:center;padding:12px}
.book-ok .tick{width:54px;height:54px;border-radius:50%;background:#10b98122;color:#10b981;display:grid;place-items:center;margin:0 auto 12px;font-size:26px}
.book-steps{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap}
.book-steps span{font-size:12px;color:var(--muted);background:var(--surface);border:1px solid var(--border);border-radius:999px;padding:4px 10px}
/* layout variants */
.book-card .book-panel{box-shadow:0 18px 50px -24px rgba(0,0,0,.3)}
.book-floating .book-panel{box-shadow:0 30px 60px -20px ${k.primary}40;transform:translateY(-4px)}
.book-minimal .book-panel{border:0;box-shadow:none;background:transparent;padding:0}
.book-progress .book-panel{border-top:4px solid var(--primary)}
.book-tabs .book-panel{padding-top:0}
.book-tabs .book-panel::before{content:'Book';display:block;margin:0 -28px 20px;padding:12px 28px;background:var(--surface);border-bottom:1px solid var(--border);font-family:var(--font-h);font-weight:700}
.book-split .book-shell,.book-sidebar .book-shell,.book-timeline .book-shell{grid-template-columns:1fr 1fr;align-items:stretch}
.book-split .book-panel,.book-sidebar .book-panel,.book-timeline .book-panel{margin:0;max-width:none}
.book-split .book-aside{display:block;border-radius:var(--radius);overflow:hidden;min-height:340px;background-size:cover;background-position:center}
.book-sidebar .book-aside,.book-timeline .book-aside{display:block;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:28px}
.book-aside h3{font-size:20px;margin-bottom:10px}
.book-aside ol{margin:0;padding-inline-start:18px;color:var(--muted);line-height:1.9}
@media(max-width:900px){.book-split .book-shell,.book-sidebar .book-shell,.book-timeline .book-shell{grid-template-columns:1fr}.book-split .book-aside{min-height:200px}}
/* footer */
.footer{border-top:1px solid var(--border);padding:40px 0;color:var(--muted);font-size:14px}
.footer-inner{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
.footer .socials{display:flex;gap:16px}
/* reveal — progressive enhancement: only hides when JS is present */
.js .reveal{opacity:0;transform:translateY(20px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
.js .reveal.in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.js .reveal{opacity:1;transform:none;transition:none}}
/* responsive */
@media(max-width:900px){
  .nav-links{display:none}.menu-btn{display:block}
  .hero-split,.about-grid,.contact-grid{grid-template-columns:1fr;gap:32px}
  .stats-grid,.how-grid{grid-template-columns:repeat(2,1fr)}
  .cards,.reviews-grid,.gallery-grid{grid-template-columns:1fr}
  .hero-media img{height:320px}.hero-overlay .ov-inner{padding:56px 28px}
  section{padding:64px 0}
}
`;
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------
type Ctx = ReturnType<typeof makeCtxType>;
function makeCtxType() {
  return {} as {
    preset: Preset; c: GeneratedSiteConfig; t: SiteStrings; slug: string; schoolName: string; teacher: string; tagline: string;
    enrollUrl: string; bookUrl: string; websiteId: string; advanceDays: number; cutoffHour: number;
    passRate: number; years: string | number; students: string | number;
    rating: string | number; price: string | number; duration: number; services: LessonType[]; faqs: Faq[];
    reviews: Testimonial[]; gallery: string[]; heroImg: string; aboutImg: string;
  };
}

function renderNav(x: Ctx): string {
  const n = x.t.nav;
  return `<nav class="nav"><div class="container nav-inner">
  <a href="#top" class="brand"><span class="brand-mark">${navMark()}</span>${esc(x.schoolName)}</a>
  <div class="nav-links">
    <a href="#about">${esc(n.about)}</a><a href="#services">${esc(n.lessons)}</a><a href="#reviews">${esc(n.reviews)}</a><a href="#faq">${esc(n.faq)}</a><a href="#contact">${esc(n.contact)}</a>
  </div>
  <div class="nav-cta">
    <a href="${esc(x.enrollUrl)}" target="_blank" rel="noopener" class="btn btn-ghost">${esc(n.enroll)}</a>
    <a href="#book" class="btn btn-primary">${esc(n.book)}</a>
  </div>
  <button class="menu-btn" onclick="document.querySelector('.nav-links').style.display='flex'">☰</button>
</div></nav>`;
}

function renderSection(s: string, x: Ctx): string {
  switch (s) {
    case 'hero': return renderHero(x);
    case 'stats': return renderStats(x);
    case 'how': return renderHow(x);
    case 'about': return renderAbout(x);
    case 'services': return renderServices(x);
    case 'gallery': return renderGallery(x);
    case 'reviews': return renderReviews(x);
    case 'faq': return renderFaq(x);
    case 'contact': return renderContact(x);
    case 'book': return renderBook(x);
    case 'cta': return renderCta(x);
    default: return '';
  }
}

function renderHero(x: Ctx): string {
  const h = x.t.hero;
  const actions = `<div class="hero-actions">
    <a href="#book" class="btn btn-primary">${esc(h.getStarted)} →</a>
    <a href="#book" class="btn btn-ghost">${esc(h.book)}</a>
  </div>`;
  const eyebrow = `<p class="eyebrow">${esc(x.teacher)} · ${esc(h.role)}</p>`;
  const lead = `<p class="lead">${esc(fmt(h.lead, { school: x.schoolName }))}</p>`;
  const head = `<h1>${esc(x.tagline)}</h1>`;

  if (x.preset.hero === 'overlay') {
    return `<section class="hero" id="top"><div class="container"><div class="hero-overlay reveal">
      <img class="ov-img" src="${esc(x.heroImg)}" alt=""><div class="ov-tint"></div>
      <div class="ov-inner">${eyebrow}${head}${lead}${actions}</div>
    </div></div></section>`;
  }
  if (x.preset.hero === 'center') {
    return `<section class="hero" id="top"><div class="container hero-center reveal">
      ${eyebrow}${head}${lead}${actions}
      <div class="hero-media"><img src="${esc(x.heroImg)}" alt=""></div>
    </div></section>`;
  }
  if (x.preset.hero === 'editorial') {
    return `<section class="hero" id="top"><div class="container reveal">
      ${eyebrow}<div class="hero-editorial">${head}</div>${lead}${actions}
      <div class="hero-media" style="margin-top:40px"><img src="${esc(x.heroImg)}" alt="" style="height:420px;border-radius:24px"></div>
    </div></section>`;
  }
  // split (default)
  return `<section class="hero" id="top"><div class="container hero-split">
    <div class="reveal">${eyebrow}${head}${lead}${actions}</div>
    <div class="hero-media reveal"><img src="${esc(x.heroImg)}" alt="">
      <div class="hero-badge"><b>${esc(x.passRate)}%</b><div style="font-size:13px;color:var(--muted)">${esc(x.t.stats.passRate)}</div></div>
    </div>
  </div></section>`;
}

function renderStats(x: Ctx): string {
  const s = x.t.stats;
  const items = [
    [`${esc(x.passRate)}%`, esc(s.passRate)],
    [esc(x.students), esc(s.students)],
    [`${esc(x.years)}`, esc(s.years)],
    [esc(x.rating), esc(s.rating)],
  ];
  return `<section class="stats"><div class="container stats-grid reveal">
    ${items.map(([b, s]) => `<div class="stat"><b>${b}</b><span>${s}</span></div>`).join('')}
  </div></section>`;
}

function renderHow(x: Ctx): string {
  const h = x.t.how;
  return `<section id="how"><div class="container">
    <p class="eyebrow reveal">${esc(h.eyebrow)}</p><h2 class="h2 reveal">${esc(h.title)}</h2>
    <div class="how-grid">
      ${h.steps.map((st, i) => `<div class="step reveal" style="transition-delay:${i * 80}ms"><div class="n">0${i + 1}</div><h3>${esc(st.h)}</h3><p>${esc(st.p)}</p></div>`).join('')}
    </div>
  </div></section>`;
}

function renderAbout(x: Ctx): string {
  const a = x.t.about;
  const bio = x.c.bio || fmt(a.bio, { teacher: x.teacher });
  return `<section id="about" class="about"><div class="container about-grid">
    <img class="reveal" src="${esc(x.aboutImg)}" alt="">
    <div class="reveal">
      <p class="eyebrow">${esc(a.eyebrow)}</p><h2 class="h2">${esc(fmt(a.title, { teacher: x.teacher }))}</h2>
      <p class="lead" style="max-width:none">${esc(bio)}</p>
      <ul>${a.checklist.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
    </div>
  </div></section>`;
}

function renderServices(x: Ctx): string {
  const s = x.t.services;
  return `<section id="services" class="services-video">
    <video class="svc-video" autoplay muted loop playsinline poster="${esc(PEXELS(HERO_ID, 1200))}">
      <source src="https://videos.pexels.com/video-files/3773486/3773486-hd_1920_1080_30fps.mp4" type="video/mp4">
    </video>
    <div class="svc-tint"></div>
    <div class="container">
      <p class="eyebrow reveal">${esc(s.eyebrow)}</p><h2 class="h2 reveal">${esc(s.title)}</h2>
      <div class="cards">
        ${x.services.map((svc, i) => `<div class="card reveal" style="transition-delay:${i * 70}ms">
          <h3>${esc(svc.name)}</h3>
          <p style="margin-top:8px">${esc(svc.description || '')}</p>
          ${svc.price ? `<div class="price">₪${esc(svc.price)}</div>` : ''}
          <div class="dur">${esc(svc.duration || x.duration)} ${esc(s.minutes)}</div>
        </div>`).join('')}
      </div>
    </div>
  </section>`;
}

function renderGallery(x: Ctx): string {
  const g = x.t.gallery;
  return `<section id="gallery"><div class="container">
    <p class="eyebrow reveal">${esc(g.eyebrow)}</p><h2 class="h2 reveal">${esc(g.title)}</h2>
    <div class="gallery-grid">
      ${x.gallery.slice(0, 6).map((src, i) => `<img class="reveal" style="transition-delay:${i * 60}ms" src="${esc(src)}" alt="" loading="lazy">`).join('')}
    </div>
  </div></section>`;
}

function renderReviews(x: Ctx): string {
  const r = x.t.reviews;
  return `<section id="reviews" style="background:var(--surface)"><div class="container">
    <p class="eyebrow reveal">${esc(r.eyebrow)}</p><h2 class="h2 reveal">${esc(r.title)}</h2>
    <div class="reviews-grid">
      ${x.reviews.map((rv, i) => `<div class="review reveal" style="transition-delay:${i * 70}ms">
        <div class="stars">${'★'.repeat(Math.round(rv.rating || 5))}</div>
        <p>"${esc(rv.comment)}"</p><b>${esc(rv.name)}</b>
      </div>`).join('')}
    </div>
  </div></section>`;
}

function renderFaq(x: Ctx): string {
  const f = x.t.faq;
  return `<section id="faq"><div class="container">
    <p class="eyebrow reveal" style="text-align:center">${esc(f.eyebrow)}</p><h2 class="h2 reveal" style="text-align:center">${esc(f.title)}</h2>
    <div class="faq">
      ${x.faqs.map((q) => `<div class="faq-item reveal"><button class="faq-q" onclick="this.parentElement.classList.toggle('open')">${esc(q.q)}<span class="ic">+</span></button><div class="faq-a">${esc(q.a)}</div></div>`).join('')}
    </div>
  </div></section>`;
}

function renderContact(x: Ctx): string {
  const cc = x.t.contact;
  const ct = x.c.contact || {};
  const rows = [
    ct.phone && [cc.phone, esc(ct.phone)],
    ct.email && [cc.email, esc(ct.email)],
    ct.address && [cc.area, esc(ct.address)],
  ].filter(Boolean) as [string, string][];
  const fallback = `<div class="contact-row"><span>${esc(cc.booking)}</span><b>${esc(cc.online7)}</b></div><div class="contact-row"><span>${esc(cc.lessonsLabel)}</span><b>${esc(fmt(cc.minEach, { n: String(x.duration) }))}</b></div>`;
  return `<section id="contact"><div class="container">
    <p class="eyebrow reveal">${esc(cc.eyebrow)}</p><h2 class="h2 reveal">${esc(cc.title)}</h2>
    <div class="contact-grid">
      <div class="reveal"><p class="lead">${esc(fmt(cc.lead, { teacher: x.teacher }))}</p>
        <div style="margin-top:20px"><a href="#book" class="btn btn-primary">${esc(cc.enrollNow)} →</a></div>
      </div>
      <div class="contact-card reveal">
        ${rows.length ? rows.map(([k, v]) => `<div class="contact-row"><span>${esc(k)}</span><b>${v}</b></div>`).join('') : fallback}
      </div>
    </div>
  </div></section>`;
}

function renderBook(x: Ctx): string {
  const layout = x.preset.bookingLayout || 'classic';
  const t = x.t;
  let aside = '';
  if (layout === 'split') {
    aside = `<div class="book-aside" style="background-image:url('${esc(x.heroImg)}')"></div>`;
  } else if (layout === 'sidebar' || layout === 'timeline') {
    aside = `<div class="book-aside"><h3>${esc(t.how.title)}</h3><ol>${t.how.steps.map((s) => `<li>${esc(s.h)}</li>`).join('')}</ol></div>`;
  }
  return `<section id="book" class="book book-${esc(layout)}" data-wid="${esc(x.websiteId)}" data-advance="${x.advanceDays}" data-cutoff="${x.cutoffHour}" data-min="${x.duration}">
    <div class="container">
      <p class="eyebrow reveal" style="text-align:center">${esc(t.contact.booking)}</p>
      <h2 class="h2 reveal" style="text-align:center">${esc(t.nav.book)}</h2>
      <div class="book-shell">
        ${aside}
        <div class="book-panel" id="ds-panel">
          <div class="book-field"><label>${esc(t.contact.email)}</label><input type="email" id="ds-email" placeholder="you@example.com"></div>
          <button class="book-btn" onclick="dsBook.start()">${esc(t.hero.getStarted)} →</button>
          <p class="book-note">Enter the email you enrolled with. New here? You'll add your code next.</p>
        </div>
      </div>
    </div>
  </section>`;
}

function renderCta(x: Ctx): string {
  const cta = x.t.cta;
  return `<section><div class="container"><div class="cta-band reveal">
    <h2>${esc(cta.title)}</h2>
    <p>${esc(cta.text)}</p>
    <a href="#book" class="btn btn-white">${esc(cta.enrollNow)} →</a>
  </div></div></section>`;
}

function renderFooter(x: Ctx): string {
  const socials = x.c.socialLinks || {};
  const links = Object.entries(socials)
    .filter(([, v]) => v)
    .map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener">${esc(k)}</a>`)
    .join('');
  return `<footer class="footer"><div class="container footer-inner">
    <div>© ${new Date().getFullYear()} ${esc(x.schoolName)} · ${esc(x.tagline)}</div>
    <div class="socials">${links}</div>
    <div>${esc(x.t.footer.builtWith)}</div>
  </div></footer>`;
}

function navMark(): string {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="2" fill="#fff" stroke="none"/><path d="M12 9.9V4.2M10.3 13.4 5.5 16.3M13.7 13.4l4.8 2.9"/></svg>`;
}

// ---------------------------------------------------------------------------
// Runtime JS (scroll reveal, mobile nav, faq, count-up)
// ---------------------------------------------------------------------------
function runtimeJs(): string {
  return `
(function(){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}})},{threshold:.12});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});
})();
window.dsBook=(function(){
  var sec,wid,advance,state={};
  function panel(){return document.getElementById('ds-panel');}
  function get(p){return fetch('/api'+p).then(function(r){return r.json().then(function(j){return {ok:r.ok,status:r.status,j:j};});});}
  function post(p,b){return fetch('/api'+p,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)}).then(function(r){return r.json().then(function(j){return {ok:r.ok,status:r.status,j:j};});});}
  function init(){sec=document.getElementById('book');if(!sec)return;wid=sec.dataset.wid;advance=+sec.dataset.advance||14;}
  function dates(){var out=[],now=new Date(),base=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));for(var i=0;i<Math.min(advance+1,30);i++){var d=new Date(base);d.setUTCDate(base.getUTCDate()+i);out.push(d.toISOString().slice(0,10));}return out;}
  function fmt(s){var d=new Date(s+'T00:00:00');return d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});}
  function start(){var i=document.getElementById('ds-email');var email=i?i.value.trim():'';if(!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)){alert('Please enter a valid email');return;}state.email=email;if(!wid){msg('Booking is available on the published site.');return;}get('/driving-school/'+wid+'/check-enrollment?email='+encodeURIComponent(email)).then(function(r){if(r.j&&r.j.enrolled){if(r.j.active===false){msg('Your enrollment is paused. Please contact your instructor.');return;}state.name=r.j.studentName;renderDates();}else{renderEnroll();}}).catch(function(){msg('Something went wrong. Please try again.');});}
  function renderEnroll(){panel().innerHTML='<div class="book-field"><label>Full name</label><input id="ds-name"></div><div class="book-field"><label>Enrollment code</label><input id="ds-code" style="text-transform:uppercase"></div><button class="book-btn" onclick="dsBook.enroll()">Continue &rarr;</button><p class="book-note">We don\\'t recognize this email yet — add your name and the code from your instructor.</p>';}
  function enroll(){var n=(document.getElementById('ds-name')||{}).value,c=(document.getElementById('ds-code')||{}).value;if(!n||n.length<2){alert('Enter your name');return;}if(!c||c.length<4){alert('Enter your code');return;}state.name=n;post('/driving-school/enroll',{websiteId:wid,studentName:n,studentEmail:state.email,enrollmentCode:c}).then(function(r){if(r.ok||r.status===409){renderDates();}else{alert((r.j&&r.j.error)||'Could not enroll');}});}
  function renderDates(){var ds=dates();panel().innerHTML='<p class="book-note">Choose a date</p><div class="book-grid">'+ds.map(function(d){return '<button class="book-chip" onclick="dsBook.pickDate(\\''+d+'\\')">'+fmt(d)+'</button>';}).join('')+'</div>';}
  function pickDate(d){state.date=d;panel().innerHTML='<p class="book-note">Loading times…</p>';get('/driving-school/'+wid+'/public-availability?date='+d+'&email='+encodeURIComponent(state.email)).then(function(r){var s=(r.j&&r.j.slots)||[];if(!s.length){panel().innerHTML='<p class="book-note">No times available on this date.</p><button class="book-btn" onclick="dsBook.renderDates()">&larr; Back</button>';return;}panel().innerHTML='<p class="book-note">'+fmt(d)+' — choose a time</p><div class="book-grid">'+s.map(function(t){return '<button class="book-chip" onclick="dsBook.pickTime(\\''+t+'\\')">'+t+'</button>';}).join('')+'</div><button class="book-note" style="background:none;border:0;cursor:pointer;text-decoration:underline" onclick="dsBook.renderDates()">&larr; Back to dates</button>';});}
  function pickTime(t){state.time=t;post('/driving-school/'+wid+'/book-lesson',{studentEmail:state.email,date:state.date,time:t}).then(function(r){if(r.ok){ok();}else{alert((r.j&&r.j.error)||'That slot was just taken');pickDate(state.date);}});}
  function ok(){panel().innerHTML='<div class="book-ok"><div class="tick">&#10003;</div><h3 style="font-family:var(--font-h)">Lesson booked!</h3><p class="book-note">See you on '+state.date+' at '+state.time+'. We\\'ll send a reminder about 2 hours before.</p><button class="book-btn" style="margin-top:14px" onclick="dsBook.renderDates()">Book another</button></div>';}
  function msg(m){panel().innerHTML='<p class="book-note">'+m+'</p>';}
  init();
  return {start:start,enroll:enroll,renderDates:renderDates,pickDate:pickDate,pickTime:pickTime};
})();`;
}

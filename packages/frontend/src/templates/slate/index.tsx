/**
 * Slate — the chalkboard classroom. A driving instructor TEACHES, so the whole
 * site is a beautiful slate-green schoolroom blackboard: a fine bistro/Michelin
 * menu board in real chalk, hand-drawn road diagrams (a roundabout, a route, a
 * hand-underline), a warm wooden chalk-ledge with a few chalk pieces + an eraser,
 * and coloured-chalk accents. Warm, tactile, authoritative-but-human. Not glass,
 * not gradient, not neon.
 *
 * SIGNATURE — CHALK DIAGRAMS THAT DRAW + ERASER-WIPE transitions. Each chalk SVG
 * (roundabout, hand-underline, the areas map, the "sign-up" box) DRAWS itself on
 * scroll-into-view via a pathLength-normalised stroke-dashoffset (CSS transition
 * toggled by a class), and a subtle eraser smear wipes between major sections.
 * Both are transform/opacity/stroke-offset only, so scrolling stays at 60fps.
 * Under reduced motion every diagram renders FULLY DRAWN immediately, no wipes.
 *
 * Newsreader (elegant menu-board serif — headings / prices / numerals, rendered
 * as chalk) · Caveat (a handwriting chalk script — eyebrows, annotations, the
 * "lesson" note; sparingly) · Work Sans (body / labels / nav / hours).
 *
 * Palette via CSS vars on `.tmpl-slate`: --st-slate (blackboard, page bg) /
 * --st-panel (a lighter chalk panel) / --st-chalk (chalk white text) /
 * --st-accent (coral chalk, the ONE accent) / --st-sage (sage chalk, secondary).
 * Every tint derives via color-mix from those, so Customize recolouring never
 * breaks. --st-muted / --st-line are internal.
 */
import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useInView } from 'framer-motion';
import { Plus, Minus, Star, Menu, X, ArrowRight, Check } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { stStrings, type StStrings } from './strings';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, EnterMount, useCountUp, useIsEditing, reviewReplyLabel,
  usePrefersReducedMotion,
} from '../shared';
import './slate.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

// ── Chalk furniture ───────────────────────────────────────────────────────────

/**
 * SIGNATURE (1/2) — a hand-drawn chalk diagram that DRAWS itself on scroll-in.
 * Wraps SVG paths (class `st-stroke`, `pathLength={1}`) whose stroke-dashoffset
 * animates 1 → 0 via CSS when `.is-drawn` is toggled. Decorative (aria-hidden).
 * Under reduced motion it renders fully drawn immediately (CSS override + the
 * `reduced` short-circuit here).
 */
function ChalkDraw({
  viewBox, className, preserveAspectRatio, children,
}: { viewBox: string; className?: string; preserveAspectRatio?: string; children: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -12% 0px' });
  const drawn = reduced || inView;
  return (
    <svg
      ref={ref}
      className={cx('st-draw', drawn && 'is-drawn', className)}
      viewBox={viewBox}
      preserveAspectRatio={preserveAspectRatio}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/**
 * SIGNATURE (2/2) — a subtle "eraser smear" that wipes across on scroll-in
 * (scaleX 0.15 → 1 + fade). Decorative divider between major sections. Cheap
 * (transform/opacity only); pre-wiped under reduced motion.
 */
function EraserRule() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  return <div ref={ref} className={cx('st-erase', (reduced || inView) && 'is-wiped')} aria-hidden="true" />;
}

/** The warm wooden chalk-ledge with a few chalk pieces + an eraser. Decorative. */
function ChalkLedge() {
  return (
    <div className="st-ledge" aria-hidden="true">
      <span className="st-ledge-wood" />
      <span className="st-chalk-piece st-chalk-a" />
      <span className="st-chalk-piece st-chalk-b" />
      <span className="st-chalk-piece st-chalk-c" />
      <span className="st-ledge-eraser" />
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="st-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill={i < n ? 'var(--st-accent)' : 'none'} color={i < n ? 'var(--st-accent)' : 'var(--st-line)'} />
      ))}
    </span>
  );
}

// ── Nav (a full-bleed board header) ─────────────────────────────────────────────

const navLinks = (s: StStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about, label: s.navAbout },
  { id: SECTION_IDS.areas, label: s.navAreas },
  { id: SECTION_IDS.reviews, label: s.navReviews },
  { id: SECTION_IDS.faq, label: s.navFaq },
];

function StNav({ data, active }: { data: TemplateData; active: string }) {
  const s = stStrings(data.locale);
  const [open, setOpen] = useState(false);
  const links = navLinks(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  return (
    <nav className="st-nav" aria-label={s.mainNavAria}>
      <div className="st-nav-inner">
        <button className="st-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label={s.goToTopAria}>
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={30} bg="var(--st-accent)" fg="var(--st-slate)" radius={7} />
          </span>
          <span className="st-logo-word" data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <div className="st-nav-links">
          {links.map(({ id, label }) => (
            <button
              key={id}
              className={cx('st-nav-link', active === id && 'is-active')}
              onClick={() => scrollToSection(id)}
              data-edit={`copy.nav_${id}`}
              data-edit-type="text"
            >
              {data.copy?.[`nav_${id}`] ?? label}
            </button>
          ))}
        </div>
        <div className="st-nav-end">
          {data.accountUrl && (
            <a href={data.accountUrl} className="st-btn st-btn-ghost st-btn-sm">{data.copy?.nav_account ?? s.navAccount}</a>
          )}
          <button className="st-btn st-btn-primary st-btn-sm" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{bookLabel}</button>
          <button className="st-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && (
        <div className="st-nav-mobile">
          {links.map(({ id, label }) => <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{label}</button>)}
          {data.accountUrl && <a href={data.accountUrl} className="st-nav-mobile-link">{data.copy?.nav_account ?? s.navAccount}</a>}
        </div>
      )}
    </nav>
  );
}

// ── Hero (big chalk headline + CTAs | a pinned classroom photo & a roundabout) ──

function StHero({ data }: { data: TemplateData }) {
  const s = stStrings(data.locale);
  const { hero } = data;
  return (
    <section id={SECTION_IDS.hero} className="st-section st-hero">
      <div className="st-wrap st-hero-grid">
        <div className="st-hero-copy">
          <Reveal><p className="st-script st-hero-eyebrow"><span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h1 className="st-h1" data-edit="hero.headline" data-edit-type="text">{hero.headline}</h1></Reveal>
          {/* Hand-drawn chalk underline under the headline */}
          <ChalkDraw className="st-underline" viewBox="0 0 320 14" preserveAspectRatio="none">
            <path className="st-stroke" pathLength={1} d="M4 8 C 60 3, 118 12, 176 6 S 286 4, 316 9" />
          </ChalkDraw>
          <Reveal as="p" className="st-hero-sub" delay={0.12}><span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span></Reveal>
          <Reveal className="st-hero-ctas" delay={0.18}>
            <button className="st-btn st-btn-primary" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{hero.ctaPrimary} <ArrowRight size={15} aria-hidden="true" /></button>
            <button className="st-btn st-btn-ghost" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>{hero.ctaSecondary}</button>
          </Reveal>
        </div>
        <div className="st-hero-media">
          {/* Chalk roundabout diagram — draws itself behind the pinned photo */}
          <ChalkDraw className="st-roundabout" viewBox="0 0 200 200">
            <path className="st-stroke st-stroke-sage" pathLength={1} d="M100 42 a58 58 0 1 1 -0.1 0" />
            <path className="st-stroke st-d2" pathLength={1} d="M100 96 a20 20 0 1 1 -0.1 0" />
            <path className="st-stroke st-d3" pathLength={1} d="M100 150 L100 182 M92 174 L100 182 L108 174" />
            <path className="st-stroke st-d3" pathLength={1} d="M150 100 L184 100 M176 92 L184 100 L176 108" />
            <path className="st-stroke st-d4" pathLength={1} d="M100 50 L100 18 M92 26 L100 18 L108 26" />
          </ChalkDraw>
          <span className="st-script st-hero-note" aria-hidden="true">{s.lessonNote}</span>
          <EnterMount perspective={1400} className="st-photo-tilt">
            <figure className="st-photo">
              <img src={hero.image} alt={s.heroImageAlt} className="st-photo-img" data-edit="hero.image" data-edit-type="image" />
              <figcaption className="st-photo-cap">{s.heroCaption}</figcaption>
            </figure>
          </EnterMount>
        </div>
      </div>
      <ChalkLedge />
    </section>
  );
}

// ── Stats (chalk numerals over a chalk underline) ───────────────────────────────

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value) ? Math.round(n).toLocaleString('en-US') : n.toFixed(1);
  return (
    <div ref={ref} className="st-stat" data-edit-item={`stats.${index}`}>
      <span className="st-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{formatted}{stat.suffix}</span>
      <span className="st-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function StStats({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.stats} className="st-stats">
      <div className="st-wrap st-stats-row">{data.stats.map((st, i) => <StatItem key={i} stat={st} index={i} />)}</div>
    </section>
  );
}

// ── Why (today's lesson) ────────────────────────────────────────────────────────

const features = (s: StStrings) => [
  { icon: 'Route', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function StWhy({ data }: { data: TemplateData }) {
  const s = stStrings(data.locale);
  return (
    <section className="st-section st-band">
      <div className="st-wrap">
        <div className="st-head">
          <Reveal><p className="st-script st-eyebrow"><span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? s.whyEyebrowSt}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="st-h2" data-edit="copy.whyHeading" data-edit-type="text">{data.copy?.whyHeading ?? s.whyHeadingSt}</h2></Reveal>
          {/* A dashed chalk route under the heading */}
          <ChalkDraw className="st-route" viewBox="0 0 340 24" preserveAspectRatio="none">
            <path className="st-stroke st-stroke-dash" pathLength={1} d="M6 16 C 70 4, 130 20, 200 10 S 310 6, 334 14" />
          </ChalkDraw>
        </div>
        <div className="st-why-grid">
          {features(s).map((f, i) => (
            <Reveal key={i} delay={i * 0.06} className="st-why">
              <span className="st-why-icon"><DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={22} strokeWidth={1.6} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" /></span>
              <h3 className="st-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">{data.copy?.[f.titleKey] ?? f.title}</h3>
              <p className="st-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">{data.copy?.[f.bodyKey] ?? f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages (chalk-framed panels) ──────────────────────────────────────────────

function StPackages({ data }: { data: TemplateData }) {
  const s = stStrings(data.locale);
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="st-section">
      <div className="st-wrap">
        <div className="st-head">
          <Reveal><p className="st-script st-eyebrow"><span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? s.packagesEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="st-h2" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingSt}</h2></Reveal>
          <Reveal as="p" className="st-lead" delay={0.12}><span data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubSt}</span></Reveal>
        </div>
        <div className="st-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.06} data-edit-item={`packages.${i}`}>
              <div className={cx('st-pkg', pkg.popular && 'is-popular')}>
                {pkg.popular && <span className="st-script st-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">★ {pkg.badge ?? s.badgePopular}</span>}
                <p className="st-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                <p className="st-pkg-price">
                  <span className="st-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">₪{pkg.price}</span>
                  {pkg.unit && <span className="st-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                </p>
                <ul className="st-pkg-features">
                  {pkg.features.map((f, fi) => (
                    <li key={fi}><Check size={14} className="st-check" aria-hidden="true" /><span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span></li>
                  ))}
                </ul>
                <button className={cx('st-btn', pkg.popular ? 'st-btn-primary' : 'st-btn-ghost', 'st-btn-block')} data-edit="labels.packageCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
                  {pkg.popular ? (labels?.packageCtaPopular ?? labels?.packageCta ?? s.bookThisPlan) : (labels?.packageCta ?? s.packageCta)}
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── About ───────────────────────────────────────────────────────────────────────

function StAbout({ data }: { data: TemplateData }) {
  const s = stStrings(data.locale);
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="st-section st-band">
      <div className="st-wrap st-about">
        <div className="st-about-media">
          <Reveal y={26}>
            <figure className="st-photo st-photo-still">
              <img src={about.image} alt={s.aboutImageAlt} className="st-photo-img st-about-img" data-edit="about.image" data-edit-type="image" />
            </figure>
          </Reveal>
          <Reveal delay={0.1} className="st-instructor">
            <img src={instructor.photo} alt={instructor.name} className="st-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div className="st-instructor-id">
              <p className="st-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p>
              <p className="st-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
            </div>
          </Reveal>
        </div>
        <div className="st-about-copy">
          <Reveal><p className="st-script st-eyebrow"><span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? s.aboutEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="st-h2 st-h2-tight" data-edit="about.heading" data-edit-type="text">{about.heading}</h2></Reveal>
          {about.body.map((p, i) => (
            <Reveal key={i} as="p" className="st-body" delay={0.1 + i * 0.06}><span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span></Reveal>
          ))}
          <Reveal delay={0.22}>
            <ul className="st-checklist">
              {about.checklist.map((item, i) => (
                <li key={i} data-edit-item={`about.checklist.${i}`}>
                  <Check size={15} strokeWidth={2.4} className="st-check" aria-hidden="true" />
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          {instructor.bio && <Reveal as="p" className="st-body" delay={0.26}><span data-edit="instructor.bio" data-edit-type="text">{instructor.bio}</span></Reveal>}
          {instructor.credentials.length > 0 && (
            <Reveal delay={0.3}>
              <div className="st-creds">
                {instructor.credentials.map((c, i) => (
                  <span key={i} className="st-cred" data-edit-item={`instructor.credentials.${i}`}>
                    <Check size={12} strokeWidth={2.6} aria-hidden="true" />
                    <span data-edit={`instructor.credentials.${i}`} data-edit-type="text">{c}</span>
                  </span>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Areas (a chalk-drawn map + a list with sage pins) ───────────────────────────

function StAreas({ data }: { data: TemplateData }) {
  const s = stStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="st-section">
      <div className="st-wrap st-areas-grid">
        <div className="st-areas-map-col">
          <div className="st-head">
            <Reveal><p className="st-script st-eyebrow"><span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? s.areasEyebrowSt}</span></p></Reveal>
            <Reveal delay={0.06}><h2 className="st-h2" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingSt}</h2></Reveal>
          </div>
          <div className="st-map">
            <ChalkDraw className="st-map-svg" viewBox="0 0 300 220">
              <path className="st-stroke" pathLength={1} d="M18 176 C 70 150, 60 96, 118 92 S 210 108, 214 66 S 262 34, 284 44" />
              <path className="st-stroke st-stroke-dash st-d2" pathLength={1} d="M40 40 C 96 62, 120 40, 150 70 S 208 150, 262 170" />
              <circle className="st-pin st-d2" cx="18" cy="176" r="5" />
              <circle className="st-pin st-d3" cx="118" cy="92" r="5" />
              <circle className="st-pin st-d3" cx="214" cy="66" r="5" />
              <circle className="st-pin st-d4" cx="284" cy="44" r="5" />
            </ChalkDraw>
            <span className="st-script st-map-note" aria-hidden="true">{s.routesNote}</span>
          </div>
        </div>
        <ul className="st-areas">
          {data.areas.map((area, i) => (
            <Reveal key={i} as="li" delay={(i % 4) * 0.04} className="st-area" data-edit-item={`areas.${i}`}>
              <span className="st-area-pin" aria-hidden="true" />
              <span className="st-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              {area.note && <span className="st-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Reviews (chalk note cards) ──────────────────────────────────────────────────

function StReviews({ data }: { data: TemplateData }) {
  const s = stStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="st-section st-band">
      <div className="st-wrap">
        <div className="st-head">
          <Reveal><p className="st-script st-eyebrow"><span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? s.reviewsEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="st-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingSt}</h2></Reveal>
        </div>
        <div className="st-reviews">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06} className="st-review" data-edit-item={`reviews.${i}`}>
              <span className="st-quote" aria-hidden="true">“</span>
              <Stars n={r.rating} />
              <blockquote className="st-script st-review-text"><span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span></blockquote>
              {r.reply && (
                <p className="st-review-reply">
                  <span className="st-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                </p>
              )}
              <div className="st-review-meta">
                {r.avatar && <img src={r.avatar} alt={r.name} className="st-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                <div>
                  <p className="st-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                  {r.meta && <p className="st-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery (pinned plates) ─────────────────────────────────────────────────────

function StGallery({ data }: { data: TemplateData }) {
  const s = stStrings(data.locale);
  return (
    <section className="st-section">
      <div className="st-wrap">
        <div className="st-head">
          <Reveal><p className="st-script st-eyebrow"><span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? s.galleryEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="st-h2" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingSt}</h2></Reveal>
        </div>
        <div className="st-gallery">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06} className="st-gallery-cell" data-edit-item={`gallery.${i}`}>
              <img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ (chalk-ruled rows) ──────────────────────────────────────────────────────

function StFaq({ data }: { data: TemplateData }) {
  const s = stStrings(data.locale);
  const [open, setOpen] = useState<number | null>(0);
  const editing = useIsEditing();
  return (
    <section id={SECTION_IDS.faq} className="st-section st-band">
      <div className="st-wrap st-faq-wrap">
        <div className="st-head">
          <Reveal><p className="st-script st-eyebrow"><span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? s.faqEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="st-h2" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingSt}</h2></Reveal>
        </div>
        <div className="st-faq-list">
          {data.faqs.map((faq, i) => {
            const isOpen = editing || open === i;
            return (
              <div key={i} className="st-faq-item" data-edit-item={`faqs.${i}`}>
                <button className="st-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span data-edit={`faqs.${i}.q`} data-edit-type="text">{faq.q}</span>
                  <span className="st-faq-ic" aria-hidden="true">{isOpen ? <Minus size={16} /> : <Plus size={16} />}</span>
                </button>
                <div className={cx('st-faq-panel', isOpen && 'is-open')}>
                  <div className="st-faq-panel-in"><p data-edit={`faqs.${i}.a`} data-edit-type="text">{faq.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Book (sign up on the board) ─────────────────────────────────────────────────

function StBook({ data }: { data: TemplateData }) {
  const s = stStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="st-section">
      <EraserRule />
      <div className="st-wrap">
        <Reveal className="st-book">
          {/* Hand-drawn chalk box around the sign-up panel */}
          <ChalkDraw className="st-book-frame" viewBox="0 0 600 320" preserveAspectRatio="none">
            <path className="st-stroke" pathLength={1} d="M14 20 C 160 12, 300 14, 452 12 S 588 16, 586 26 C 592 120, 588 220, 588 296 C 440 306, 300 304, 148 306 S 16 302, 14 294 C 8 200, 12 110, 14 20 Z" />
          </ChalkDraw>
          <div className="st-book-inner">
            <h2 className="st-h2" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingSt}</h2>
            <p className="st-lead" data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodySt}</p>
            <div className="st-book-ctas">
              {data.bookingUrl ? (
                <a href={data.bookingUrl} className="st-btn st-btn-primary" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></a>
              ) : (
                <button type="button" className="st-btn st-btn-primary" title={s.publishNote} disabled aria-disabled="true" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></button>
              )}
              {data.enrollUrl && <a href={data.enrollUrl} className="st-btn st-btn-ghost"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span></a>}
            </div>
          </div>
          <ChalkLedge />
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer ────────────────────────────────────────────────────────────

function StContact({ data }: { data: TemplateData }) {
  const s = stStrings(data.locale);
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="st-footer">
      <div className="st-wrap st-footer-grid">
        <div>
          <p className="st-script st-eyebrow"><span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeading}</span></p>
          <div className="st-contact-info">
            <a href={`tel:${contact.phone}`} className="st-contact-link"><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={16} strokeWidth={1.6} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span></a>
            <a href={`mailto:${contact.email}`} className="st-contact-link"><DynamicIcon name={data.icons?.email ?? 'Mail'} size={16} strokeWidth={1.6} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span></a>
            <span className="st-contact-link"><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={16} strokeWidth={1.6} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span></span>
          </div>
          <div className="st-socials">
            {socials.map((so, i) => (
              <a key={i} href={so.url} className="st-social" target="_blank" rel="noreferrer" aria-label={so.platform} data-edit-item={`contact.socials.${i}`}>
                <SocialIcon platform={so.platform} size={16} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="st-script st-eyebrow"><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabel}</span></p>
          <table className="st-hours">
            <tbody>
              {hours.map((h) => (
                <tr key={h.day} className={h.closed ? 'is-closed' : ''}>
                  <td>{h.day}</td>
                  <td>{h.closed ? s.closedLabel : `${h.open} – ${h.close}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="st-wrap st-footer-bottom">
        <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
        <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCredit}</span>
      </div>
    </footer>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────

export default function Slate({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts(['https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Caveat:wght@500;600;700&family=Work+Sans:wght@400;500;600;700&display=swap']);
  const active = useScrollSpy(Object.values(SECTION_IDS));
  return (
    <div className="tmpl-slate" dir={data.dir} style={data.theme as CSSProperties} data-edit="theme.bg" data-edit-type="background">
      <StNav data={data} active={active} />
      <main>
        <StHero data={data} />
        <StStats data={data} />
        <StWhy data={data} />
        {data.packages.length > 0 && <StPackages data={data} />}
        <StAbout data={data} />
        <StAreas data={data} />
        {data.reviews.length > 0 && <StReviews data={data} />}
        {data.gallery.length > 0 && <StGallery data={data} />}
        <StFaq data={data} />
        <StBook data={data} />
        <StContact data={data} />
      </main>
    </div>
  );
}

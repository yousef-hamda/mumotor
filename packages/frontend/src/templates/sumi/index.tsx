/**
 * Sumi — a fine Japanese sumi-e (ink-wash) brush painting. Warm washi paper, soft
 * black sumi ink, one vermilion hanko seal. Calm, meditative, elegant, artful —
 * the antithesis of loud. Monochrome ink + one red seal, lots of quiet space,
 * every mark hand-brushed.
 *
 * SIGNATURE — the BRUSHED ENSO + INK BLOOM reveals + the HANKO SEAL. The hero
 * features a large hand-brushed enso (zen circle) that DRAWS itself on mount via a
 * pathLength-normalised stroke-dashoffset (CSS transition toggled by a class); as
 * sections enter view a soft ink bloom diffuses into the paper behind the heading;
 * and a vermilion hanko seal STAMPS the business initial on the hero + the Book
 * invitation. All decorative marks are aria-hidden and, under reduced motion,
 * render fully drawn / pre-stamped. Real headings stay real, editable text.
 *
 * Zen Old Mincho (elegant, calligraphic mincho serif — headings / prices /
 * numerals) + Zen Kaku Gothic New (calm Japanese gothic — body / labels /
 * eyebrows / nav / hours). Palette via CSS vars on `.tmpl-sumi`: --su-paper
 * (washi) / --su-ink / --su-vermilion (the ONE accent — CTA, links, active, seal)
 * / --su-wash (grey ink, marks) / --su-band (deeper washi). Every tint derives
 * via color-mix from those, so Customize recolouring never breaks.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion, useInView, useScroll, useMotionValueEvent } from 'framer-motion';
import { Plus, Minus, Star, Menu, X, ArrowRight, Check } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { suStrings, type SuStrings } from './strings';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, useCountUp, useIsEditing, reviewReplyLabel,
  usePrefersReducedMotion,
} from '../shared';
import './sumi.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

/** Hand-authored brushed enso (open zen ring) + a small tapered brush flick. */
const ENSO_D = 'M 138 40 C 178 62, 188 118, 156 156 C 124 194, 60 190, 36 150 C 14 114, 26 54, 70 32 C 96 19, 122 24, 150 40';
const ENSO_TAIL_D = 'M 150 40 C 158 44, 163 50, 161 59';

/** A flag that flips true just after mount so a CSS transition plays ON MOUNT
 *  (used for the hero enso — not a scroll-scrub that pre-settles at the top). */
function useMountFlag(delay = 70): boolean {
  const reduced = usePrefersReducedMotion();
  const [on, setOn] = useState(reduced);
  useEffect(() => {
    if (reduced) { setOn(true); return; }
    const t = setTimeout(() => setOn(true), delay);
    return () => clearTimeout(t);
  }, [reduced, delay]);
  return on;
}

/**
 * SIGNATURE (1/3) — the brushed enso. An open ink ring drawn with a
 * pathLength-normalised stroke-dashoffset. `mount` → draws on mount (hero);
 * otherwise draws when scrolled into view (Book climax). Decorative.
 * Under reduced motion it renders fully drawn (CSS override + short-circuit).
 */
function Enso({ mount = false, className, size }: { mount?: boolean; className?: string; size?: number }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const mounted = useMountFlag();
  const drawn = reduced || (mount ? mounted : inView);
  return (
    <svg
      ref={ref}
      className={cx('su-enso', drawn && 'is-drawn', className)}
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={size ? { width: size, height: size } : undefined}
    >
      <path className="su-enso-path" pathLength={1} d={ENSO_D} />
      <path className="su-enso-tail" pathLength={1} d={ENSO_TAIL_D} />
    </svg>
  );
}

/**
 * SIGNATURE (2/3) — an ink bloom that diffuses into the paper as a section enters
 * view (scale 0.85 → 1 + opacity 0 → ~0.9, soft-blurred so it reads like ink on
 * washi). Decorative (aria-hidden), transform/opacity only. Pre-bloomed under
 * reduced motion.
 */
function InkBloom({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -12% 0px' });
  return <span ref={ref} className={cx('su-bloom', (reduced || inView) && 'is-bloomed', className)} aria-hidden="true" />;
}

/**
 * SIGNATURE (3/3) — the vermilion hanko seal embossing the business initial. On
 * scroll-into-view it STAMPS (scale 1.25 → 1 with a tiny settle). Decorative
 * (aria-hidden). Under reduced motion it is simply present, pre-stamped.
 */
function Hanko({ data, size = 76 }: { data: TemplateData; size?: number }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -8% 0px' });
  const stamped = reduced || inView;
  const initial = (data.business.logoText || data.business.name || 'M').trim().charAt(0).toUpperCase();
  return (
    <span
      ref={ref}
      className={cx('su-hanko', stamped && 'is-stamped')}
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      <span className="su-hanko-face">{initial}</span>
    </span>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="su-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill={i < n ? 'var(--su-vermilion)' : 'none'} color={i < n ? 'var(--su-vermilion)' : 'var(--su-line)'} />
      ))}
    </span>
  );
}

// ── Nav (a quiet paper header) ─────────────────────────────────────────────────

const navLinks = (s: SuStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about, label: s.navAbout },
  { id: SECTION_IDS.areas, label: s.navAreas },
  { id: SECTION_IDS.reviews, label: s.navReviews },
  { id: SECTION_IDS.faq, label: s.navFaq },
];

function SuNav({ data, active }: { data: TemplateData; active: string }) {
  const s = suStrings(data.locale);
  const [open, setOpen] = useState(false);
  const links = navLinks(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  return (
    <nav className="su-nav" aria-label={s.mainNavAria}>
      <div className="su-nav-inner">
        <button className="su-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label={s.goToTopAria}>
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={30} bg="var(--su-vermilion)" fg="var(--su-paper)" radius={3} />
          </span>
          <span className="su-logo-word" data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <div className="su-nav-links">
          {links.map(({ id, label }) => (
            <button
              key={id}
              className={cx('su-nav-link', active === id && 'is-active')}
              onClick={() => scrollToSection(id)}
              data-edit={`copy.nav_${id}`}
              data-edit-type="text"
            >
              {data.copy?.[`nav_${id}`] ?? label}
            </button>
          ))}
        </div>
        <div className="su-nav-end">
          {data.accountUrl && (
            <a href={data.accountUrl} className="su-btn su-btn-ghost su-btn-sm">{data.copy?.nav_account ?? s.navAccount}</a>
          )}
          <button className="su-btn su-btn-primary su-btn-sm" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{bookLabel}</button>
          <button className="su-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && (
        <div className="su-nav-mobile">
          {links.map(({ id, label }) => <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{label}</button>)}
          {data.accountUrl && <a href={data.accountUrl} className="su-nav-mobile-link">{data.copy?.nav_account ?? s.navAccount}</a>}
        </div>
      )}
    </nav>
  );
}

// ── Hero (brush headline + ink art | ink-edged photo plate) ─────────────────────

function SuHero({ data }: { data: TemplateData }) {
  const s = suStrings(data.locale);
  const { hero } = data;
  return (
    <section id={SECTION_IDS.hero} className="su-section su-hero">
      <div className="su-wrap su-hero-grid">
        <div className="su-hero-copy">
          <Reveal><p className="su-eyebrow"><span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h1 className="su-h1" data-edit="hero.headline" data-edit-type="text">{hero.headline}</h1></Reveal>
          <Reveal as="p" className="su-hero-sub" delay={0.12}><span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span></Reveal>
          <div className="su-seal-row">
            <Hanko data={data} size={72} />
            <span className="su-seal-motto">{s.sealMotto}</span>
          </div>
          <Reveal className="su-hero-ctas" delay={0.18}>
            <button className="su-btn su-btn-primary" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{hero.ctaPrimary} <ArrowRight size={15} aria-hidden="true" /></button>
            <button className="su-btn su-btn-ghost" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>{hero.ctaSecondary}</button>
          </Reveal>
        </div>
        <div className="su-hero-media">
          <Enso mount className="su-hero-enso" />
          <Reveal y={26}>
            <figure className="su-figure">
              <div className="su-plate">
                <img src={hero.image} alt={s.heroImageAlt} className="su-plate-img" data-edit="hero.image" data-edit-type="image" />
                <span className="su-plate-brush su-plate-brush-a" aria-hidden="true" />
                <span className="su-plate-brush su-plate-brush-b" aria-hidden="true" />
              </div>
              <figcaption className="su-caption">{s.heroCaption}</figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Stats (mincho numerals over an ink brush rule) ──────────────────────────────

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value) ? Math.round(n).toLocaleString('en-US') : n.toFixed(1);
  return (
    <div ref={ref} className="su-stat" data-edit-item={`stats.${index}`}>
      <span className="su-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{formatted}{stat.suffix}</span>
      <span className="su-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function SuStats({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.stats} className="su-stats">
      <div className="su-wrap su-stats-row">{data.stats.map((st, i) => <StatItem key={i} stat={st} index={i} />)}</div>
    </section>
  );
}

// ── Why (the practice) ──────────────────────────────────────────────────────────

const features = (s: SuStrings) => [
  { icon: 'Feather', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function SuWhy({ data }: { data: TemplateData }) {
  const s = suStrings(data.locale);
  return (
    <section className="su-section su-band">
      <div className="su-wrap">
        <div className="su-head">
          <InkBloom />
          <Reveal><p className="su-eyebrow"><span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? s.whyEyebrowSu}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="su-h2" data-edit="copy.whyHeading" data-edit-type="text">{data.copy?.whyHeading ?? s.whyHeadingSu}</h2></Reveal>
        </div>
        <div className="su-why-grid">
          {features(s).map((f, i) => (
            <Reveal key={i} delay={i * 0.06} className="su-why">
              <span className="su-why-icon"><DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={20} strokeWidth={1.5} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" /></span>
              <h3 className="su-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">{data.copy?.[f.titleKey] ?? f.title}</h3>
              <p className="su-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">{data.copy?.[f.bodyKey] ?? f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages (quiet paper cards; popular gets a hanko seal) ──────────────────────

function SuPackages({ data }: { data: TemplateData }) {
  const s = suStrings(data.locale);
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="su-section">
      <div className="su-wrap">
        <div className="su-head">
          <InkBloom />
          <Reveal><p className="su-eyebrow"><span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? s.packagesEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="su-h2" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingSu}</h2></Reveal>
          <Reveal as="p" className="su-lead" delay={0.12}><span data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubSu}</span></Reveal>
        </div>
        <div className="su-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.06} data-edit-item={`packages.${i}`}>
              <div className={cx('su-pkg', pkg.popular && 'is-popular')}>
                {pkg.popular && (
                  <span className="su-pkg-seal">
                    <Hanko data={data} size={42} />
                    <span className="su-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge ?? s.badgePopular}</span>
                  </span>
                )}
                <p className="su-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                <p className="su-pkg-price">
                  <span className="su-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">₪{pkg.price}</span>
                  {pkg.unit && <span className="su-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                </p>
                <ul className="su-pkg-features">
                  {pkg.features.map((f, fi) => (
                    <li key={fi}><Check size={14} className="su-check" aria-hidden="true" /><span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span></li>
                  ))}
                </ul>
                <button className={cx('su-btn', pkg.popular ? 'su-btn-primary' : 'su-btn-ghost', 'su-btn-block')} data-edit="labels.packageCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
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

// ── About (ink-edged plate + instructor) ────────────────────────────────────────

function SuAbout({ data }: { data: TemplateData }) {
  const s = suStrings(data.locale);
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="su-section">
      <div className="su-wrap su-about">
        <div className="su-about-media">
          <Reveal y={26}>
            <figure className="su-figure">
              <div className="su-plate">
                <img src={about.image} alt={s.aboutImageAlt} className="su-plate-img su-about-img" data-edit="about.image" data-edit-type="image" />
                <span className="su-plate-brush su-plate-brush-a" aria-hidden="true" />
              </div>
            </figure>
          </Reveal>
          <Reveal delay={0.1} className="su-instructor">
            <img src={instructor.photo} alt={instructor.name} className="su-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div className="su-instructor-id">
              <p className="su-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p>
              <p className="su-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
            </div>
          </Reveal>
        </div>
        <div className="su-about-copy">
          <InkBloom className="su-bloom-start" />
          <Reveal><p className="su-eyebrow"><span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? s.aboutEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="su-h2 su-h2-tight" data-edit="about.heading" data-edit-type="text">{about.heading}</h2></Reveal>
          {about.body.map((p, i) => (
            <Reveal key={i} as="p" className="su-body" delay={0.1 + i * 0.06}><span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span></Reveal>
          ))}
          <Reveal delay={0.22}>
            <ul className="su-checklist">
              {about.checklist.map((item, i) => (
                <li key={i} data-edit-item={`about.checklist.${i}`}>
                  <Check size={15} strokeWidth={2} className="su-check" aria-hidden="true" />
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          {instructor.bio && <Reveal as="p" className="su-body" delay={0.26}><span data-edit="instructor.bio" data-edit-type="text">{instructor.bio}</span></Reveal>}
          {instructor.credentials.length > 0 && (
            <Reveal delay={0.3}>
              <div className="su-creds">
                {instructor.credentials.map((c, i) => (
                  <span key={i} className="su-cred" data-edit-item={`instructor.credentials.${i}`}>
                    <Check size={12} strokeWidth={2.5} aria-hidden="true" />
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

// ── Areas (a calm ink-brush list with vermilion seal-dots) ──────────────────────

function SuAreas({ data }: { data: TemplateData }) {
  const s = suStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="su-section su-band">
      <div className="su-wrap">
        <div className="su-head">
          <InkBloom />
          <Reveal><p className="su-eyebrow"><span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? s.areasEyebrowSu}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="su-h2" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingSu}</h2></Reveal>
        </div>
        <ul className="su-areas">
          {data.areas.map((area, i) => (
            <Reveal key={i} as="li" delay={(i % 4) * 0.04} className="su-area" data-edit-item={`areas.${i}`}>
              <span className="su-area-dot" aria-hidden="true" />
              <span className="su-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              {area.note && <span className="su-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Reviews (quiet cards, mincho quote, vermilion stars) ────────────────────────

function SuReviews({ data }: { data: TemplateData }) {
  const s = suStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="su-section">
      <div className="su-wrap">
        <div className="su-head">
          <InkBloom />
          <Reveal><p className="su-eyebrow"><span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? s.reviewsEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="su-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingSu}</h2></Reveal>
        </div>
        <div className="su-reviews">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06} className="su-review" data-edit-item={`reviews.${i}`}>
              <span className="su-quote-mark" aria-hidden="true">”</span>
              <Stars n={r.rating} />
              <blockquote className="su-review-text"><span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span></blockquote>
              {r.reply && (
                <p className="su-review-reply">
                  <span className="su-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                </p>
              )}
              <div className="su-review-meta">
                {r.avatar && <img src={r.avatar} alt={r.name} className="su-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                <div>
                  <p className="su-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                  {r.meta && <p className="su-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery (ink-mounted plates) ────────────────────────────────────────────────

function SuGallery({ data }: { data: TemplateData }) {
  const s = suStrings(data.locale);
  return (
    <section className="su-section su-band">
      <div className="su-wrap">
        <div className="su-head">
          <InkBloom />
          <Reveal><p className="su-eyebrow"><span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? s.galleryEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="su-h2" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingSu}</h2></Reveal>
        </div>
        <div className="su-gallery">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06} className="su-gallery-cell" data-edit-item={`gallery.${i}`}>
              <img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ (ink-hairline rows) ─────────────────────────────────────────────────────

function SuFaq({ data }: { data: TemplateData }) {
  const s = suStrings(data.locale);
  const [open, setOpen] = useState<number | null>(0);
  const editing = useIsEditing();
  return (
    <section id={SECTION_IDS.faq} className="su-section">
      <div className="su-wrap su-faq-wrap">
        <div className="su-head">
          <InkBloom />
          <Reveal><p className="su-eyebrow"><span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? s.faqEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="su-h2" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingSu}</h2></Reveal>
        </div>
        <div className="su-faq-list">
          {data.faqs.map((faq, i) => {
            const isOpen = editing || open === i;
            return (
              <div key={i} className="su-faq-item" data-edit-item={`faqs.${i}`}>
                <button className="su-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span data-edit={`faqs.${i}.q`} data-edit-type="text">{faq.q}</span>
                  <span className="su-faq-ic" aria-hidden="true">{isOpen ? <Minus size={15} /> : <Plus size={15} />}</span>
                </button>
                <div className={cx('su-faq-panel', isOpen && 'is-open')}>
                  <div className="su-faq-panel-in"><p data-edit={`faqs.${i}.a`} data-edit-type="text">{faq.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Book (a full-bleed washi invitation — the calm climax) ──────────────────────

function SuBook({ data }: { data: TemplateData }) {
  const s = suStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="su-book-section">
      <div className="su-wrap">
        <Reveal className="su-book">
          <Enso className="su-book-enso" />
          <Hanko data={data} size={88} />
          <h2 className="su-h2" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingSu}</h2>
          <p className="su-lead" data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodySu}</p>
          <div className="su-book-ctas">
            {data.bookingUrl ? (
              <a href={data.bookingUrl} className="su-btn su-btn-primary" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></a>
            ) : (
              <button type="button" className="su-btn su-btn-primary" title={s.publishNote} disabled aria-disabled="true" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></button>
            )}
            {data.enrollUrl && <a href={data.enrollUrl} className="su-btn su-btn-ghost"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span></a>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer ────────────────────────────────────────────────────────────

function SuContact({ data }: { data: TemplateData }) {
  const s = suStrings(data.locale);
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="su-footer">
      <div className="su-wrap su-footer-grid">
        <div>
          <p className="su-eyebrow"><span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeading}</span></p>
          <div className="su-contact-info">
            <a href={`tel:${contact.phone}`} className="su-contact-link"><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span></a>
            <a href={`mailto:${contact.email}`} className="su-contact-link"><DynamicIcon name={data.icons?.email ?? 'Mail'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span></a>
            <span className="su-contact-link"><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span></span>
          </div>
          <div className="su-socials">
            {socials.map((so, i) => (
              <a key={i} href={so.url} className="su-social" target="_blank" rel="noreferrer" aria-label={so.platform} data-edit-item={`contact.socials.${i}`}>
                <SocialIcon platform={so.platform} size={16} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="su-eyebrow"><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabel}</span></p>
          <table className="su-hours">
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
      <div className="su-wrap su-footer-bottom">
        <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
        <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCredit}</span>
      </div>
    </footer>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────

export default function Sumi({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts(['https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@400;500;600;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap']);
  const active = useScrollSpy(Object.values(SECTION_IDS));
  const rootRef = useRef<HTMLDivElement>(null);
  // A single scroll value written to a CSS var (one motion-value event → one write)
  // for a very subtle paper-wash parallax. Transform-translate only, so it stays cheap.
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ['start start', 'end end'] });
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    rootRef.current?.style.setProperty('--su-scroll', v.toFixed(4));
  });

  return (
    <div ref={rootRef} className="tmpl-sumi" dir={data.dir} style={data.theme as CSSProperties} data-edit="theme.bg" data-edit-type="background">
      <div className="su-paper-wash" aria-hidden="true" />
      <SuNav data={data} active={active} />
      <main>
        <SuHero data={data} />
        <SuStats data={data} />
        <SuWhy data={data} />
        {data.packages.length > 0 && <SuPackages data={data} />}
        <SuAbout data={data} />
        <SuAreas data={data} />
        {data.reviews.length > 0 && <SuReviews data={data} />}
        {data.gallery.length > 0 && <SuGallery data={data} />}
        <SuFaq data={data} />
        <SuBook data={data} />
        <SuContact data={data} />
      </main>
    </div>
  );
}

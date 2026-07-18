/**
 * Meridian — the survey sheet. An atlas plate for an instructor whose whole job is
 * route-finding: a neatline framing the page, margin coordinate ticks that annotate
 * the section order, a fixed contour-line plane, and one plotted route line that
 * draws itself down the page as you scroll, threading the sections like a survey.
 *
 * Engraved, not decorated: Instrument Serif display + IBM Plex Mono annotation +
 * IBM Plex Sans body. No glass, no gradients, no neon, no shadow puffiness.
 *
 * Palette via CSS vars on `.tmpl-meridian`: --mr-paper (survey paper) / --mr-ink /
 * --mr-route (survey magenta — the ONE accent) / --mr-contour (hairlines) /
 * --mr-water (map teal, secondary). Every tint derives via color-mix from those,
 * so Customize recolouring never breaks.
 */
import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, useInView, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { Plus, Minus, Star, Menu, X, ArrowRight, Check, Compass } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { mrStrings, type MrStrings } from './strings';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, useCountUp, useIsEditing, reviewReplyLabel,
  useScrollParallax, usePrefersReducedMotion,
} from '../shared';
import './meridian.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

/**
 * A one-shot entrance tilt that plays ON MOUNT (page load) — so the hero plate
 * actually animates as it appears, instead of the scroll-scrub EnterTilt which is
 * pre-settled for a top-of-page hero and only reads once you scroll far past it.
 */
function EnterMount({ children, className, delay = 0.12 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <div className={className} style={{ perspective: 1400 }}>
      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: 12, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
        transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1], delay }}
        style={{ transformStyle: 'preserve-3d', willChange: 'transform', transformOrigin: '50% 100%' }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Hand-authored S-curve threading the sheet. viewBox 0 0 40 1000, stretched to
 *  the viewport height with preserveAspectRatio="none". */
const ROUTE_D = 'M 20 0 C 34 120, 6 240, 20 360 C 34 480, 6 600, 20 720 C 34 840, 8 940, 20 1000';
/** Static waypoint markers sampled along ROUTE_D. */
const WAYPOINTS: [number, number][] = [
  [24, 90], [16, 270], [24, 450], [16, 630], [24, 810], [20, 966],
];

function Stars({ n }: { n: number }) {
  return (
    <span className="mr-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill={i < n ? 'var(--mr-route)' : 'none'} color={i < n ? 'var(--mr-route)' : 'var(--mr-contour)'} />
      ))}
    </span>
  );
}

/** Margin coordinate tick — e.g. "01 / HERO". Decorative; encodes the section order. */
function MrTick({ n, label }: { n: number; label: string }) {
  return (
    <span className="mr-tick" aria-hidden="true">
      {String(n).padStart(2, '0')} <span className="mr-tick-sep">/</span> {label}
    </span>
  );
}

// ── The sheet furniture: neatline · contour plane · route line ─────────────────

/** The map-sheet border, drawn over the content but under the nav. */
function MrNeatline() {
  return <div className="mr-neatline" aria-hidden="true" />;
}

/**
 * SIGNATURE — one polyline that draws itself as the page scrolls, using a
 * pathLength-normalised strokeDashoffset (the cheapest correct way). Under
 * reduced motion it renders fully drawn with no scroll binding.
 */
function MrRoute({ progress }: { progress: MotionValue<number> }) {
  const reduced = usePrefersReducedMotion();
  const dashoffset = useTransform(progress, (p) => 1 - p);
  return (
    <svg className="mr-route-svg" viewBox="0 0 40 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <motion.path
        d={ROUTE_D}
        fill="none"
        stroke="var(--mr-route)"
        strokeWidth="1.5"
        pathLength={1}
        strokeDasharray="1 1"
        style={reduced ? { strokeDashoffset: 0 } : { strokeDashoffset: dashoffset }}
      />
      {WAYPOINTS.map(([cxp, cyp]) => (
        <circle key={cyp} cx={cxp} cy={cyp} r="3" fill="var(--mr-paper)" stroke="var(--mr-route)" strokeWidth="1" />
      ))}
    </svg>
  );
}

// ── Nav (a legend bar) ────────────────────────────────────────────────────────

const navLinks = (s: MrStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about, label: s.navAbout },
  { id: SECTION_IDS.areas, label: s.navAreas },
  { id: SECTION_IDS.reviews, label: s.navReviews },
  { id: SECTION_IDS.faq, label: s.navFaq },
];

function MrNav({ data, active }: { data: TemplateData; active: string }) {
  const s = mrStrings(data.locale);
  const [open, setOpen] = useState(false);
  const links = navLinks(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  return (
    <nav className="mr-nav" aria-label={s.mainNavAria}>
      {/* Neatline corner brackets — the map-sheet frame quotes itself into the bar. */}
      <span className="mr-nav-crop" aria-hidden="true" />
      <div className="mr-nav-inner">
        <div className="mr-nav-lead">
          <button className="mr-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label={s.goToTopAria}>
            <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
              <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={28} bg="var(--mr-ink)" fg="var(--mr-paper)" radius={2} />
            </span>
            <span data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
          </button>
          {/* Cartographic coordinate annotation — decorative, echoes the survey-plate margin ticks. */}
          <span className="mr-nav-coord" aria-hidden="true">31.78°N</span>
        </div>
        <div className="mr-nav-links">
          <span className="mr-nav-tick" aria-hidden="true" />
          {links.map(({ id, label }) => (
            <button
              key={id}
              className={cx('mr-nav-link', active === id && 'is-active')}
              onClick={() => scrollToSection(id)}
              data-edit={`copy.nav_${id}`}
              data-edit-type="text"
            >
              {data.copy?.[`nav_${id}`] ?? label}
            </button>
          ))}
        </div>
        <div className="mr-nav-end">
          <span className="mr-nav-coord mr-nav-coord-end" aria-hidden="true">35.21°E</span>
          <Compass className="mr-nav-compass" size={16} strokeWidth={1.3} aria-hidden="true" />
          {data.accountUrl && (
            <a href={data.accountUrl} className="mr-btn mr-btn-ghost mr-btn-sm">{data.copy?.nav_account ?? s.navAccount}</a>
          )}
          <button className="mr-btn mr-btn-primary mr-btn-sm" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{bookLabel}</button>
          <button className="mr-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && (
        <div className="mr-nav-mobile">
          {links.map(({ id, label }) => <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{label}</button>)}
          {data.accountUrl && <a href={data.accountUrl} className="mr-nav-mobile-link">{data.copy?.nav_account ?? s.navAccount}</a>}
        </div>
      )}
    </nav>
  );
}

// ── Hero (asymmetric: engraved title | map plate) ─────────────────────────────

function MrHero({ data }: { data: TemplateData }) {
  const s = mrStrings(data.locale);
  const { hero } = data;
  return (
    <section id={SECTION_IDS.hero} className="mr-section mr-hero">
      <MrTick n={1} label={s.tickHero} />
      <div className="mr-wrap mr-hero-grid">
        <div className="mr-hero-copy">
          <Reveal><p className="mr-eyebrow"><span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h1 className="mr-h1" data-edit="hero.headline" data-edit-type="text">{hero.headline}</h1></Reveal>
          <Reveal as="p" className="mr-hero-sub" delay={0.12}><span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span></Reveal>
          <Reveal className="mr-hero-ctas" delay={0.18}>
            <button className="mr-btn mr-btn-primary" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{hero.ctaPrimary} <ArrowRight size={15} aria-hidden="true" /></button>
            <button className="mr-btn mr-btn-ghost" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>{hero.ctaSecondary}</button>
          </Reveal>
        </div>
        <div className="mr-hero-media">
          <EnterMount>
            <figure className="mr-figure">
              <div className="mr-plate mr-crop">
                <img src={hero.image} alt={s.heroImageAlt} className="mr-plate-img" data-edit="hero.image" data-edit-type="image" />
              </div>
              <figcaption className="mr-caption">{s.heroCaption}</figcaption>
            </figure>
          </EnterMount>
        </div>
      </div>
    </section>
  );
}

// ── Stats ──────────────────────────────────────────────────────────────────────

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value) ? Math.round(n).toLocaleString('en-US') : n.toFixed(1);
  return (
    <div ref={ref} className="mr-stat" data-edit-item={`stats.${index}`}>
      <span className="mr-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{formatted}{stat.suffix}</span>
      <span className="mr-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function MrStats({ data }: { data: TemplateData }) {
  const s = mrStrings(data.locale);
  return (
    <section id={SECTION_IDS.stats} className="mr-stats">
      <MrTick n={2} label={s.tickStats} />
      <div className="mr-wrap mr-stats-row">{data.stats.map((st, i) => <StatItem key={i} stat={st} index={i} />)}</div>
    </section>
  );
}

// ── Why (the legend) ──────────────────────────────────────────────────────────

const features = (s: MrStrings) => [
  { icon: 'Route', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function MrWhy({ data }: { data: TemplateData }) {
  const s = mrStrings(data.locale);
  return (
    <section className="mr-section">
      <MrTick n={3} label={s.tickWhy} />
      <div className="mr-wrap">
        <Reveal><p className="mr-eyebrow"><span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? s.whyEyebrowMr}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="mr-h2" data-edit="copy.whyHeading" data-edit-type="text">{data.copy?.whyHeading ?? s.whyHeadingMr}</h2></Reveal>
        <div className="mr-why-grid">
          {features(s).map((f, i) => (
            <Reveal key={i} delay={i * 0.06} className="mr-why">
              <span className="mr-why-icon"><DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={20} strokeWidth={1.5} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" /></span>
              <h3 className="mr-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">{data.copy?.[f.titleKey] ?? f.title}</h3>
              <p className="mr-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">{data.copy?.[f.bodyKey] ?? f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages (map plates) ─────────────────────────────────────────────────────

function MrPackages({ data }: { data: TemplateData }) {
  const s = mrStrings(data.locale);
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="mr-section">
      <MrTick n={4} label={s.tickPackages} />
      <div className="mr-wrap">
        <Reveal><p className="mr-eyebrow"><span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? s.packagesEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="mr-h2" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingMr}</h2></Reveal>
        <Reveal as="p" className="mr-lead" delay={0.12}><span data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubMr}</span></Reveal>
        <div className="mr-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.06} data-edit-item={`packages.${i}`}>
              <div className={cx('mr-pkg', 'mr-crop', pkg.popular && 'is-popular')}>
                {pkg.popular && <span className="mr-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge ?? s.badgePopular}</span>}
                <p className="mr-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                <p className="mr-pkg-price">
                  <span className="mr-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">₪{pkg.price}</span>
                  {pkg.unit && <span className="mr-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                </p>
                <ul className="mr-pkg-features">
                  {pkg.features.map((f, fi) => (
                    <li key={fi}><Check size={14} className="mr-check" aria-hidden="true" /><span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span></li>
                  ))}
                </ul>
                <button className={cx('mr-btn', pkg.popular ? 'mr-btn-primary' : 'mr-btn-ghost', 'mr-btn-block')} data-edit="labels.packageCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
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

// ── About ─────────────────────────────────────────────────────────────────────

function MrAbout({ data }: { data: TemplateData }) {
  const s = mrStrings(data.locale);
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="mr-section">
      <MrTick n={5} label={s.tickAbout} />
      <div className="mr-wrap mr-about">
        <div className="mr-about-media">
          <Reveal y={26}>
            <figure className="mr-figure">
              <div className="mr-plate mr-crop">
                <img src={about.image} alt={s.aboutImageAlt} className="mr-plate-img mr-about-img" data-edit="about.image" data-edit-type="image" />
              </div>
            </figure>
          </Reveal>
          <Reveal delay={0.1} className="mr-instructor">
            <img src={instructor.photo} alt={instructor.name} className="mr-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div className="mr-instructor-id">
              <p className="mr-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p>
              <p className="mr-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
            </div>
          </Reveal>
        </div>
        <div className="mr-about-copy">
          <Reveal><p className="mr-eyebrow"><span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? s.aboutEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="mr-h2 mr-h2-tight" data-edit="about.heading" data-edit-type="text">{about.heading}</h2></Reveal>
          {about.body.map((p, i) => (
            <Reveal key={i} as="p" className="mr-body" delay={0.1 + i * 0.06}><span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span></Reveal>
          ))}
          <Reveal delay={0.22}>
            <ul className="mr-checklist">
              {about.checklist.map((item, i) => (
                <li key={i} data-edit-item={`about.checklist.${i}`}>
                  <span className="mr-key" aria-hidden="true" />
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          {instructor.bio && <Reveal as="p" className="mr-body" delay={0.26}><span data-edit="instructor.bio" data-edit-type="text">{instructor.bio}</span></Reveal>}
          {instructor.credentials.length > 0 && (
            <Reveal delay={0.3}>
              <div className="mr-creds">
                {instructor.credentials.map((c, i) => (
                  <span key={i} className="mr-cred" data-edit-item={`instructor.credentials.${i}`}>
                    <Check size={12} strokeWidth={2} aria-hidden="true" />
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

// ── Areas (a legend list) ─────────────────────────────────────────────────────

function MrAreas({ data }: { data: TemplateData }) {
  const s = mrStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="mr-section">
      <MrTick n={6} label={s.tickAreas} />
      <div className="mr-wrap">
        <Reveal><p className="mr-eyebrow"><span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? s.areasEyebrowMr}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="mr-h2" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingMr}</h2></Reveal>
        <ul className="mr-areas">
          {data.areas.map((area, i) => (
            <Reveal key={i} as="li" delay={(i % 4) * 0.04} className="mr-area" data-edit-item={`areas.${i}`}>
              <span className="mr-key" aria-hidden="true" />
              <span className="mr-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              {area.note && <span className="mr-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Reviews ───────────────────────────────────────────────────────────────────

function MrReviews({ data }: { data: TemplateData }) {
  const s = mrStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="mr-section">
      <MrTick n={7} label={s.tickReviews} />
      <div className="mr-wrap">
        <Reveal><p className="mr-eyebrow"><span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? s.reviewsEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="mr-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingMr}</h2></Reveal>
        <div className="mr-reviews">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06} className="mr-review" data-edit-item={`reviews.${i}`}>
              <Stars n={r.rating} />
              <blockquote className="mr-review-text">“<span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span>”</blockquote>
              {r.reply && (
                <p className="mr-review-reply">
                  <span className="mr-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                </p>
              )}
              <div className="mr-review-meta">
                {r.avatar && <img src={r.avatar} alt={r.name} className="mr-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                <div>
                  <p className="mr-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                  {r.meta && <p className="mr-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery (plates) ──────────────────────────────────────────────────────────

function MrGallery({ data }: { data: TemplateData }) {
  const s = mrStrings(data.locale);
  return (
    <section className="mr-section">
      <MrTick n={8} label={s.tickGallery} />
      <div className="mr-wrap">
        <Reveal><p className="mr-eyebrow"><span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? s.galleryEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="mr-h2" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingMr}</h2></Reveal>
        <div className="mr-gallery">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06} className="mr-gallery-cell mr-crop" data-edit-item={`gallery.${i}`}>
              <img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ (hairline rows) ───────────────────────────────────────────────────────

function MrFaq({ data }: { data: TemplateData }) {
  const s = mrStrings(data.locale);
  const [open, setOpen] = useState<number | null>(0);
  const editing = useIsEditing();
  return (
    <section id={SECTION_IDS.faq} className="mr-section">
      <MrTick n={9} label={s.tickFaq} />
      <div className="mr-wrap mr-faq-wrap">
        <Reveal><p className="mr-eyebrow"><span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? s.faqEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="mr-h2" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingMr}</h2></Reveal>
        <div className="mr-faq-list">
          {data.faqs.map((faq, i) => {
            const isOpen = editing || open === i;
            return (
              <div key={i} className="mr-faq-item" data-edit-item={`faqs.${i}`}>
                <button className="mr-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span data-edit={`faqs.${i}.q`} data-edit-type="text">{faq.q}</span>
                  <span className="mr-faq-ic" aria-hidden="true">{isOpen ? <Minus size={14} /> : <Plus size={14} />}</span>
                </button>
                <div className={cx('mr-faq-panel', isOpen && 'is-open')}>
                  <div className="mr-faq-panel-in"><p data-edit={`faqs.${i}.a`} data-edit-type="text">{faq.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Book (a centred plate, the route passing behind it) ───────────────────────

function MrBook({ data }: { data: TemplateData }) {
  const s = mrStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="mr-section">
      <MrTick n={10} label={s.tickBook} />
      <div className="mr-wrap">
        <Reveal className="mr-book mr-crop">
          <h2 className="mr-h2" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingMr}</h2>
          <p className="mr-lead" data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodyMr}</p>
          <div className="mr-book-ctas">
            {data.bookingUrl ? (
              <a href={data.bookingUrl} className="mr-btn mr-btn-primary" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></a>
            ) : (
              <button type="button" className="mr-btn mr-btn-primary" title={s.publishNote} disabled aria-disabled="true" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></button>
            )}
            {data.enrollUrl && <a href={data.enrollUrl} className="mr-btn mr-btn-ghost"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span></a>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer ──────────────────────────────────────────────────────────

function MrContact({ data }: { data: TemplateData }) {
  const s = mrStrings(data.locale);
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="mr-footer">
      <MrTick n={11} label={s.tickContact} />
      <div className="mr-wrap mr-footer-grid">
        <div>
          <p className="mr-eyebrow"><span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeading}</span></p>
          <div className="mr-contact-info">
            <a href={`tel:${contact.phone}`} className="mr-contact-link"><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span></a>
            <a href={`mailto:${contact.email}`} className="mr-contact-link"><DynamicIcon name={data.icons?.email ?? 'Mail'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span></a>
            <span className="mr-contact-link"><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span></span>
          </div>
          <div className="mr-socials">
            {socials.map((so, i) => (
              <a key={i} href={so.url} className="mr-social" target="_blank" rel="noreferrer" aria-label={so.platform} data-edit-item={`contact.socials.${i}`}>
                <SocialIcon platform={so.platform} size={16} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="mr-eyebrow"><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabel}</span></p>
          <table className="mr-hours">
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
      <div className="mr-wrap mr-footer-bottom">
        <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
        <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCredit}</span>
      </div>
    </footer>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function Meridian({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts(['https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap']);
  const active = useScrollSpy(Object.values(SECTION_IDS));
  const rootRef = useRef<HTMLDivElement>(null);
  // Route-line progress: works in the window AND in the builder's inner scroll container.
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ['start start', 'end end'] });
  // Plane 1 parallax — translate-only, ~40px. Measured on a page-tall (non-fixed)
  // wrapper, because a `position: fixed` layer never moves relative to the viewport.
  const { ref: planesRef, y: contourY } = useScrollParallax(40);

  return (
    <div ref={rootRef} className="tmpl-meridian" dir={data.dir} style={data.theme as CSSProperties} data-edit="theme.bg" data-edit-type="background">
      {/* Plane 1 — contour lines (fixed, viewport-sized, no blur) */}
      <div ref={planesRef} className="mr-planes" aria-hidden="true">
        <motion.div className="mr-contours" style={{ y: contourY }} />
      </div>
      {/* Plane 2 — the plotted route */}
      <MrRoute progress={scrollYProgress} />
      <MrNeatline />
      {/* Plane 3 — content */}
      <div className="mr-content">
        <MrNav data={data} active={active} />
        <main>
          <MrHero data={data} />
          <MrStats data={data} />
          <MrWhy data={data} />
          {data.packages.length > 0 && <MrPackages data={data} />}
          <MrAbout data={data} />
          <MrAreas data={data} />
          {data.reviews.length > 0 && <MrReviews data={data} />}
          {data.gallery.length > 0 && <MrGallery data={data} />}
          <MrFaq data={data} />
          <MrBook data={data} />
          <MrContact data={data} />
        </main>
      </div>
    </div>
  );
}

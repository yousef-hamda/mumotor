/**
 * Primary — a Bauhaus / De Stijl poster for a driving instructor. Pure geometry
 * in primary colour: circles, triangles, squares, quarter-circles and bars in
 * blue / red / yellow on warm cream, composed like a Kandinsky. Flat, precise,
 * confident — not neo-brutalist, not glass, not gradient.
 *
 * SIGNATURE — a full-bleed geometric composition in the hero whose shapes ASSEMBLE
 * (translate + rotate + scale into place, staggered spring) via a ref-driven
 * `useInView` gate (never framer `whileInView`, which sticks hidden), with a couple
 * of shapes given a transform-only scroll parallax. Under reduced motion every
 * shape renders in its final assembled position with no parallax.
 *
 * Display: Jost (geometric, Futura-spirit). Body/labels/nav: Hanken Grotesk.
 * Palette via CSS vars on `.tmpl-primary`: --pm-paper / --pm-ink / --pm-blue (the
 * ONE interactive accent) / --pm-red / --pm-yellow (geometric fills) — every tint
 * derives with color-mix so Customize recolouring holds.
 */
import { useRef, useState, type CSSProperties } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { Plus, Minus, Star, Menu, X, ArrowRight, Check } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { pmStrings, type PmStrings } from './strings';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, EnterMount, useCountUp, useIsEditing, reviewReplyLabel,
  usePrefersReducedMotion,
} from '../shared';
import './primary.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

// ── The Bauhaus hero composition (aria-hidden decorative geometry) ─────────────

type ShapeColor = 'blue' | 'red' | 'yellow' | 'ink';
type ShapeKind = 'circle' | 'square' | 'triangle' | 'bar' | 'quarter' | 'ring';
interface ShapeDef {
  kind: ShapeKind;
  color: ShapeColor;
  s: CSSProperties;
  /** Resting rotation (deg) — e.g. a square rotated 45° reads as a diamond. */
  rot?: number;
  /** Offset the shape assembles FROM: dx, dy (px), extra rotation, start scale. */
  from: { x: number; y: number; r: number; sc: number };
  delay: number;
  /** Scroll-parallax track: 1 (rise) or 2 (sink+spin). Others are static. */
  par?: 1 | 2;
}

const SHAPES: ShapeDef[] = [
  { kind: 'circle',   color: 'blue',   s: { top: '-8%',    insetInlineEnd: '7%',  width: 'clamp(120px,16vw,270px)', height: 'clamp(120px,16vw,270px)' }, from: { x: 70, y: -50, r: -34, sc: 0.35 }, delay: 0.04, par: 1 },
  { kind: 'ring',     color: 'ink',    s: { top: '15%',    insetInlineEnd: '1%',  width: 'clamp(64px,9vw,140px)',   height: 'clamp(64px,9vw,140px)'   }, from: { x: 44, y: 26, r: 22, sc: 0.5 },   delay: 0.2,  par: 2 },
  { kind: 'triangle', color: 'yellow', s: { bottom: '7%',  insetInlineStart: '4%', width: 'clamp(96px,12vw,200px)',  height: 'clamp(96px,12vw,200px)'  }, from: { x: -54, y: 64, r: -42, sc: 0.45 }, delay: 0.12, par: 2 },
  { kind: 'square',   color: 'red',    s: { top: '9%',     insetInlineStart: '7%', width: 'clamp(48px,6vw,96px)',    height: 'clamp(48px,6vw,96px)'    }, rot: 45, from: { x: -34, y: -44, r: 0, sc: 0.4 }, delay: 0.24 },
  { kind: 'bar',      color: 'blue',   s: { top: '30%',    insetInlineStart: '42%', width: 'clamp(64px,8vw,130px)',  height: '14px'                    }, from: { x: 0, y: 46, r: 14, sc: 0.6 },    delay: 0.32 },
  { kind: 'quarter',  color: 'yellow', s: { bottom: '-6%', insetInlineEnd: '13%', width: 'clamp(84px,11vw,180px)',   height: 'clamp(84px,11vw,180px)'  }, rot: 0, from: { x: 44, y: 56, r: -30, sc: 0.45 }, delay: 0.28, par: 1 },
  { kind: 'circle',   color: 'red',    s: { bottom: '22%', insetInlineEnd: '42%', width: 'clamp(30px,4vw,62px)',    height: 'clamp(30px,4vw,62px)'    }, from: { x: 24, y: 34, r: 0, sc: 0.3 },    delay: 0.36 },
  { kind: 'bar',      color: 'ink',    s: { bottom: '3%',  insetInlineStart: '28%', width: 'clamp(96px,14vw,230px)', height: '8px'                     }, from: { x: -44, y: 22, r: 0, sc: 0.5 },   delay: 0.42 },
];

function Shape({ def, inView, reduced, py }: { def: ShapeDef; inView: boolean; reduced: boolean; py?: import('framer-motion').MotionValue<number> }) {
  const rest = def.rot ?? 0;
  const settled = { opacity: 1, x: 0, y: 0, rotate: rest, scale: 1 };
  const start = reduced
    ? settled
    : { opacity: 0, x: def.from.x, y: def.from.y, rotate: rest + def.from.r, scale: def.from.sc };
  return (
    <motion.div className="pm-shape-track" style={py ? { y: py } : undefined}>
      <motion.div
        className={cx('pm-shape', `pm-shape-${def.kind}`, `pm-fill-${def.color}`)}
        style={def.s}
        initial={start}
        animate={inView || reduced ? settled : start}
        transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 15, delay: def.delay }}
      />
    </motion.div>
  );
}

function HeroComposition() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -5% 0px' });
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -80]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 56]);
  return (
    <div ref={ref} className="pm-hero-shapes" aria-hidden="true">
      {SHAPES.map((d, i) => (
        <Shape key={i} def={d} inView={inView} reduced={reduced} py={d.par === 1 ? y1 : d.par === 2 ? y2 : undefined} />
      ))}
    </div>
  );
}

/** A small primary-colour marker in the section vocabulary. */
function Marker({ i }: { i: number }) {
  const kind = ['sq', 'ci', 'tr'][i % 3];
  const color = ['blue', 'red', 'yellow'][i % 3];
  return <span className={cx('pm-marker', `pm-marker-${kind}`, `pm-fill-${color}`)} aria-hidden="true" />;
}

function Stars({ n }: { n: number }) {
  return (
    <span className="pm-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={15} fill={i < n ? 'var(--pm-blue)' : 'none'} color={i < n ? 'var(--pm-blue)' : 'var(--pm-line)'} />
      ))}
    </span>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────────

const navLinks = (s: PmStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about, label: s.navAbout },
  { id: SECTION_IDS.areas, label: s.navAreas },
  { id: SECTION_IDS.reviews, label: s.navReviews },
  { id: SECTION_IDS.faq, label: s.navFaq },
];

function PmNav({ data, active }: { data: TemplateData; active: string }) {
  const s = pmStrings(data.locale);
  const [open, setOpen] = useState(false);
  const links = navLinks(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  return (
    <nav className="pm-nav" aria-label={s.mainNavAria}>
      <div className="pm-nav-inner">
        <button className="pm-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label={s.goToTopAria}>
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={30} bg="var(--pm-blue)" fg="var(--pm-paper)" radius={0} square />
          </span>
          <span data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <div className="pm-nav-links">
          {links.map(({ id, label }) => (
            <button
              key={id}
              className={cx('pm-nav-link', active === id && 'is-active')}
              onClick={() => scrollToSection(id)}
              data-edit={`copy.nav_${id}`}
              data-edit-type="text"
            >
              {data.copy?.[`nav_${id}`] ?? label}
            </button>
          ))}
        </div>
        <div className="pm-nav-end">
          {data.accountUrl && (
            <a href={data.accountUrl} className="pm-btn pm-btn-ghost pm-btn-sm">{data.copy?.nav_account ?? s.navAccount}</a>
          )}
          <button className="pm-btn pm-btn-primary pm-btn-sm" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{bookLabel}</button>
          <button className="pm-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && (
        <div className="pm-nav-mobile">
          {links.map(({ id, label }) => <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{label}</button>)}
          {data.accountUrl && <a href={data.accountUrl} className="pm-nav-mobile-link">{data.copy?.nav_account ?? s.navAccount}</a>}
        </div>
      )}
    </nav>
  );
}

// ── Hero (asymmetric: engraved copy | framed photo + assembling geometry) ──────

function PmHero({ data }: { data: TemplateData }) {
  const s = pmStrings(data.locale);
  const { hero } = data;
  return (
    <section id={SECTION_IDS.hero} className="pm-hero">
      <div className="pm-wrap pm-hero-grid">
        <div className="pm-hero-copy">
          <Reveal><p className="pm-eyebrow"><Marker i={0} /><span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h1 className="pm-h1" data-edit="hero.headline" data-edit-type="text">{hero.headline}</h1></Reveal>
          <Reveal as="p" className="pm-hero-sub" delay={0.12}><span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span></Reveal>
          <Reveal className="pm-hero-ctas" delay={0.18}>
            <button className="pm-btn pm-btn-primary" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{hero.ctaPrimary} <ArrowRight size={16} aria-hidden="true" /></button>
            <button className="pm-btn pm-btn-ghost" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>{hero.ctaSecondary}</button>
          </Reveal>
        </div>
        <div className="pm-hero-media">
          <EnterMount perspective={1400}>
            <figure className="pm-figure">
              <span className="pm-figure-block" aria-hidden="true" />
              <div className="pm-figure-frame">
                <img src={hero.image} alt={s.heroImageAlt} className="pm-figure-img" data-edit="hero.image" data-edit-type="image" />
              </div>
              <figcaption className="pm-caption">{s.heroCaption}</figcaption>
            </figure>
          </EnterMount>
        </div>
      </div>
      <HeroComposition />
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
    <div ref={ref} className="pm-stat" data-edit-item={`stats.${index}`}>
      <Marker i={index} />
      <span className="pm-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{formatted}{stat.suffix}</span>
      <span className="pm-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function PmStats({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.stats} className="pm-stats">
      <div className="pm-wrap pm-stats-row">{data.stats.map((st, i) => <StatItem key={i} stat={st} index={i} />)}</div>
    </section>
  );
}

// ── Why ─────────────────────────────────────────────────────────────────────

const features = (s: PmStrings) => [
  { icon: 'UserCheck', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function PmWhy({ data }: { data: TemplateData }) {
  const s = pmStrings(data.locale);
  return (
    <section className="pm-section">
      <div className="pm-wrap">
        <Reveal><p className="pm-eyebrow"><Marker i={1} /><span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? s.whyEyebrowPm}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="pm-h2" data-edit="copy.whyHeading" data-edit-type="text">{data.copy?.whyHeading ?? s.whyHeadingPm}</h2></Reveal>
        <div className="pm-why-grid">
          {features(s).map((f, i) => (
            <Reveal key={i} delay={i * 0.06} className="pm-why">
              <span className={cx('pm-why-icon', `pm-why-icon-${i % 3}`)}><DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={22} strokeWidth={1.75} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" /></span>
              <h3 className="pm-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">{data.copy?.[f.titleKey] ?? f.title}</h3>
              <p className="pm-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">{data.copy?.[f.bodyKey] ?? f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages ──────────────────────────────────────────────────────────────────

function PmPackages({ data }: { data: TemplateData }) {
  const s = pmStrings(data.locale);
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="pm-section">
      <div className="pm-wrap">
        <Reveal><p className="pm-eyebrow"><Marker i={2} /><span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? s.packagesEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="pm-h2" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingPm}</h2></Reveal>
        <Reveal as="p" className="pm-lead" delay={0.12}><span data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubPm}</span></Reveal>
        <div className="pm-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.06} data-edit-item={`packages.${i}`}>
              <div className={cx('pm-pkg', `pm-pkg-${i % 3}`, pkg.popular && 'is-popular')}>
                <span className="pm-pkg-bar" aria-hidden="true" />
                {pkg.popular && <span className="pm-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">★ {pkg.badge ?? s.badgePopular}</span>}
                <p className="pm-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                <p className="pm-pkg-price">
                  <span className="pm-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">₪{pkg.price}</span>
                  {pkg.unit && <span className="pm-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                </p>
                <ul className="pm-pkg-features">
                  {pkg.features.map((f, fi) => (
                    <li key={fi}><Check size={15} className="pm-check" aria-hidden="true" /><span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span></li>
                  ))}
                </ul>
                <button className={cx('pm-btn', pkg.popular ? 'pm-btn-primary' : 'pm-btn-ghost', 'pm-btn-block')} data-edit="labels.packageCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
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

function PmAbout({ data }: { data: TemplateData }) {
  const s = pmStrings(data.locale);
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="pm-section">
      <div className="pm-wrap pm-about">
        <div className="pm-about-media">
          <Reveal y={26}>
            <figure className="pm-figure">
              <span className="pm-figure-block pm-figure-block-alt" aria-hidden="true" />
              <div className="pm-figure-frame">
                <img src={about.image} alt={s.aboutImageAlt} className="pm-figure-img pm-about-img" data-edit="about.image" data-edit-type="image" />
              </div>
            </figure>
          </Reveal>
          <Reveal delay={0.1} className="pm-instructor">
            <img src={instructor.photo} alt={instructor.name} className="pm-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div className="pm-instructor-id">
              <p className="pm-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p>
              <p className="pm-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
            </div>
          </Reveal>
        </div>
        <div className="pm-about-copy">
          <Reveal><p className="pm-eyebrow"><Marker i={0} /><span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? s.aboutEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="pm-h2 pm-h2-tight" data-edit="about.heading" data-edit-type="text">{about.heading}</h2></Reveal>
          {about.body.map((p, i) => (
            <Reveal key={i} as="p" className="pm-body" delay={0.1 + i * 0.06}><span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span></Reveal>
          ))}
          <Reveal delay={0.22}>
            <ul className="pm-checklist">
              {about.checklist.map((item, i) => (
                <li key={i} data-edit-item={`about.checklist.${i}`}>
                  <Check size={16} strokeWidth={2.25} className="pm-check" aria-hidden="true" />
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          {instructor.bio && <Reveal as="p" className="pm-body" delay={0.26}><span data-edit="instructor.bio" data-edit-type="text">{instructor.bio}</span></Reveal>}
          {instructor.credentials.length > 0 && (
            <Reveal delay={0.3}>
              <div className="pm-creds">
                {instructor.credentials.map((c, i) => (
                  <span key={i} className="pm-cred" data-edit-item={`instructor.credentials.${i}`}>
                    <Check size={13} strokeWidth={2.5} aria-hidden="true" />
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

// ── Areas (geometric chips) ───────────────────────────────────────────────────

function PmAreas({ data }: { data: TemplateData }) {
  const s = pmStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="pm-section">
      <div className="pm-wrap">
        <Reveal><p className="pm-eyebrow"><Marker i={1} /><span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? s.areasEyebrowPm}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="pm-h2" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingPm}</h2></Reveal>
        <ul className="pm-areas">
          {data.areas.map((area, i) => (
            <Reveal key={i} as="li" delay={(i % 4) * 0.04} className={cx('pm-area', `pm-area-${i % 3}`)} data-edit-item={`areas.${i}`}>
              <span className="pm-area-dot" aria-hidden="true" />
              <span className="pm-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              {area.note && <span className="pm-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Reviews ───────────────────────────────────────────────────────────────────

function PmReviews({ data }: { data: TemplateData }) {
  const s = pmStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="pm-section">
      <div className="pm-wrap">
        <Reveal><p className="pm-eyebrow"><Marker i={2} /><span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? s.reviewsEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="pm-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingPm}</h2></Reveal>
        <div className="pm-reviews">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06} className={cx('pm-review', `pm-review-${i % 3}`)} data-edit-item={`reviews.${i}`}>
              <span className="pm-quote" aria-hidden="true">“</span>
              <Stars n={r.rating} />
              <blockquote className="pm-review-text">“<span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span>”</blockquote>
              {r.reply && (
                <p className="pm-review-reply">
                  <span className="pm-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                </p>
              )}
              <div className="pm-review-meta">
                {r.avatar && <img src={r.avatar} alt={r.name} className="pm-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                <div>
                  <p className="pm-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                  {r.meta && <p className="pm-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery ───────────────────────────────────────────────────────────────────

function PmGallery({ data }: { data: TemplateData }) {
  const s = pmStrings(data.locale);
  return (
    <section className="pm-section">
      <div className="pm-wrap">
        <Reveal><p className="pm-eyebrow"><Marker i={0} /><span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? s.galleryEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="pm-h2" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingPm}</h2></Reveal>
        <div className="pm-gallery">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06} className="pm-gallery-cell" data-edit-item={`gallery.${i}`}>
              <img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ (hairline rows, geometric +/−) ────────────────────────────────────────

function PmFaq({ data }: { data: TemplateData }) {
  const s = pmStrings(data.locale);
  const [open, setOpen] = useState<number | null>(0);
  const editing = useIsEditing();
  return (
    <section id={SECTION_IDS.faq} className="pm-section">
      <div className="pm-wrap pm-faq-wrap">
        <Reveal><p className="pm-eyebrow"><Marker i={1} /><span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? s.faqEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="pm-h2" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingPm}</h2></Reveal>
        <div className="pm-faq-list">
          {data.faqs.map((faq, i) => {
            const isOpen = editing || open === i;
            return (
              <div key={i} className="pm-faq-item" data-edit-item={`faqs.${i}`}>
                <button className="pm-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span data-edit={`faqs.${i}.q`} data-edit-type="text">{faq.q}</span>
                  <span className={cx('pm-faq-ic', isOpen && 'is-open')} aria-hidden="true">{isOpen ? <Minus size={15} /> : <Plus size={15} />}</span>
                </button>
                <div className={cx('pm-faq-panel', isOpen && 'is-open')}>
                  <div className="pm-faq-panel-in"><p data-edit={`faqs.${i}.a`} data-edit-type="text">{faq.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Book (full-bleed blue panel — the strong graphic moment) ───────────────────

function PmBook({ data }: { data: TemplateData }) {
  const s = pmStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="pm-book">
      <div className="pm-book-shapes" aria-hidden="true">
        <span className="pm-book-shape pm-book-circle" />
        <span className="pm-book-shape pm-book-tri" />
        <span className="pm-book-shape pm-book-square" />
      </div>
      <div className="pm-wrap">
        <Reveal className="pm-book-inner">
          <h2 className="pm-h2 pm-book-h2" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingPm}</h2>
          <p className="pm-book-body" data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodyPm}</p>
          <div className="pm-book-ctas">
            {data.bookingUrl ? (
              <a href={data.bookingUrl} className="pm-btn pm-btn-onblue" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={16} aria-hidden="true" /></a>
            ) : (
              <button type="button" className="pm-btn pm-btn-onblue" title={s.publishNote} disabled aria-disabled="true" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={16} aria-hidden="true" /></button>
            )}
            {data.enrollUrl && <a href={data.enrollUrl} className="pm-btn pm-btn-onblue-ghost"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span></a>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer ──────────────────────────────────────────────────────────

function PmContact({ data }: { data: TemplateData }) {
  const s = pmStrings(data.locale);
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="pm-footer">
      <div className="pm-strip" aria-hidden="true"><span /><span /><span /></div>
      <div className="pm-wrap pm-footer-grid">
        <div>
          <p className="pm-eyebrow"><Marker i={0} /><span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeading}</span></p>
          <div className="pm-contact-info">
            <a href={`tel:${contact.phone}`} className="pm-contact-link"><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={16} strokeWidth={1.75} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span></a>
            <a href={`mailto:${contact.email}`} className="pm-contact-link"><DynamicIcon name={data.icons?.email ?? 'Mail'} size={16} strokeWidth={1.75} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span></a>
            <span className="pm-contact-link"><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={16} strokeWidth={1.75} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span></span>
          </div>
          <div className="pm-socials">
            {socials.map((so, i) => (
              <a key={i} href={so.url} className="pm-social" target="_blank" rel="noreferrer" aria-label={so.platform} data-edit-item={`contact.socials.${i}`}>
                <SocialIcon platform={so.platform} size={17} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="pm-eyebrow"><Marker i={2} /><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabel}</span></p>
          <table className="pm-hours">
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
      <div className="pm-wrap pm-footer-bottom">
        <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
        <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCredit}</span>
      </div>
    </footer>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function Primary({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts(['https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700;800&family=Hanken+Grotesk:wght@400;500;600;700&display=swap']);
  const active = useScrollSpy(Object.values(SECTION_IDS));
  return (
    <div className="tmpl-primary" dir={data.dir} style={data.theme as CSSProperties} data-edit="theme.bg" data-edit-type="background">
      <PmNav data={data} active={active} />
      <main>
        <PmHero data={data} />
        <PmStats data={data} />
        <PmWhy data={data} />
        {data.packages.length > 0 && <PmPackages data={data} />}
        <PmAbout data={data} />
        <PmAreas data={data} />
        {data.reviews.length > 0 && <PmReviews data={data} />}
        {data.gallery.length > 0 && <PmGallery data={data} />}
        <PmFaq data={data} />
        <PmBook data={data} />
        <PmContact data={data} />
      </main>
    </div>
  );
}

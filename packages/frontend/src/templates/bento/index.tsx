/**
 * Bento — Vercel / Notion / Linear–grade spacious asymmetric bento (light).
 * Large, crisp, solid-white tiles on a cool #EEF2F8 base. Generous 26 px gaps.
 * Asymmetric column spans. Figtree headlines · Inter body.
 * Palette via CSS vars on `.tmpl-bento`:
 *   --bn-bg #EEF2F8 · --bn-ink #0B1220 · --bn-accent #4F46E5 (indigo)
 *   --bn-mint #2DD4BF · --bn-panel #FFFFFF
 */
import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ChevronDown, Check, Star, Menu, X, ArrowRight, MapPin } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import {
  SECTION_IDS,
  scrollToSection,
  useScrollSpy,
  useTemplateFonts,
  Reveal,
  useCountUp,
  useMouseTilt,
  usePrefersReducedMotion,
} from '../shared';
import './bento.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

// ── Tile primitive ──────────────────────────────────────────────────────────
// Solid-white, crisp tile with optional 3D tilt on hover. Spotlight effect
// follows the cursor via CSS custom properties set in JS.

function Tile({
  children,
  className,
  tilt = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  tilt?: boolean;
  style?: CSSProperties;
}) {
  const reduced = usePrefersReducedMotion();
  const { ref, rotateX, rotateY, onMouseMove, onMouseLeave } = useMouseTilt(4);
  const spotRef = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    if (tilt) onMouseMove(e);
    const el = spotRef.current;
    if (!el || reduced) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
    el.style.setProperty('--spot', '1');
  };
  const onLeave = () => {
    if (tilt) onMouseLeave();
    spotRef.current?.style.setProperty('--spot', '0');
  };

  return (
    <motion.div
      ref={tilt ? ref : undefined}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cx('bn-tile', className)}
      style={
        tilt && !reduced
          ? { rotateX, rotateY, transformPerspective: 1000, ...style }
          : style
      }
    >
      <div ref={spotRef} className="bn-tile-spot" aria-hidden="true" />
      <div className="bn-tile-inner">{children}</div>
    </motion.div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="bn-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={14}
          fill={i < n ? 'var(--bn-accent)' : 'none'}
          color={i < n ? 'var(--bn-accent)' : 'var(--bn-muted)'}
        />
      ))}
    </span>
  );
}

// ── Nav ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { id: SECTION_IDS.packages, label: 'Packages' },
  { id: SECTION_IDS.about,    label: 'About' },
  { id: SECTION_IDS.areas,    label: 'Areas' },
  { id: SECTION_IDS.reviews,  label: 'Reviews' },
  { id: SECTION_IDS.faq,      label: 'FAQ' },
];

function BnNav({ data, active }: { data: TemplateData; active: string }) {
  const [open, setOpen] = useState(false);
  const links = NAV_LINKS.filter(
    ({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0,
  );
  const bookLabel = data.labels?.bookCta ?? 'Book now';
  return (
    <nav className="bn-nav" aria-label="Main navigation">
      <div className="bn-nav-inner">
        <button
          className="bn-logo"
          onClick={() => scrollToSection(SECTION_IDS.hero)}
          aria-label="Go to top"
        >
          <span
            data-edit="business.logoSrc"
            data-edit-type="image"
            style={{ display: 'inline-flex' }}
          >
            <BrandMark
              letter={data.business.logoText}
              src={data.business.logoSrc}
              size={30}
              bg="#4F46E5"
              fg="#FFFFFF"
              radius={9}
            />
          </span>
          <span data-edit="business.name" data-edit-type="text">
            {data.business.logoText}
          </span>
        </button>

        <div className="bn-nav-links">
          {links.map(({ id, label }) => (
            <button
              key={id}
              className={cx('bn-nav-link', active === id && 'is-active')}
              onClick={() => scrollToSection(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bn-nav-end">
          <button
            className="bn-btn bn-btn-primary bn-btn-sm"
            data-edit="labels.bookCta"
            data-edit-type="text"
            onClick={() => scrollToSection(SECTION_IDS.book)}
          >
            {bookLabel}
          </button>
          <button
            className="bn-menu-btn"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="bn-nav-mobile"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {links.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => {
                  scrollToSection(id);
                  setOpen(false);
                }}
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ── Hero bento grid ─────────────────────────────────────────────────────────
// Layout: [copy tile spanning 2 rows] [tall image tile] [stat tile]
// The copy tile tilts subtly on hover for delight; the stat uses countUp.

function BnHeroStat({ stat }: { stat: TemplateData['stats'][number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value)
    ? Math.round(n).toLocaleString()
    : n.toFixed(1);
  return (
    <div ref={ref} className="bn-hero-stat-inner">
      <p className="bn-hero-stat-num" data-edit="stats.0.value" data-edit-type="text">
        {stat.prefix}{formatted}{stat.suffix}
      </p>
      <p className="bn-hero-stat-label" data-edit="stats.0.label" data-edit-type="text">
        {stat.label}
      </p>
    </div>
  );
}

function BnHero({ data }: { data: TemplateData }) {
  const { hero } = data;
  const firstStat = data.stats[0];
  return (
    <section id={SECTION_IDS.hero} className="bn-hero">
      <div className="bn-container bn-hero-grid">

        {/* LEFT: copy tile — spans 2 rows on desktop */}
        <Reveal className="bn-hero-copy-wrap" delay={0.0} y={24}>
          <Tile tilt className="bn-hero-copy-tile">
            <div className="bn-hero-eyebrow-row">
              <span className="bn-hero-dot" aria-hidden="true" />
              <span
                className="bn-hero-eyebrow"
                data-edit="hero.eyebrow"
                data-edit-type="text"
              >
                {hero.eyebrow}
              </span>
            </div>
            <h1 className="bn-h1" data-edit="hero.headline" data-edit-type="text">
              {hero.headline}
            </h1>
            <p
              className="bn-hero-sub"
              data-edit="hero.sub"
              data-edit-type="text"
            >
              {hero.sub}
            </p>
            <div className="bn-hero-ctas">
              <button
                className="bn-btn bn-btn-primary bn-btn-lg"
                data-edit="hero.ctaPrimary"
                data-edit-type="text"
                onClick={() => scrollToSection(SECTION_IDS.book)}
              >
                {hero.ctaPrimary} <ArrowRight size={17} aria-hidden="true" />
              </button>
              <button
                className="bn-btn bn-btn-outline bn-btn-lg"
                data-edit="hero.ctaSecondary"
                data-edit-type="text"
                onClick={() => scrollToSection(SECTION_IDS.packages)}
              >
                {hero.ctaSecondary}
              </button>
            </div>
            <div className="bn-trust-row">
              {data.instructor.credentials.slice(0, 3).map((c, i) => (
                <span key={i} className="bn-trust-chip">
                  <Check size={13} aria-hidden="true" />
                  {c}
                </span>
              ))}
            </div>
          </Tile>
        </Reveal>

        {/* RIGHT TOP: tall image tile */}
        <Reveal className="bn-hero-img-wrap" delay={0.1} y={20}>
          <Tile className="bn-hero-img-tile">
            <img
              src={hero.image}
              alt="Driving lesson in progress"
              className="bn-hero-img"
              data-edit="hero.image"
              data-edit-type="image"
            />
          </Tile>
        </Reveal>

        {/* RIGHT BOTTOM: animated stat tile */}
        {firstStat && (
          <Reveal className="bn-hero-stat-wrap" delay={0.18} y={18}>
            <Tile tilt className="bn-hero-stat-tile">
              <BnHeroStat stat={firstStat} />
            </Tile>
          </Reveal>
        )}
      </div>
    </section>
  );
}

// ── Stats strip ─────────────────────────────────────────────────────────────

function StatTile({
  stat,
  index,
}: {
  stat: TemplateData['stats'][number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value)
    ? Math.round(n).toLocaleString()
    : n.toFixed(1);

  return (
    <div ref={ref} data-edit-item={`stats.${index}`}>
      <Tile tilt className="bn-stat-tile">
        <span
          className="bn-stat-num"
          data-edit={`stats.${index}.value`}
          data-edit-type="text"
        >
          {stat.prefix}{formatted}{stat.suffix}
        </span>
        <span
          className="bn-stat-label"
          data-edit={`stats.${index}.label`}
          data-edit-type="text"
        >
          {stat.label}
        </span>
      </Tile>
    </div>
  );
}

function BnStats({ stats }: { stats: TemplateData['stats'] }) {
  return (
    <section id={SECTION_IDS.stats} className="bn-stats-section">
      <div className="bn-container bn-stats-grid">
        {stats.map((s, i) => (
          <Reveal key={i} delay={i * 0.07}>
            <StatTile stat={s} index={i} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ── Why / Features ───────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: 'HeartHandshake',
    titleKey: 'feature0Title',
    bodyKey: 'feature0Body',
    title: 'Calm, one-to-one lessons',
    body: 'Never doubled-up. Patient, steady guidance paced exactly to you.',
  },
  {
    icon: 'ShieldCheck',
    titleKey: 'feature1Title',
    bodyKey: 'feature1Body',
    title: 'Dual-control, fully insured',
    body: 'A modern dual-control car that quietly does the worrying for you.',
  },
  {
    icon: 'MapPin',
    titleKey: 'feature2Title',
    bodyKey: 'feature2Body',
    title: 'Door-to-door pickup',
    body: 'Picked up from home, work or college — at no extra cost.',
  },
];

function BnWhy({ data }: { data: TemplateData }) {
  return (
    <section className="bn-section">
      <div className="bn-container">
        <Reveal>
          <p className="bn-eyebrow">
            <span data-edit="copy.whyEyebrow" data-edit-type="text">
              {data.copy?.whyEyebrow ?? 'Why learners choose us'}
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="bn-h2" data-edit="copy.whyHeading" data-edit-type="text">
            {data.copy?.whyHeading ?? 'Everything feels calmer here.'}
          </h2>
        </Reveal>
        <div className="bn-why-grid">
          {FEATURES.map((f, i) => (
            <Reveal key={i} delay={0.08 * i}>
              <Tile tilt className="bn-feature-tile">
                <span className="bn-feature-icon">
                  <DynamicIcon
                    name={data.icons?.[`feature${i}`] ?? f.icon}
                    size={22}
                    aria-hidden="true"
                    data-edit={`icons.feature${i}`}
                    data-edit-type="icon"
                  />
                </span>
                <h3
                  className="bn-feature-title"
                  data-edit={`copy.${f.titleKey}`}
                  data-edit-type="text"
                >
                  {data.copy?.[f.titleKey] ?? f.title}
                </h3>
                <p
                  className="bn-feature-body"
                  data-edit={`copy.${f.bodyKey}`}
                  data-edit-type="text"
                >
                  {data.copy?.[f.bodyKey] ?? f.body}
                </p>
              </Tile>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages ─────────────────────────────────────────────────────────────────

function BnPackages({ data }: { data: TemplateData }) {
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="bn-section">
      <div className="bn-container">
        <Reveal>
          <p className="bn-eyebrow">
            <span data-edit="copy.packagesEyebrow" data-edit-type="text">
              {data.copy?.packagesEyebrow ?? 'Packages'}
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="bn-h2" data-edit="copy.packagesHeading" data-edit-type="text">
            {data.copy?.packagesHeading ?? 'Pick a plan that fits.'}
          </h2>
        </Reveal>
        <Reveal as="p" className="bn-section-sub" delay={0.1}>
          <span data-edit="copy.packagesSub" data-edit-type="text">
            {data.copy?.packagesSub ??
              'Transparent pricing, no hidden fees, change your mind any time.'}
          </span>
        </Reveal>
        <div className="bn-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.08}>
              <Tile
                tilt
                className={cx('bn-pkg-tile', pkg.popular && 'is-popular')}
                style={{ height: '100%' }}
              >
                <div data-edit-item={`packages.${i}`}>
                  {pkg.popular && (
                    <span className="bn-pkg-badge">{pkg.badge ?? 'Most popular'}</span>
                  )}
                  <p
                    className="bn-pkg-name"
                    data-edit={`packages.${i}.name`}
                    data-edit-type="text"
                  >
                    {pkg.name}
                  </p>
                  <div className="bn-pkg-price">
                    <span
                      className="bn-pkg-amount"
                      data-edit={`packages.${i}.price`}
                      data-edit-type="text"
                    >
                      £{pkg.price}
                    </span>
                    {pkg.unit && <span className="bn-pkg-unit">{pkg.unit}</span>}
                  </div>
                  <ul className="bn-pkg-features">
                    {pkg.features.map((f, fi) => (
                      <li key={fi}>
                        <Check size={14} className="bn-check" aria-hidden="true" />
                        <span
                          data-edit={`packages.${i}.features.${fi}`}
                          data-edit-type="text"
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={cx(
                      'bn-btn',
                      pkg.popular ? 'bn-btn-primary' : 'bn-btn-outline',
                      'bn-btn-block',
                    )}
                    data-edit="labels.packageCta"
                    data-edit-type="text"
                    onClick={() => scrollToSection(SECTION_IDS.book)}
                  >
                    {pkg.popular
                      ? (labels?.packageCtaPopular ?? labels?.packageCta ?? 'Book this plan')
                      : (labels?.packageCta ?? 'Choose plan')}
                  </button>
                </div>
              </Tile>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── About + Instructor bento ──────────────────────────────────────────────────

function BnAbout({ data }: { data: TemplateData }) {
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="bn-section">
      <div className="bn-container">
        <Reveal>
          <p className="bn-eyebrow">
            <span data-edit="copy.aboutEyebrow" data-edit-type="text">
              {data.copy?.aboutEyebrow ?? 'About'}
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2
            className="bn-h2"
            data-edit="about.heading"
            data-edit-type="text"
          >
            {about.heading}
          </h2>
        </Reveal>

        <div className="bn-about-grid">
          {/* Image tile */}
          <Reveal y={28} delay={0.0}>
            <Tile className="bn-about-img-tile" style={{ height: '100%' }}>
              <img
                src={about.image}
                alt="Instructor with a learner"
                className="bn-about-img"
                data-edit="about.image"
                data-edit-type="image"
              />
            </Tile>
          </Reveal>

          {/* Copy tile */}
          <Reveal y={28} delay={0.08}>
            <Tile className="bn-about-copy-tile" style={{ height: '100%' }}>
              {about.body.map((p, i) => (
                <p
                  key={i}
                  className="bn-about-body"
                  style={i > 0 ? { marginTop: 14 } : undefined}
                >
                  {i === 0 ? (
                    <span data-edit="about.body.0" data-edit-type="text">{p}</span>
                  ) : (
                    p
                  )}
                </p>
              ))}
              <ul className="bn-checklist">
                {about.checklist.map((item, i) => (
                  <li key={i}>
                    <Check size={16} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Tile>
          </Reveal>

          {/* Instructor card tile */}
          <Reveal y={28} delay={0.16}>
            <Tile tilt className="bn-instructor-tile" style={{ height: '100%' }}>
              <img
                src={instructor.photo}
                alt={instructor.name}
                className="bn-instructor-photo"
                data-edit="instructor.photo"
                data-edit-type="image"
              />
              <div>
                <p
                  className="bn-instructor-name"
                  data-edit="instructor.name"
                  data-edit-type="text"
                >
                  {instructor.name}
                </p>
                <p className="bn-instructor-title">{instructor.title}</p>
                <p className="bn-instructor-bio">{instructor.bio}</p>
              </div>
              <div className="bn-creds">
                {instructor.credentials.map((c, i) => (
                  <span key={i} className="bn-cred-chip">{c}</span>
                ))}
              </div>
            </Tile>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Areas — stylized coverage tile ──────────────────────────────────────────
// A "minimal map" tile: dot-grid background via CSS, area chips as interactive
// pins that highlight on hover. Calm and alive without being loud.

function BnAreas({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.areas} className="bn-section">
      <div className="bn-container">
        <Reveal>
          <p className="bn-eyebrow">
            <span data-edit="copy.areasEyebrow" data-edit-type="text">
              {data.copy?.areasEyebrow ?? 'Areas covered'}
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="bn-h2" data-edit="copy.areasHeading" data-edit-type="text">
            {data.copy?.areasHeading ?? 'We come to you.'}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <Tile className="bn-areas-tile" style={{ marginTop: 28 }}>
            {/* Coverage map header */}
            <div className="bn-areas-header">
              <div className="bn-areas-radar" aria-hidden="true">
                <span className="bn-areas-radar-ring" />
                <span className="bn-areas-radar-dot" />
              </div>
              <span className="bn-areas-meta">
                {data.areas.length} locations covered
              </span>
            </div>
            {/* Area chips — pins on the dot-grid map */}
            <div className="bn-areas-chips">
              {data.areas.map((area, i) => (
                <span
                  key={i}
                  className="bn-area-chip"
                  data-edit-item={`areas.${i}`}
                >
                  <MapPin size={13} aria-hidden="true" />
                  <span
                    data-edit={`areas.${i}.name`}
                    data-edit-type="text"
                  >
                    {area.name}
                  </span>
                  {area.note && (
                    <span className="bn-area-note">{area.note}</span>
                  )}
                </span>
              ))}
            </div>
          </Tile>
        </Reveal>
      </div>
    </section>
  );
}

// ── Reviews ───────────────────────────────────────────────────────────────────

function BnReviews({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.reviews} className="bn-section">
      <div className="bn-container">
        <Reveal>
          <p className="bn-eyebrow">
            <span data-edit="copy.reviewsEyebrow" data-edit-type="text">
              {data.copy?.reviewsEyebrow ?? 'Reviews'}
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2
            className="bn-h2"
            data-edit="copy.reviewsHeading"
            data-edit-type="text"
          >
            {data.copy?.reviewsHeading ?? 'Loved by learners.'}
          </h2>
        </Reveal>
        <div className="bn-reviews-grid">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.08}>
              <Tile tilt className="bn-review-tile">
                <Stars n={r.rating} />
                <blockquote className="bn-review-text">"{r.text}"</blockquote>
                <div className="bn-review-meta">
                  {r.avatar && (
                    <img src={r.avatar} alt={r.name} className="bn-avatar" />
                  )}
                  <div>
                    <p className="bn-review-name">{r.name}</p>
                    {r.meta && <p className="bn-review-sub">{r.meta}</p>}
                  </div>
                </div>
              </Tile>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery ───────────────────────────────────────────────────────────────────

function BnGallery({ data }: { data: TemplateData }) {
  return (
    <section className="bn-section">
      <div className="bn-container">
        <Reveal>
          <p className="bn-eyebrow">
            <span data-edit="copy.galleryEyebrow" data-edit-type="text">
              {data.copy?.galleryEyebrow ?? 'Gallery'}
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2
            className="bn-h2"
            data-edit="copy.galleryHeading"
            data-edit-type="text"
          >
            {data.copy?.galleryHeading ?? 'From the driving seat.'}
          </h2>
        </Reveal>
        <div className="bn-gallery-grid">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06}>
              <Tile className="bn-gallery-cell">
                <img src={src} alt="" loading="lazy" />
              </Tile>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

function FaqItem({
  faq,
  index,
}: {
  faq: TemplateData['faqs'][number];
  index: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Tile className="bn-faq-tile">
      {/* data-edit-item lives on inner div, not on the Tile component */}
      <div data-edit-item={`faqs.${index}`}>
        <button
          className="bn-faq-q"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span data-edit={`faqs.${index}.q`} data-edit-type="text">
            {faq.q}
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="bn-faq-chev"
            aria-hidden="true"
          >
            <ChevronDown size={18} />
          </motion.span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <p
                className="bn-faq-a"
                data-edit={`faqs.${index}.a`}
                data-edit-type="text"
              >
                {faq.a}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Tile>
  );
}

function BnFaq({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.faq} className="bn-section">
      <div className="bn-container bn-faq-wrap">
        <Reveal>
          <p className="bn-eyebrow">
            <span data-edit="copy.faqEyebrow" data-edit-type="text">
              {data.copy?.faqEyebrow ?? 'FAQ'}
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="bn-h2" data-edit="copy.faqHeading" data-edit-type="text">
            {data.copy?.faqHeading ?? 'Common questions.'}
          </h2>
        </Reveal>
        <div className="bn-faq-list">
          {data.faqs.map((faq, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <FaqItem faq={faq} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Booking CTA — bold indigo tile ────────────────────────────────────────────

function BnBook({ data }: { data: TemplateData }) {
  const bookLabel = data.labels?.bookCta ?? 'Book a lesson';
  return (
    <section id={SECTION_IDS.book} className="bn-section">
      <div className="bn-container">
        <Reveal>
          <Tile className="bn-book-tile">
            <h2
              className="bn-h2 bn-book-h"
              data-edit="copy.bookHeading"
              data-edit-type="text"
            >
              {data.copy?.bookHeading ?? 'Ready when you are.'}
            </h2>
            <p
              className="bn-book-body"
              data-edit="copy.bookBody"
              data-edit-type="text"
            >
              {data.copy?.bookBody ??
                "Pick a time that works for you and we'll take it from there."}
            </p>
            <div className="bn-book-ctas">
              {data.bookingUrl ? (
                <a
                  href={data.bookingUrl}
                  className="bn-btn bn-btn-book-primary bn-btn-lg"
                  data-edit="labels.bookCta"
                  data-edit-type="text"
                >
                  {bookLabel} <ArrowRight size={17} aria-hidden="true" />
                </a>
              ) : (
                <button
                  type="button"
                  className="bn-btn bn-btn-book-primary bn-btn-lg"
                  title="Available once your site is published"
                  data-edit="labels.bookCta"
                  data-edit-type="text"
                >
                  {bookLabel} <ArrowRight size={17} aria-hidden="true" />
                </button>
              )}
              {data.enrollUrl && (
                <a
                  href={data.enrollUrl}
                  className="bn-btn bn-btn-book-ghost bn-btn-lg"
                >
                  <span data-edit="copy.enrollCta" data-edit-type="text">
                    {data.copy?.enrollCta ?? 'Enroll'}
                  </span>
                </a>
              )}
            </div>
          </Tile>
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer ──────────────────────────────────────────────────────────

function BnContact({ data }: { data: TemplateData }) {
  const { contact, hours } = data;
  const socials = Object.entries(contact.socials ?? {});
  return (
    <footer id={SECTION_IDS.contact} className="bn-footer">
      <div className="bn-container">
        <Tile className="bn-footer-tile">
          <div className="bn-footer-grid">
            <div>
              <p className="bn-eyebrow">
                <span
                  data-edit="copy.contactHeading"
                  data-edit-type="text"
                >
                  {data.copy?.contactHeading ?? 'Get in touch'}
                </span>
              </p>
              <div className="bn-contact-info">
                <a href={`tel:${contact.phone}`} className="bn-contact-link">
                  <DynamicIcon
                    name={data.icons?.phone ?? 'Phone'}
                    size={16}
                    aria-hidden="true"
                    data-edit="icons.phone"
                    data-edit-type="icon"
                  />
                  <span data-edit="contact.phone" data-edit-type="text">
                    {contact.phone}
                  </span>
                </a>
                <a href={`mailto:${contact.email}`} className="bn-contact-link">
                  <DynamicIcon
                    name={data.icons?.email ?? 'Mail'}
                    size={16}
                    aria-hidden="true"
                    data-edit="icons.email"
                    data-edit-type="icon"
                  />
                  <span data-edit="contact.email" data-edit-type="text">
                    {contact.email}
                  </span>
                </a>
                <span className="bn-contact-link">
                  <DynamicIcon
                    name={data.icons?.address ?? 'MapPin'}
                    size={16}
                    aria-hidden="true"
                    data-edit="icons.address"
                    data-edit-type="icon"
                  />
                  <span data-edit="contact.address" data-edit-type="text">
                    {contact.address}
                  </span>
                </span>
              </div>
              <div className="bn-socials">
                {contact.whatsapp && (
                  <a
                    href={`https://wa.me/${contact.whatsapp}`}
                    className="bn-social"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="whatsapp"
                  >
                    <SocialIcon platform="whatsapp" size={18} />
                  </a>
                )}
                {socials.map(([name, url]) => (
                  <a
                    key={name}
                    href={url}
                    className="bn-social"
                    target="_blank"
                    rel="noreferrer"
                    aria-label={name}
                  >
                    <SocialIcon platform={name} size={18} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p className="bn-eyebrow">
                <span
                  data-edit="copy.hoursLabel"
                  data-edit-type="text"
                >
                  {data.copy?.hoursLabel ?? 'Opening hours'}
                </span>
              </p>
              <table className="bn-hours">
                <tbody>
                  {hours.map((h) => (
                    <tr key={h.day} className={h.closed ? 'is-closed' : ''}>
                      <td>{h.day}</td>
                      <td>
                        {h.closed ? 'Closed' : `${h.open} – ${h.close}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bn-footer-bottom">
            <span>
              © {new Date().getFullYear()}{' '}
              <span data-edit="business.name" data-edit-type="text">
                {data.business.name}
              </span>
            </span>
            <span data-edit="copy.footerCredit" data-edit-type="text">
              {data.copy?.footerCredit ?? 'Built with Mumotor'}
            </span>
          </div>
        </Tile>
      </div>
    </footer>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function Bento({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts([
    'https://fonts.googleapis.com/css2?family=Figtree:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap',
  ]);

  const ids = Object.values(SECTION_IDS);
  const active = useScrollSpy(ids);

  return (
    <div
      className="tmpl-bento"
      dir={data.dir}
      style={data.theme as CSSProperties}
      data-edit="theme.bg"
      data-edit-type="background"
    >
      <BnNav data={data} active={active} />
      <main>
        <BnHero data={data} />
        <BnStats stats={data.stats} />
        <BnWhy data={data} />
        <BnPackages data={data} />
        <BnAbout data={data} />
        <BnAreas data={data} />
        {data.reviews.length > 0 && <BnReviews data={data} />}
        {data.gallery.length > 0 && <BnGallery data={data} />}
        <BnFaq data={data} />
        <BnBook data={data} />
        <BnContact data={data} />
      </main>
    </div>
  );
}

/**
 * Obsidian — Smoked dark luxury glass.
 * Near-black graphite base; translucent dark smoked glass panels; 3D CSS perspective
 * grid floor that recedes toward the hero horizon; mouse-tilt depth on cards;
 * scroll-parallax orbs; slow specular sweep highlight on glass surfaces.
 * Manrope headings · Inter body.
 * Palette via CSS vars on `.tmpl-obsidian`:
 *   --ob-bg / --ob-ink / --ob-accent / --ob-accent2 / --ob-panel
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
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, useCountUp, useMouseTilt, useScrollParallax, usePrefersReducedMotion,
} from '../shared';
import './obsidian.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

// ── Glass primitive ─────────────────────────────────────────────────────────────

/** Smoked dark glass panel with pointer-follow specular spot and optional 3D tilt. */
function Glass({
  children, className, tilt = false, style,
}: { children: ReactNode; className?: string; tilt?: boolean; style?: CSSProperties }) {
  const reduced = usePrefersReducedMotion();
  const { ref, rotateX, rotateY, onMouseMove, onMouseLeave } = useMouseTilt(5);
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
      className={cx('ob-glass', className)}
      style={tilt && !reduced ? { rotateX, rotateY, transformPerspective: 900, ...style } : style}
    >
      <div ref={spotRef} className="ob-glass-spot" aria-hidden="true" />
      <div className="ob-glass-inner">{children}</div>
    </motion.div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="ob-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={15}
          fill={i < n ? 'var(--ob-accent)' : 'none'}
          color={i < n ? 'var(--ob-accent)' : 'var(--ob-muted)'}
        />
      ))}
    </span>
  );
}

// ── Animated background ────────────────────────────────────────────────────────

function ObsidianBg() {
  const { ref, y } = useScrollParallax(100);
  return (
    <div ref={ref} className="ob-bg" aria-hidden="true">
      <motion.div className="ob-orb ob-orb-1" style={{ y }} />
      <motion.div className="ob-orb ob-orb-2" style={{ y }} />
      <div className="ob-noise" />
    </div>
  );
}

// ── 3D perspective grid floor ──────────────────────────────────────────────────

function GridFloor() {
  return (
    <div className="ob-grid-wrap" aria-hidden="true">
      <div className="ob-grid-floor" />
      <div className="ob-grid-vignette" />
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { id: SECTION_IDS.packages, label: 'Packages' },
  { id: SECTION_IDS.about,    label: 'About'    },
  { id: SECTION_IDS.areas,    label: 'Areas'    },
  { id: SECTION_IDS.reviews,  label: 'Reviews'  },
  { id: SECTION_IDS.faq,      label: 'FAQ'      },
];

function ObNav({ data, active }: { data: TemplateData; active: string }) {
  const [open, setOpen] = useState(false);
  const links = NAV_LINKS.filter(
    ({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0
  );
  const bookLabel = data.labels?.bookCta ?? 'Book now';

  return (
    <nav className="ob-nav" aria-label="Main navigation">
      <div className="ob-nav-glass">
        <button
          className="ob-logo"
          onClick={() => scrollToSection(SECTION_IDS.hero)}
          aria-label="Go to top"
        >
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark
              letter={data.business.logoText}
              src={data.business.logoSrc}
              size={30}
              bg="#14181D"
              fg="#9FB6CC"
              radius={9}
            />
          </span>
          <span data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>

        <div className="ob-nav-links">
          {links.map(({ id, label }) => (
            <button
              key={id}
              className={cx('ob-nav-link', active === id && 'is-active')}
              onClick={() => scrollToSection(id)}
              data-edit={`copy.nav_${id}`}
              data-edit-type="text"
            >
              {data.copy?.[`nav_${id}`] ?? label}
            </button>
          ))}
        </div>

        <div className="ob-nav-end">
          <button
            className="ob-btn ob-btn-primary ob-btn-sm"
            data-edit="labels.bookCta"
            data-edit-type="text"
            onClick={() => scrollToSection(SECTION_IDS.book)}
          >
            {bookLabel}
          </button>
          <button
            className="ob-menu"
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
            className="ob-nav-mobile"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {links.map(({ id, label }) => (
              <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function ObHero({ data }: { data: TemplateData }) {
  const { hero } = data;
  return (
    <section id={SECTION_IDS.hero} className="ob-hero">
      <GridFloor />
      <div className="ob-container ob-hero-grid">
        <div className="ob-hero-copy">
          <Reveal as="div" className="ob-pill" delay={0.05}>
            <span className="ob-dot" />
            <span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span>
          </Reveal>

          <h1 className="ob-h1" data-edit="hero.headline" data-edit-type="text">
            {hero.headline}
          </h1>

          <Reveal as="p" className="ob-hero-sub" delay={0.15}>
            <span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span>
          </Reveal>

          <Reveal className="ob-hero-ctas" delay={0.25}>
            <button
              className="ob-btn ob-btn-primary ob-btn-lg"
              data-edit="hero.ctaPrimary"
              data-edit-type="text"
              onClick={() => scrollToSection(SECTION_IDS.book)}
            >
              {hero.ctaPrimary} <ArrowRight size={17} aria-hidden="true" />
            </button>
            <button
              className="ob-btn ob-btn-ghost ob-btn-lg"
              data-edit="hero.ctaSecondary"
              data-edit-type="text"
              onClick={() => scrollToSection(SECTION_IDS.packages)}
            >
              {hero.ctaSecondary}
            </button>
          </Reveal>

          <Reveal className="ob-trust-row" delay={0.34}>
            {data.instructor.credentials.slice(0, 3).map((c, i) => (
              <span key={i} className="ob-trust-chip" data-edit-item={`instructor.credentials.${i}`}>
                <Check size={13} aria-hidden="true" />
                <span data-edit={`instructor.credentials.${i}`} data-edit-type="text">{c}</span>
              </span>
            ))}
          </Reveal>
        </div>

        <Reveal className="ob-hero-media" delay={0.1} y={30}>
          <Glass tilt className="ob-hero-card">
            <img
              src={hero.image}
              alt="Driving lesson in progress"
              className="ob-hero-img"
              data-edit="hero.image"
              data-edit-type="image"
            />
            <Glass className="ob-hero-badge">
              <p className="ob-hero-badge-num" data-edit="stats.0.value" data-edit-type="text">
                {data.stats[0]?.prefix}{data.stats[0]?.value}{data.stats[0]?.suffix}
              </p>
              <p
                className="ob-hero-badge-label"
                data-edit="stats.0.label"
                data-edit-type="text"
              >
                {data.stats[0]?.label}
              </p>
            </Glass>
          </Glass>
        </Reveal>
      </div>
    </section>
  );
}

// ── Stats ──────────────────────────────────────────────────────────────────────

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value)
    ? Math.round(n).toLocaleString()
    : n.toFixed(1);

  return (
    <div ref={ref} data-edit-item={`stats.${index}`}>
      <Glass tilt className="ob-stat">
        <span
          className="ob-stat-num"
          data-edit={`stats.${index}.value`}
          data-edit-type="text"
        >
          {stat.prefix}{formatted}{stat.suffix}
        </span>
        <span
          className="ob-stat-label"
          data-edit={`stats.${index}.label`}
          data-edit-type="text"
        >
          {stat.label}
        </span>
      </Glass>
    </div>
  );
}

function ObStats({ stats }: { stats: TemplateData['stats'] }) {
  return (
    <section id={SECTION_IDS.stats} className="ob-section ob-stats-section">
      <div className="ob-container ob-stats-grid">
        {stats.map((s, i) => <StatItem key={i} stat={s} index={i} />)}
      </div>
    </section>
  );
}

// ── Why / Features ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: 'HeartHandshake',
    titleKey: 'feature0Title', bodyKey: 'feature0Body',
    title: 'Calm, one-to-one lessons',
    body:  'Never doubled-up. Patient, steady guidance paced exactly to you.',
  },
  {
    icon: 'ShieldCheck',
    titleKey: 'feature1Title', bodyKey: 'feature1Body',
    title: 'Dual-control, fully insured',
    body:  'A modern dual-control car that quietly does the worrying for you.',
  },
  {
    icon: 'MapPin',
    titleKey: 'feature2Title', bodyKey: 'feature2Body',
    title: 'Door-to-door pickup',
    body:  'Picked up from home, work or college — at no extra cost.',
  },
];

function ObWhy({ data }: { data: TemplateData }) {
  return (
    <section className="ob-section">
      <div className="ob-container">
        <Reveal>
          <p className="ob-eyebrow">
            <span data-edit="copy.whyEyebrow" data-edit-type="text">
              {data.copy?.whyEyebrow ?? 'Why learners choose us'}
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="ob-h2" data-edit="copy.whyHeading" data-edit-type="text">
            {data.copy?.whyHeading ?? 'Everything feels calmer here.'}
          </h2>
        </Reveal>
        <div className="ob-why-grid">
          {FEATURES.map((f, i) => (
            <Reveal key={i} delay={0.08 * i}>
              <Glass tilt className="ob-why-card">
                <span className="ob-why-icon">
                  <DynamicIcon
                    name={data.icons?.[`feature${i}`] ?? f.icon}
                    size={22}
                    aria-hidden="true"
                    data-edit={`icons.feature${i}`}
                    data-edit-type="icon"
                  />
                </span>
                <h3
                  className="ob-why-title"
                  data-edit={`copy.${f.titleKey}`}
                  data-edit-type="text"
                >
                  {data.copy?.[f.titleKey] ?? f.title}
                </h3>
                <p
                  className="ob-why-body"
                  data-edit={`copy.${f.bodyKey}`}
                  data-edit-type="text"
                >
                  {data.copy?.[f.bodyKey] ?? f.body}
                </p>
              </Glass>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages ──────────────────────────────────────────────────────────────────

function ObPackages({ data }: { data: TemplateData }) {
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="ob-section">
      <div className="ob-container">
        <Reveal>
          <p className="ob-eyebrow">
            <span data-edit="copy.packagesEyebrow" data-edit-type="text">
              {data.copy?.packagesEyebrow ?? 'Packages'}
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="ob-h2" data-edit="copy.packagesHeading" data-edit-type="text">
            {data.copy?.packagesHeading ?? 'Pick a plan that fits.'}
          </h2>
        </Reveal>
        <Reveal as="p" className="ob-section-sub" delay={0.1}>
          <span data-edit="copy.packagesSub" data-edit-type="text">
            {data.copy?.packagesSub ?? 'Transparent pricing, no hidden fees, change your mind any time.'}
          </span>
        </Reveal>
        <div className="ob-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.08}>
              <Glass
                tilt
                className={cx('ob-pkg', pkg.popular && 'is-popular')}
                style={{ height: '100%' }}
              >
                <div data-edit-item={`packages.${i}`}>
                  {pkg.popular && (
                    <span className="ob-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge ?? 'Most popular'}</span>
                  )}
                  <p
                    className="ob-pkg-name"
                    data-edit={`packages.${i}.name`}
                    data-edit-type="text"
                  >
                    {pkg.name}
                  </p>
                  <p className="ob-pkg-price">
                    <span
                      className="ob-pkg-amount"
                      data-edit={`packages.${i}.price`}
                      data-edit-type="text"
                    >
                      £{pkg.price}
                    </span>
                    {pkg.unit && <span className="ob-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                  </p>
                  <ul className="ob-pkg-features">
                    {pkg.features.map((f, fi) => (
                      <li key={fi}>
                        <Check size={15} className="ob-check" aria-hidden="true" />
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
                      'ob-btn',
                      pkg.popular ? 'ob-btn-primary' : 'ob-btn-ghost',
                      'ob-btn-block'
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
              </Glass>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── About ──────────────────────────────────────────────────────────────────────

function ObAbout({ data }: { data: TemplateData }) {
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="ob-section">
      <div className="ob-container ob-about-grid">
        <Reveal className="ob-about-media" y={30}>
          <Glass tilt className="ob-about-card">
            <img
              src={about.image}
              alt="Instructor with a learner driver"
              className="ob-about-img"
              data-edit="about.image"
              data-edit-type="image"
            />
          </Glass>
          <Glass className="ob-instructor">
            <img
              src={instructor.photo}
              alt={instructor.name}
              className="ob-instructor-photo"
              data-edit="instructor.photo"
              data-edit-type="image"
            />
            <div>
              <p
                className="ob-instructor-name"
                data-edit="instructor.name"
                data-edit-type="text"
              >
                {instructor.name}
              </p>
              <p className="ob-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
            </div>
          </Glass>
        </Reveal>

        <div className="ob-about-copy">
          <Reveal>
            <p className="ob-eyebrow">
              <span data-edit="copy.aboutEyebrow" data-edit-type="text">
                {data.copy?.aboutEyebrow ?? 'About'}
              </span>
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="ob-h2" data-edit="about.heading" data-edit-type="text">
              {about.heading}
            </h2>
          </Reveal>
          {about.body.map((p, i) => (
            <Reveal key={i} as="p" className="ob-body" delay={0.1 + i * 0.06}>
              <span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span>
            </Reveal>
          ))}
          <Reveal delay={0.22}>
            <ul className="ob-checklist">
              {about.checklist.map((item, i) => (
                <li key={i} data-edit-item={`about.checklist.${i}`}>
                  <Check size={16} aria-hidden="true" />
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Areas ──────────────────────────────────────────────────────────────────────

function ObAreas({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.areas} className="ob-section">
      <div className="ob-container">
        <Reveal>
          <p className="ob-eyebrow">
            <span data-edit="copy.areasEyebrow" data-edit-type="text">
              {data.copy?.areasEyebrow ?? 'Areas covered'}
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="ob-h2" data-edit="copy.areasHeading" data-edit-type="text">
            {data.copy?.areasHeading ?? 'We come to you.'}
          </h2>
        </Reveal>
        <div className="ob-areas-grid">
          {data.areas.map((area, i) => (
            <Reveal key={i} delay={(i % 4) * 0.05}>
              <div data-edit-item={`areas.${i}`}>
                <Glass tilt className="ob-area">
                  <MapPin size={15} aria-hidden="true" />
                  <span
                    className="ob-area-name"
                    data-edit={`areas.${i}.name`}
                    data-edit-type="text"
                  >
                    {area.name}
                  </span>
                  {area.note && <span className="ob-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
                </Glass>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Reviews ────────────────────────────────────────────────────────────────────

function ObReviews({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.reviews} className="ob-section">
      <div className="ob-container">
        <Reveal>
          <p className="ob-eyebrow">
            <span data-edit="copy.reviewsEyebrow" data-edit-type="text">
              {data.copy?.reviewsEyebrow ?? 'Reviews'}
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="ob-h2" data-edit="copy.reviewsHeading" data-edit-type="text">
            {data.copy?.reviewsHeading ?? 'Loved by learners.'}
          </h2>
        </Reveal>
        <div className="ob-reviews-grid">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.08}>
              <div data-edit-item={`reviews.${i}`}>
                <Glass tilt className="ob-review">
                  <Stars n={r.rating} />
                  <blockquote className="ob-review-text">"<span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span>"</blockquote>
                  <div className="ob-review-meta">
                    {r.avatar && (
                      <img src={r.avatar} alt={r.name} className="ob-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />
                    )}
                    <div>
                      <p className="ob-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                      {r.meta && <p className="ob-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
                    </div>
                  </div>
                </Glass>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery ────────────────────────────────────────────────────────────────────

function ObGallery({ data }: { data: TemplateData }) {
  return (
    <section className="ob-section">
      <div className="ob-container">
        <Reveal>
          <p className="ob-eyebrow">
            <span data-edit="copy.galleryEyebrow" data-edit-type="text">
              {data.copy?.galleryEyebrow ?? 'Gallery'}
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="ob-h2" data-edit="copy.galleryHeading" data-edit-type="text">
            {data.copy?.galleryHeading ?? 'From the driving seat.'}
          </h2>
        </Reveal>
        <div className="ob-gallery-grid">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06}>
              <div data-edit-item={`gallery.${i}`}>
                <Glass className="ob-gallery-cell">
                  <img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
                </Glass>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ────────────────────────────────────────────────────────────────────────

function FaqItem({ faq, index }: { faq: TemplateData['faqs'][number]; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div data-edit-item={`faqs.${index}`}>
      <Glass className="ob-faq-item">
        <button
          className="ob-faq-q"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span data-edit={`faqs.${index}.q`} data-edit-type="text">{faq.q}</span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="ob-faq-chev"
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
                className="ob-faq-a"
                data-edit={`faqs.${index}.a`}
                data-edit-type="text"
              >
                {faq.a}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </Glass>
    </div>
  );
}

function ObFaq({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.faq} className="ob-section">
      <div className="ob-container ob-faq-wrap">
        <Reveal>
          <p className="ob-eyebrow">
            <span data-edit="copy.faqEyebrow" data-edit-type="text">
              {data.copy?.faqEyebrow ?? 'FAQ'}
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="ob-h2" data-edit="copy.faqHeading" data-edit-type="text">
            {data.copy?.faqHeading ?? 'Common questions.'}
          </h2>
        </Reveal>
        <div className="ob-faq-list">
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

// ── Booking CTA ────────────────────────────────────────────────────────────────

function ObBook({ data }: { data: TemplateData }) {
  const bookLabel = data.labels?.bookCta ?? 'Book a lesson';
  return (
    <section id={SECTION_IDS.book} className="ob-section ob-book">
      <div className="ob-container">
        <Reveal>
          <Glass className="ob-book-card">
            <h2
              className="ob-h2 ob-book-h"
              data-edit="copy.bookHeading"
              data-edit-type="text"
            >
              {data.copy?.bookHeading ?? 'Ready when you are.'}
            </h2>
            <p
              className="ob-body ob-book-body"
              data-edit="copy.bookBody"
              data-edit-type="text"
            >
              {data.copy?.bookBody ?? "Pick a time that works for you and we'll take it from there."}
            </p>
            <div className="ob-book-ctas">
              {data.bookingUrl ? (
                <a
                  href={data.bookingUrl}
                  className="ob-btn ob-btn-primary ob-btn-lg"
                  data-edit="labels.bookCta"
                  data-edit-type="text"
                >
                  {bookLabel} <ArrowRight size={17} aria-hidden="true" />
                </a>
              ) : (
                <button
                  type="button"
                  className="ob-btn ob-btn-primary ob-btn-lg"
                  title="Available once your site is published"
                  data-edit="labels.bookCta"
                  data-edit-type="text"
                >
                  {bookLabel} <ArrowRight size={17} aria-hidden="true" />
                </button>
              )}
              {data.enrollUrl && (
                <a href={data.enrollUrl} className="ob-btn ob-btn-ghost ob-btn-lg">
                  <span data-edit="copy.enrollCta" data-edit-type="text">
                    {data.copy?.enrollCta ?? 'Enroll'}
                  </span>
                </a>
              )}
            </div>
          </Glass>
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer ───────────────────────────────────────────────────────────

function ObContact({ data }: { data: TemplateData }) {
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="ob-footer">
      <div className="ob-container">
        <Glass className="ob-footer-card">
          <div className="ob-footer-grid">
            <div>
              <p className="ob-eyebrow">
                <span data-edit="copy.contactHeading" data-edit-type="text">
                  {data.copy?.contactHeading ?? 'Get in touch'}
                </span>
              </p>
              <div className="ob-contact-info">
                <a href={`tel:${contact.phone}`} className="ob-contact-link">
                  <DynamicIcon
                    name={data.icons?.phone ?? 'Phone'}
                    size={16}
                    aria-hidden="true"
                    data-edit="icons.phone"
                    data-edit-type="icon"
                  />
                  <span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span>
                </a>
                <a href={`mailto:${contact.email}`} className="ob-contact-link">
                  <DynamicIcon
                    name={data.icons?.email ?? 'Mail'}
                    size={16}
                    aria-hidden="true"
                    data-edit="icons.email"
                    data-edit-type="icon"
                  />
                  <span data-edit="contact.email" data-edit-type="text">{contact.email}</span>
                </a>
                <span className="ob-contact-link">
                  <DynamicIcon
                    name={data.icons?.address ?? 'MapPin'}
                    size={16}
                    aria-hidden="true"
                    data-edit="icons.address"
                    data-edit-type="icon"
                  />
                  <span data-edit="contact.address" data-edit-type="text">{contact.address}</span>
                </span>
              </div>
              <div className="ob-socials">
                {socials.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    className="ob-social"
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.platform}
                    data-edit-item={`contact.socials.${i}`}
                  >
                    <SocialIcon platform={s.platform} size={18} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p className="ob-eyebrow">
                <span data-edit="copy.hoursLabel" data-edit-type="text">
                  {data.copy?.hoursLabel ?? 'Opening hours'}
                </span>
              </p>
              <table className="ob-hours">
                <tbody>
                  {hours.map((h) => (
                    <tr key={h.day} className={h.closed ? 'is-closed' : ''}>
                      <td>{h.day}</td>
                      <td>{h.closed ? 'Closed' : `${h.open} – ${h.close}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="ob-footer-bottom">
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
        </Glass>
      </div>
    </footer>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function Obsidian({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts([
    'https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap',
  ]);
  const ids = Object.values(SECTION_IDS);
  const active = useScrollSpy(ids);

  return (
    <div
      className="tmpl-obsidian"
      dir={data.dir}
      style={data.theme as CSSProperties}
      data-edit="theme.bg"
      data-edit-type="background"
    >
      <ObsidianBg />
      <div className="ob-content">
        <ObNav data={data} active={active} />
        <main>
          <ObHero data={data} />
          <ObStats stats={data.stats} />
          <ObWhy data={data} />
          <ObPackages data={data} />
          <ObAbout data={data} />
          <ObAreas data={data} />
          {data.reviews.length > 0 && <ObReviews data={data} />}
          {data.gallery.length > 0 && <ObGallery data={data} />}
          <ObFaq data={data} />
          <ObBook data={data} />
          <ObContact data={data} />
        </main>
      </div>
    </div>
  );
}

/**
 * Flow — Stripe / Linear developer-premium dark template.
 * Editorial hero on SHADER_MESH WebGL gradient · alternating solid-dark panels
 * with 1px hairline borders · slim scroll-progress rail · sticky glass-pill nav.
 * Calm, precise, restrained motion. Outfit 800/700/600 · Inter body.
 * Palette CSS vars: --fl-bg · --fl-ink · --fl-c1 (indigo) · --fl-c2 (violet) · --fl-c3 (cyan).
 */
import { useRef, useState, type CSSProperties } from 'react';
import {
  motion, AnimatePresence, useInView, useScroll, useSpring,
} from 'framer-motion';
import { ChevronDown, Check, Star, Menu, X, ArrowRight } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { ShaderBackground } from '../webgl/ShaderBackground';
import { SHADER_MESH } from '../webgl/shaders';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, useCountUp, useMouseTilt, useScrollParallax, usePrefersReducedMotion,
} from '../shared';
import './flow.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');
const FL_VARS = ['--fl-bg', '--fl-c1', '--fl-c2', '--fl-c3'];

// ── Scroll progress rail ──────────────────────────────────────────────────────

function ScrollBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return <motion.div className="fl-progress-bar" style={{ scaleX }} aria-hidden="true" />;
}

// ── Glass primitive ───────────────────────────────────────────────────────────
// light=false → dark/translucent (on dark panels, white ink)
// light=true  → near-white (packages, FAQ — dense text, dark ink)

function Glass({
  children, className, tilt = false, light = false, style,
}: {
  children: React.ReactNode;
  className?: string;
  tilt?: boolean;
  light?: boolean;
  style?: CSSProperties;
}) {
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
      className={cx('fl-glass', light && 'fl-glass-light', className)}
      style={tilt && !reduced ? { rotateX, rotateY, transformPerspective: 900, ...style } : style}
    >
      <div ref={spotRef} className="fl-glass-spot" aria-hidden="true" />
      <div className="fl-glass-inner">{children}</div>
    </motion.div>
  );
}

// ── Stars ─────────────────────────────────────────────────────────────────────

function Stars({ n }: { n: number }) {
  return (
    <span className="fl-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={15}
          fill={i < n ? 'var(--fl-c3)' : 'none'}
          color={i < n ? 'var(--fl-c3)' : 'rgba(243,241,255,0.28)'}
        />
      ))}
    </span>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { id: SECTION_IDS.packages, label: 'Packages' },
  { id: SECTION_IDS.about, label: 'About' },
  { id: SECTION_IDS.areas, label: 'Areas' },
  { id: SECTION_IDS.reviews, label: 'Reviews' },
  { id: SECTION_IDS.faq, label: 'FAQ' },
];

function FlNav({ data, active }: { data: TemplateData; active: string }) {
  const [open, setOpen] = useState(false);
  const links = NAV_LINKS.filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? 'Book now';
  return (
    <nav className="fl-nav" aria-label="Main navigation">
      <div className="fl-nav-glass">
        <button className="fl-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label="Go to top">
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={30} bg="#6366F1" fg="#F3F1FF" radius={9} />
          </span>
          <span data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <div className="fl-nav-links">
          {links.map(({ id, label }) => (
            <button
              key={id}
              className={cx('fl-nav-link', active === id && 'is-active')}
              onClick={() => scrollToSection(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="fl-nav-end">
          <button
            className="fl-btn fl-btn-primary fl-btn-sm"
            data-edit="labels.bookCta"
            data-edit-type="text"
            onClick={() => scrollToSection(SECTION_IDS.book)}
          >
            {bookLabel}
          </button>
          <button
            className="fl-menu"
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
            className="fl-nav-mobile"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {links.map(({ id, label }) => (
              <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{label}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ── Hero — editorial, left-aligned, shader behind ────────────────────────────

function FlHero({ data }: { data: TemplateData }) {
  const { hero } = data;
  return (
    <section id={SECTION_IDS.hero} className="fl-hero">
      {/* SHADER_MESH WebGL living gradient backdrop */}
      <ShaderBackground
        frag={SHADER_MESH}
        colorVars={FL_VARS}
        paletteKey={JSON.stringify(data.theme ?? {})}
        className="fl-shader"
      />
      {/* Gradient overlay — darkens left for text legibility */}
      <div className="fl-hero-overlay" aria-hidden="true" />
      <div className="fl-container">
        <div className="fl-hero-copy">
          <Reveal as="div" className="fl-pill" delay={0.04}>
            <span className="fl-dot" />
            <span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span>
          </Reveal>
          <h1 className="fl-h1" data-edit="hero.headline" data-edit-type="text">
            {hero.headline}
          </h1>
          <Reveal as="p" className="fl-hero-sub" delay={0.14}>
            <span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span>
          </Reveal>
          <Reveal className="fl-hero-ctas" delay={0.22}>
            <button
              className="fl-btn fl-btn-primary fl-btn-lg"
              data-edit="hero.ctaPrimary"
              data-edit-type="text"
              onClick={() => scrollToSection(SECTION_IDS.book)}
            >
              {hero.ctaPrimary} <ArrowRight size={17} aria-hidden="true" />
            </button>
            <button
              className="fl-btn fl-btn-glass fl-btn-lg"
              data-edit="hero.ctaSecondary"
              data-edit-type="text"
              onClick={() => scrollToSection(SECTION_IDS.packages)}
            >
              {hero.ctaSecondary}
            </button>
          </Reveal>
          {/* Trust signals: instructor credentials as small contained pills */}
          <Reveal className="fl-trust-row" delay={0.32}>
            {data.instructor.credentials.slice(0, 4).map((c, i) => (
              <span key={i} className="fl-trust-chip">
                <Check size={13} aria-hidden="true" />{c}
              </span>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Product moment — framed hero image, below the fold ───────────────────────

function FlProduct({ data }: { data: TemplateData }) {
  const reduced = usePrefersReducedMotion();
  const { ref, rotateX, rotateY, onMouseMove, onMouseLeave } = useMouseTilt(3);
  return (
    <section className="fl-product">
      <div className="fl-container">
        <Reveal y={48}>
          <motion.div
            ref={ref}
            className="fl-product-frame"
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={reduced ? undefined : { rotateX, rotateY, transformPerspective: 1600 }}
          >
            <img
              src={data.hero.image}
              alt="Driving lesson in progress"
              className="fl-product-img"
              data-edit="hero.image"
              data-edit-type="image"
            />
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Stats — flat hairline-divided bar (Stripe spec-row style) ────────────────

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value) ? Math.round(n).toLocaleString() : n.toFixed(1);
  return (
    <div ref={ref} className="fl-stat" data-edit-item={`stats.${index}`}>
      <span className="fl-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">
        {stat.prefix}{formatted}{stat.suffix}
      </span>
      <span className="fl-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">
        {stat.label}
      </span>
    </div>
  );
}

function FlStats({ stats }: { stats: TemplateData['stats'] }) {
  return (
    <section id={SECTION_IDS.stats} className="fl-stats-section">
      <div className="fl-container">
        <div className="fl-stats-row">
          {stats.map((s, i) => <StatItem key={i} stat={s} index={i} />)}
        </div>
      </div>
    </section>
  );
}

// ── Why — developer-grade feature cards (border + subtle bg, no heavy blur) ──

const FEATURES = [
  { icon: 'HeartHandshake', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: 'Calm, one-to-one lessons', body: 'Never doubled-up. Patient, steady guidance paced exactly to you.' },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: 'Dual-control, fully insured', body: 'A modern dual-control car that quietly does the worrying for you.' },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: 'Door-to-door pickup', body: 'Picked up from home, work or college — at no extra cost.' },
];

function FlWhy({ data }: { data: TemplateData }) {
  return (
    <section className="fl-section fl-why-section">
      <div className="fl-container">
        <Reveal>
          <p className="fl-eyebrow">
            <span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? 'Why learners choose us'}</span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="fl-h2" data-edit="copy.whyHeading" data-edit-type="text">
            {data.copy?.whyHeading ?? 'Everything feels calmer here.'}
          </h2>
        </Reveal>
        <div className="fl-why-grid">
          {FEATURES.map((f, i) => (
            <Reveal key={i} delay={0.07 * i}>
              <div className="fl-why-card">
                <span className="fl-why-icon">
                  <DynamicIcon
                    name={data.icons?.[`feature${i}`] ?? f.icon}
                    size={22}
                    aria-hidden="true"
                    data-edit={`icons.feature${i}`}
                    data-edit-type="icon"
                  />
                </span>
                <h3 className="fl-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">
                  {data.copy?.[f.titleKey] ?? f.title}
                </h3>
                <p className="fl-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">
                  {data.copy?.[f.bodyKey] ?? f.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages — light-glass cards for legibility ───────────────────────────────

function FlPackages({ data }: { data: TemplateData }) {
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="fl-section fl-packages-section">
      <div className="fl-container">
        <Reveal>
          <p className="fl-eyebrow">
            <span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? 'Packages'}</span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="fl-h2" data-edit="copy.packagesHeading" data-edit-type="text">
            {data.copy?.packagesHeading ?? 'Pick a plan that fits.'}
          </h2>
        </Reveal>
        <Reveal as="p" className="fl-section-sub" delay={0.1}>
          <span data-edit="copy.packagesSub" data-edit-type="text">
            {data.copy?.packagesSub ?? 'Transparent pricing, no hidden fees, change your mind any time.'}
          </span>
        </Reveal>
        <div className="fl-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.08}>
              <Glass light tilt className={cx('fl-pkg', pkg.popular && 'is-popular')} style={{ height: '100%' }}>
                <div data-edit-item={`packages.${i}`}>
                  {pkg.popular && <span className="fl-pkg-badge">{pkg.badge ?? 'Most popular'}</span>}
                  <p className="fl-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                  <p className="fl-pkg-price">
                    <span className="fl-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">£{pkg.price}</span>
                    {pkg.unit && <span className="fl-pkg-unit">{pkg.unit}</span>}
                  </p>
                  <ul className="fl-pkg-features">
                    {pkg.features.map((f, fi) => (
                      <li key={fi}>
                        <Check size={15} className="fl-check" aria-hidden="true" />
                        <span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={cx('fl-btn', pkg.popular ? 'fl-btn-primary' : 'fl-btn-outline', 'fl-btn-block')}
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

// ── About ─────────────────────────────────────────────────────────────────────

function FlAbout({ data }: { data: TemplateData }) {
  const { about, instructor } = data;
  const { ref: aboutRef, y: mediaY } = useScrollParallax(20);
  return (
    <section id={SECTION_IDS.about} className="fl-section fl-about-section">
      <div className="fl-container fl-about-grid">
        {/* Media col — subtle scroll-parallax depth */}
        <div ref={aboutRef} className="fl-about-media">
          <motion.div style={{ y: mediaY }}>
            <Glass tilt className="fl-about-card">
              <img
                src={about.image}
                alt="Instructor with a learner driver"
                className="fl-about-img"
                data-edit="about.image"
                data-edit-type="image"
              />
            </Glass>
          </motion.div>
          <Glass className="fl-instructor">
            <img
              src={instructor.photo}
              alt={instructor.name}
              className="fl-instructor-photo"
              data-edit="instructor.photo"
              data-edit-type="image"
            />
            <div>
              <p className="fl-instructor-name" data-edit="instructor.name" data-edit-type="text">
                {instructor.name}
              </p>
              <p className="fl-instructor-title">{instructor.title}</p>
            </div>
          </Glass>
        </div>
        {/* Copy col */}
        <div className="fl-about-copy">
          <Reveal>
            <p className="fl-eyebrow">
              <span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? 'About'}</span>
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="fl-h2" data-edit="about.heading" data-edit-type="text">{about.heading}</h2>
          </Reveal>
          {about.body.map((p, i) => (
            <Reveal key={i} as="p" className="fl-body" delay={0.1 + i * 0.06}>
              {i === 0 ? <span data-edit="about.body.0" data-edit-type="text">{p}</span> : p}
            </Reveal>
          ))}
          <Reveal delay={0.22}>
            <ul className="fl-checklist">
              {about.checklist.map((item, i) => (
                <li key={i}><Check size={16} aria-hidden="true" /><span>{item}</span></li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Areas — inline pill tags ─────────────────────────────────────────────────

function FlAreas({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.areas} className="fl-section fl-areas-section">
      <div className="fl-container">
        <Reveal>
          <p className="fl-eyebrow">
            <span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? 'Areas covered'}</span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="fl-h2" data-edit="copy.areasHeading" data-edit-type="text">
            {data.copy?.areasHeading ?? 'We come to you.'}
          </h2>
        </Reveal>
        <div className="fl-areas-tags">
          {data.areas.map((area, i) => (
            <Reveal key={i} delay={(i % 5) * 0.04} as="span" className="fl-area-tag" data-edit-item={`areas.${i}`}>
              <span className="fl-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              {area.note && <span className="fl-area-note">{area.note}</span>}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Reviews — dark glass cards ────────────────────────────────────────────────

function FlReviews({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.reviews} className="fl-section fl-reviews-section">
      <div className="fl-container">
        <Reveal>
          <p className="fl-eyebrow">
            <span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? 'Reviews'}</span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="fl-h2" data-edit="copy.reviewsHeading" data-edit-type="text">
            {data.copy?.reviewsHeading ?? 'Loved by learners.'}
          </h2>
        </Reveal>
        <div className="fl-reviews-grid">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.08}>
              <Glass tilt className="fl-review">
                <Stars n={r.rating} />
                <blockquote className="fl-review-text">"{r.text}"</blockquote>
                <div className="fl-review-meta">
                  {r.avatar && <img src={r.avatar} alt={r.name} className="fl-avatar" />}
                  <div>
                    <p className="fl-review-name">{r.name}</p>
                    {r.meta && <p className="fl-review-sub">{r.meta}</p>}
                  </div>
                </div>
              </Glass>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery ───────────────────────────────────────────────────────────────────

function FlGallery({ data }: { data: TemplateData }) {
  return (
    <section className="fl-section fl-gallery-section">
      <div className="fl-container">
        <Reveal>
          <p className="fl-eyebrow">
            <span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? 'Gallery'}</span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="fl-h2" data-edit="copy.galleryHeading" data-edit-type="text">
            {data.copy?.galleryHeading ?? 'From the driving seat.'}
          </h2>
        </Reveal>
        <div className="fl-gallery-grid">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06} className="fl-gallery-cell">
              <img src={src} alt="" loading="lazy" className="fl-gallery-img" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ — light-glass accordion ───────────────────────────────────────────────

function FaqItem({ faq, index }: { faq: TemplateData['faqs'][number]; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div data-edit-item={`faqs.${index}`}>
      <Glass light className="fl-faq-item">
        <button className="fl-faq-q" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span data-edit={`faqs.${index}.q`} data-edit-type="text">{faq.q}</span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="fl-faq-chev"
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
              <p className="fl-faq-a" data-edit={`faqs.${index}.a`} data-edit-type="text">{faq.a}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </Glass>
    </div>
  );
}

function FlFaq({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.faq} className="fl-section fl-faq-section">
      <div className="fl-container fl-faq-wrap">
        <Reveal>
          <p className="fl-eyebrow">
            <span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? 'FAQ'}</span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="fl-h2" data-edit="copy.faqHeading" data-edit-type="text">
            {data.copy?.faqHeading ?? 'Common questions.'}
          </h2>
        </Reveal>
        <div className="fl-faq-list">
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

// ── Booking CTA — shader backdrop + centered heading ─────────────────────────

function FlBook({ data }: { data: TemplateData }) {
  const bookLabel = data.labels?.bookCta ?? 'Book a lesson';
  return (
    <section id={SECTION_IDS.book} className="fl-book">
      {/* Shader restaged for the CTA — slower, softer */}
      <div className="fl-book-bg" aria-hidden="true">
        <ShaderBackground
          frag={SHADER_MESH}
          colorVars={FL_VARS}
          paletteKey={JSON.stringify(data.theme ?? {})}
          speed={0.6}
          className="fl-shader"
        />
      </div>
      <div className="fl-book-overlay" aria-hidden="true" />
      <div className="fl-container fl-book-inner">
        <Reveal>
          <h2 className="fl-h2 fl-book-h" data-edit="copy.bookHeading" data-edit-type="text">
            {data.copy?.bookHeading ?? 'Ready when you are.'}
          </h2>
        </Reveal>
        <Reveal delay={0.06} as="p" className="fl-book-body" data-edit="copy.bookBody" data-edit-type="text">
          {data.copy?.bookBody ?? 'Pick a time that works for you and we’ll take it from there.'}
        </Reveal>
        <Reveal className="fl-book-ctas" delay={0.14}>
          {data.bookingUrl ? (
            <a
              href={data.bookingUrl}
              className="fl-btn fl-btn-primary fl-btn-lg"
              data-edit="labels.bookCta"
              data-edit-type="text"
            >
              {bookLabel} <ArrowRight size={17} aria-hidden="true" />
            </a>
          ) : (
            <button
              type="button"
              className="fl-btn fl-btn-primary fl-btn-lg"
              title="Available once your site is published"
              data-edit="labels.bookCta"
              data-edit-type="text"
            >
              {bookLabel} <ArrowRight size={17} aria-hidden="true" />
            </button>
          )}
          {data.enrollUrl && (
            <a href={data.enrollUrl} className="fl-btn fl-btn-glass fl-btn-lg">
              <span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? 'Enroll'}</span>
            </a>
          )}
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer — solid dark, no glass wrapper ───────────────────────────

function FlContact({ data }: { data: TemplateData }) {
  const { contact, hours } = data;
  const socials = Object.entries(contact.socials ?? {});
  return (
    <footer id={SECTION_IDS.contact} className="fl-footer">
      <div className="fl-container">
        <div className="fl-footer-top">
          <div>
            <p className="fl-eyebrow">
              <span data-edit="copy.contactHeading" data-edit-type="text">
                {data.copy?.contactHeading ?? 'Get in touch'}
              </span>
            </p>
            <div className="fl-contact-info">
              <a href={`tel:${contact.phone}`} className="fl-contact-link">
                <DynamicIcon name={data.icons?.phone ?? 'Phone'} size={16} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" />
                <span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span>
              </a>
              <a href={`mailto:${contact.email}`} className="fl-contact-link">
                <DynamicIcon name={data.icons?.email ?? 'Mail'} size={16} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" />
                <span data-edit="contact.email" data-edit-type="text">{contact.email}</span>
              </a>
              <span className="fl-contact-link">
                <DynamicIcon name={data.icons?.address ?? 'MapPin'} size={16} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" />
                <span data-edit="contact.address" data-edit-type="text">{contact.address}</span>
              </span>
            </div>
            <div className="fl-socials">
              {contact.whatsapp && (
                <a href={`https://wa.me/${contact.whatsapp}`} className="fl-social" target="_blank" rel="noreferrer" aria-label="whatsapp">
                  <SocialIcon platform="whatsapp" size={18} />
                </a>
              )}
              {socials.map(([name, url]) => (
                <a key={name} href={url} className="fl-social" target="_blank" rel="noreferrer" aria-label={name}>
                  <SocialIcon platform={name} size={18} />
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="fl-eyebrow">
              <span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? 'Opening hours'}</span>
            </p>
            <table className="fl-hours">
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
        <div className="fl-footer-bottom">
          <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
          <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? 'Built with Mumotor'}</span>
        </div>
      </div>
    </footer>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function Flow({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts([
    'https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap',
  ]);
  const ids = Object.values(SECTION_IDS);
  const active = useScrollSpy(ids);

  return (
    <div
      className="tmpl-flow"
      dir={data.dir}
      style={data.theme as CSSProperties}
      data-edit="theme.bg"
      data-edit-type="background"
    >
      <ScrollBar />
      <FlNav data={data} active={active} />
      <main>
        <FlHero data={data} />
        <FlProduct data={data} />
        <FlStats stats={data.stats} />
        <FlWhy data={data} />
        <FlPackages data={data} />
        <FlAbout data={data} />
        <FlAreas data={data} />
        {data.reviews.length > 0 && <FlReviews data={data} />}
        {data.gallery.length > 0 && <FlGallery data={data} />}
        <FlFaq data={data} />
        <FlBook data={data} />
        <FlContact data={data} />
      </main>
    </div>
  );
}

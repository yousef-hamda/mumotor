/**
 * Frosted — photo-led editorial frosted glass.
 * Full-bleed driving photography with heavy frosted-glass content cards floating
 * over it. GSAP scrub-parallax (no pin) on hero + about photos for ken-burns
 * depth. Fraunces editorial serif headlines · Inter body. Warm amber accent.
 * Palette: --fr-bg / --fr-ink / --fr-accent / --fr-accent2 / --fr-panel.
 */
import { useState, useRef, type CSSProperties, type ReactNode } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ChevronDown, Check, Star, Menu, X, ArrowRight, MapPin } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, useCountUp, useMouseTilt, useScrollParallax,
  usePrefersReducedMotion, useGsapScrollTrigger, useIsEditing, reviewReplyLabel,
} from '../shared';
import { frStrings, type FrStrings } from './strings';
import './frosted.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

// ── Glass primitives ──────────────────────────────────────────────────────────

/** Light frosted-glass card — used in dark-background sections. */
function FrGlass({
  children, className, tilt = false, style,
}: { children: ReactNode; className?: string; tilt?: boolean; style?: CSSProperties }) {
  const reduced = usePrefersReducedMotion();
  const { ref, rotateX, rotateY, onMouseMove, onMouseLeave } = useMouseTilt(5);
  return (
    <motion.div
      ref={tilt ? ref : undefined}
      onMouseMove={tilt ? onMouseMove : undefined}
      onMouseLeave={tilt ? onMouseLeave : undefined}
      className={cx('fr-glass', className)}
      style={tilt && !reduced ? { rotateX, rotateY, transformPerspective: 900, ...style } : style}
    >
      <div className="fr-glass-inner">{children}</div>
    </motion.div>
  );
}

/** Dark frosted-glass card — floats over photography. */
function FrGlassDark({
  children, className, style,
}: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={cx('fr-glass-dark', className)} style={style}>
      <div className="fr-glass-inner">{children}</div>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="fr-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={15} fill={i < n ? 'var(--fr-accent)' : 'none'} color={i < n ? 'var(--fr-accent)' : 'var(--fr-muted-dark)'} />
      ))}
    </span>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────

const NAV_LINKS = (s: FrStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about,    label: s.navAbout    },
  { id: SECTION_IDS.areas,    label: s.navAreas    },
  { id: SECTION_IDS.reviews,  label: s.navReviews  },
  { id: SECTION_IDS.faq,      label: s.navFaq      },
];

function FrNav({ data, active }: { data: TemplateData; active: string }) {
  const [open, setOpen] = useState(false);
  const s = frStrings(data.locale);
  const links = NAV_LINKS(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  return (
    <nav className="fr-nav" aria-label="Main navigation">
      <div className="fr-nav-pill">
        <button className="fr-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label="Go to top">
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={30} bg="#0B1220" fg="#E8A14B" radius={9} />
          </span>
          <span data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <div className="fr-nav-links">
          {links.map(({ id, label }) => (
            <button key={id} className={cx('fr-nav-link', active === id && 'is-active')} onClick={() => scrollToSection(id)} data-edit={`copy.nav_${id}`} data-edit-type="text">
              {data.copy?.[`nav_${id}`] ?? label}
            </button>
          ))}
        </div>
        <div className="fr-nav-end">
          {data.accountUrl && (
            <a href={data.accountUrl} className="fr-btn fr-btn-ghost-dark fr-btn-sm">
              {data.copy?.nav_account ?? s.navAccount}
            </a>
          )}
          <button className="fr-btn fr-btn-primary fr-btn-sm" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
            {bookLabel}
          </button>
          <button className="fr-menu-btn" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className="fr-nav-mobile" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
            {links.map(({ id, label }) => (
              <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{label}</button>
            ))}
            {data.accountUrl && (
              <a href={data.accountUrl} style={{ fontWeight: 500, color: 'var(--fr-white)', padding: '13px 16px', borderRadius: 14, minHeight: 44, display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                {data.copy?.nav_account ?? s.navAccount}
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ── Hero — full-bleed photo, GSAP parallax via root ───────────────────────────

function FrHero({ data }: { data: TemplateData }) {
  const { hero } = data;
  const s = frStrings(data.locale);
  // Counter-parallax: glass card drifts up slightly while BG photo moves down (GSAP)
  const { ref: sectionRef, y: cardY } = useScrollParallax(22, ['start start', 'end start']);
  return (
    <section id={SECTION_IDS.hero} className="fr-hero" ref={sectionRef}>
      {/* Photo — GSAP targets .tmpl-frosted .fr-hero-bg-photo */}
      <img
        src={hero.image}
        alt={s.heroImageAlt}
        className="fr-hero-bg-photo"
        data-edit="hero.image"
        data-edit-type="image"
      />
      <div className="fr-hero-scrim" aria-hidden="true" />

      {/* Content grid */}
      <div className="fr-hero-grid">
        <motion.div style={{ y: cardY }}>
          <FrGlassDark className="fr-hero-card">
            <Reveal as="div" delay={0.05}>
              <p className="fr-eyebrow">
                <span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span>
              </p>
            </Reveal>
            <h1 className="fr-h1" data-edit="hero.headline" data-edit-type="text">{hero.headline}</h1>
            <Reveal as="p" className="fr-body fr-body-light" delay={0.12}>
              <span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span>
            </Reveal>
            <Reveal className="fr-hero-ctas" delay={0.22}>
              <button className="fr-btn fr-btn-primary fr-btn-lg" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
                {hero.ctaPrimary} <ArrowRight size={17} aria-hidden="true" />
              </button>
              <button className="fr-btn fr-btn-ghost-dark fr-btn-lg" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>
                {hero.ctaSecondary}
              </button>
            </Reveal>
            <Reveal className="fr-hero-trust" delay={0.30}>
              {data.instructor.credentials.map((c, i) => (
                <span key={i} className="fr-trust-chip" data-edit-item={`instructor.credentials.${i}`}>
                  <Check size={13} aria-hidden="true" />
                  <span data-edit={`instructor.credentials.${i}`} data-edit-type="text">{c}</span>
                </span>
              ))}
            </Reveal>
          </FrGlassDark>
        </motion.div>

        {/* Floating stat badge — desktop only via CSS */}
        <div style={{ position: 'relative' }}>
          <Reveal delay={0.18} y={20}>
            <FrGlassDark className="fr-hero-badge">
              <p className="fr-hero-badge-num" data-edit="stats.0.value" data-edit-type="text">{data.stats[0]?.prefix}{data.stats[0]?.value}{data.stats[0]?.suffix}</p>
              <p className="fr-hero-badge-label" data-edit="stats.0.label" data-edit-type="text">{data.stats[0]?.label}</p>
            </FrGlassDark>
          </Reveal>
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
    <div ref={ref} data-edit-item={`stats.${index}`}>
      <FrGlass tilt className="fr-stat">
        <span className="fr-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">
          {stat.prefix}{formatted}{stat.suffix}
        </span>
        <span className="fr-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
      </FrGlass>
    </div>
  );
}

function FrStats({ stats }: { stats: TemplateData['stats'] }) {
  return (
    <section id={SECTION_IDS.stats} className="fr-stats-section">
      <div className="fr-container">
        <div className="fr-stats-grid">
          {stats.map((s, i) => <StatItem key={i} stat={s} index={i} />)}
        </div>
      </div>
    </section>
  );
}

// ── Why ───────────────────────────────────────────────────────────────────────

const FEATURES = (s: FrStrings) => [
  { icon: 'HeartHandshake', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck',    titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin',         titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function FrWhy({ data }: { data: TemplateData }) {
  const s = frStrings(data.locale);
  return (
    <section className="fr-section">
      <div className="fr-container">
        <Reveal>
          <p className="fr-eyebrow fr-eyebrow-dark">
            <span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? s.whyEyebrowFr}</span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="fr-h2 fr-ink-h2" data-edit="copy.whyHeading" data-edit-type="text">
            {data.copy?.whyHeading ?? s.whyHeadingFr}
          </h2>
        </Reveal>
        <div className="fr-why-grid">
          {FEATURES(s).map((f, i) => (
            <Reveal key={i} delay={0.08 * i}>
              <FrGlass tilt className="fr-why-card">
                <span className="fr-why-icon">
                  <DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={22} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" />
                </span>
                <h3 className="fr-h3 fr-ink-h3 fr-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">
                  {data.copy?.[f.titleKey] ?? f.title}
                </h3>
                <p className="fr-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">
                  {data.copy?.[f.bodyKey] ?? f.body}
                </p>
              </FrGlass>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages ──────────────────────────────────────────────────────────────────

function FrPackages({ data }: { data: TemplateData }) {
  const { packages, labels } = data;
  const s = frStrings(data.locale);
  return (
    <section id={SECTION_IDS.packages} className="fr-section">
      <div className="fr-container">
        <Reveal>
          <p className="fr-eyebrow fr-eyebrow-dark">
            <span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? s.navPackages}</span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="fr-h2 fr-ink-h2" data-edit="copy.packagesHeading" data-edit-type="text">
            {data.copy?.packagesHeading ?? s.packagesHeadingFr}
          </h2>
        </Reveal>
        <Reveal as="p" className="fr-section-sub" delay={0.1}>
          <span data-edit="copy.packagesSub" data-edit-type="text">
            {data.copy?.packagesSub ?? s.packagesSubFr}
          </span>
        </Reveal>
        <div className="fr-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.08}>
              <FrGlass tilt className={cx('fr-pkg', pkg.popular && 'is-popular')} style={{ height: '100%' }}>
                <div data-edit-item={`packages.${i}`}>
                  {pkg.popular && (
                    <span className="fr-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge ?? s.badgePopular}</span>
                  )}
                  <p className="fr-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                  <p className="fr-pkg-price">
                    <span className="fr-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">₪{pkg.price}</span>
                    {pkg.unit && <span className="fr-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                  </p>
                  <ul className="fr-pkg-features">
                    {pkg.features.map((f, fi) => (
                      <li key={fi}>
                        <Check size={15} className="fr-check" aria-hidden="true" />
                        <span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={cx('fr-btn', pkg.popular ? 'fr-btn-dark' : 'fr-btn-ghost-light', 'fr-btn-block')}
                    data-edit="labels.packageCta"
                    data-edit-type="text"
                    onClick={() => scrollToSection(SECTION_IDS.book)}
                  >
                    {pkg.popular ? (labels?.packageCtaPopular ?? labels?.packageCta ?? s.bookThisPlan) : (labels?.packageCta ?? s.packageCta)}
                  </button>
                </div>
              </FrGlass>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── About — photo-led, GSAP parallax via root ────────────────────────────────

function FrAbout({ data }: { data: TemplateData }) {
  const { about, instructor } = data;
  const s = frStrings(data.locale);
  return (
    <section id={SECTION_IDS.about} className="fr-about fr-section">
      <div className="fr-container">
        <div className="fr-about-grid">
          {/* Photo column — GSAP targets .tmpl-frosted .fr-about-bg-photo */}
          <Reveal y={30} className="fr-about-photo-col" style={{ position: 'relative' }}>
            <div className="fr-about-photo-wrap">
              <img
                src={about.image}
                alt={s.aboutImageAlt}
                className="fr-about-bg-photo"
                loading="lazy"
                data-edit="about.image"
                data-edit-type="image"
              />
            </div>
            {/* Instructor badge overlaid on photo */}
            <FrGlass className="fr-instructor-badge">
              <img
                src={instructor.photo}
                alt={instructor.name}
                className="fr-instructor-photo"
                loading="lazy"
                data-edit="instructor.photo"
                data-edit-type="image"
              />
              <div>
                <p className="fr-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p>
                <p className="fr-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
              </div>
            </FrGlass>
          </Reveal>

          {/* Copy column */}
          <div className="fr-about-copy-col" style={{ paddingTop: '24px' }}>
            <Reveal>
              <p className="fr-eyebrow fr-eyebrow-dark">
                <span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? s.aboutEyebrow}</span>
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <FrGlass className="fr-about-copy-card">
                <h2 className="fr-h2 fr-ink-h2" data-edit="about.heading" data-edit-type="text">{about.heading}</h2>
                {about.body.map((p, i) => (
                  <p key={i} className="fr-body fr-body-dark" style={{ marginTop: i === 0 ? '16px' : '12px' }}>
                    <span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span>
                  </p>
                ))}
                <ul className="fr-checklist">
                  {about.checklist.map((item, i) => (
                    <li key={i} data-edit-item={`about.checklist.${i}`}><Check size={16} aria-hidden="true" /><span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span></li>
                  ))}
                </ul>
              </FrGlass>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Areas ──────────────────────────────────────────────────────────────────────

function FrAreas({ data }: { data: TemplateData }) {
  const s = frStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="fr-section">
      <div className="fr-container">
        <Reveal>
          <p className="fr-eyebrow fr-eyebrow-dark">
            <span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? s.areasEyebrowFr}</span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="fr-h2 fr-ink-h2" data-edit="copy.areasHeading" data-edit-type="text">
            {data.copy?.areasHeading ?? s.areasHeadingFr}
          </h2>
        </Reveal>
        <div className="fr-areas-grid">
          {data.areas.map((area, i) => (
            <Reveal key={i} delay={(i % 4) * 0.05}>
              <FrGlass tilt className="fr-area" data-edit-item={`areas.${i}`}>
                <MapPin size={15} aria-hidden="true" />
                <span className="fr-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
                {area.note && <span className="fr-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
              </FrGlass>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Reviews ───────────────────────────────────────────────────────────────────

function FrReviews({ data }: { data: TemplateData }) {
  const s = frStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="fr-section">
      <div className="fr-container">
        <Reveal>
          <p className="fr-eyebrow fr-eyebrow-dark">
            <span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? s.reviewsEyebrow}</span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="fr-h2 fr-ink-h2" data-edit="copy.reviewsHeading" data-edit-type="text">
            {data.copy?.reviewsHeading ?? s.reviewsHeadingFr}
          </h2>
        </Reveal>
        <div className="fr-reviews-grid">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.08}>
              <FrGlass tilt className="fr-review">
                <div data-edit-item={`reviews.${i}`}>
                  <Stars n={r.rating} />
                  <blockquote className="fr-review-text">"<span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span>"</blockquote>
                  {r.reply && (
                    <p className="fr-review-reply">
                      <span className="fr-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                    </p>
                  )}
                  <div className="fr-review-meta">
                    {r.avatar && <img src={r.avatar} alt={r.name} className="fr-avatar" loading="lazy" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                    <div>
                      <p className="fr-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                      {r.meta && <p className="fr-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
                    </div>
                  </div>
                </div>
              </FrGlass>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery ───────────────────────────────────────────────────────────────────

function FrGallery({ data }: { data: TemplateData }) {
  const s = frStrings(data.locale);
  return (
    <section className="fr-section">
      <div className="fr-container">
        <Reveal>
          <p className="fr-eyebrow fr-eyebrow-dark">
            <span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? s.galleryEyebrow}</span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="fr-h2 fr-ink-h2" data-edit="copy.galleryHeading" data-edit-type="text">
            {data.copy?.galleryHeading ?? s.galleryHeadingFr}
          </h2>
        </Reveal>
        <div className="fr-gallery-grid">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06}>
              <div className="fr-gallery-cell" data-edit-item={`gallery.${i}`}>
                <img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

function FaqItem({ faq, index }: { faq: TemplateData['faqs'][number]; index: number }) {
  const [open, setOpen] = useState(false);
  const editing = useIsEditing();
  const isOpen = editing || open;
  return (
    <FrGlass className="fr-faq-item" data-edit-item={`faqs.${index}`}>
      <button className="fr-faq-q" aria-expanded={isOpen} onClick={() => setOpen(!open)}>
        <span data-edit={`faqs.${index}.q`} data-edit-type="text">{faq.q}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="fr-faq-chev"
          aria-hidden="true"
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p className="fr-faq-a" data-edit={`faqs.${index}.a`} data-edit-type="text">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </FrGlass>
  );
}

function FrFaq({ data }: { data: TemplateData }) {
  const s = frStrings(data.locale);
  return (
    <section id={SECTION_IDS.faq} className="fr-section">
      <div className="fr-container fr-faq-wrap">
        <Reveal>
          <p className="fr-eyebrow fr-eyebrow-dark">
            <span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? s.faqEyebrow}</span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="fr-h2 fr-ink-h2" data-edit="copy.faqHeading" data-edit-type="text">
            {data.copy?.faqHeading ?? s.faqHeadingFr}
          </h2>
        </Reveal>
        <div className="fr-faq-list">
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

// ── Book CTA — photo-backed ───────────────────────────────────────────────────

function FrBook({ data }: { data: TemplateData }) {
  const s = frStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  const bookBg = data.gallery[0] ?? data.about.image;
  return (
    <section id={SECTION_IDS.book} className="fr-book">
      <img src={bookBg} alt="" className="fr-book-bg-photo" aria-hidden="true" loading="lazy" />
      <div className="fr-book-scrim" aria-hidden="true" />
      <div className="fr-book-content">
        <div className="fr-container">
          <Reveal>
            <FrGlassDark className="fr-book-card">
              <h2 className="fr-h1 fr-book-h" data-edit="copy.bookHeading" data-edit-type="text">
                {data.copy?.bookHeading ?? s.bookHeadingFr}
              </h2>
              <p className="fr-book-body" data-edit="copy.bookBody" data-edit-type="text">
                {data.copy?.bookBody ?? s.bookBodyFr}
              </p>
              <div className="fr-book-ctas">
                {data.bookingUrl ? (
                  <a href={data.bookingUrl} className="fr-btn fr-btn-primary fr-btn-lg" data-edit="labels.bookCta" data-edit-type="text">
                    {bookLabel} <ArrowRight size={17} aria-hidden="true" />
                  </a>
                ) : (
                  <button type="button" className="fr-btn fr-btn-primary fr-btn-lg" title={s.bookUnpublishedTitle} disabled aria-disabled="true" data-edit="labels.bookCta" data-edit-type="text">
                    {bookLabel} <ArrowRight size={17} aria-hidden="true" />
                  </button>
                )}
                {data.enrollUrl && (
                  <a href={data.enrollUrl} className="fr-btn fr-btn-ghost-dark fr-btn-lg">
                    <span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span>
                  </a>
                )}
              </div>
            </FrGlassDark>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Contact / Footer ──────────────────────────────────────────────────────────

function FrContact({ data }: { data: TemplateData }) {
  const st = frStrings(data.locale);
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="fr-footer">
      <div className="fr-container">
        <FrGlass className="fr-footer-card">
          <div className="fr-footer-grid">
            <div>
              <p className="fr-eyebrow fr-eyebrow-dark">
                <span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? st.contactHeading}</span>
              </p>
              <div className="fr-contact-info">
                <a href={`tel:${contact.phone}`} className="fr-contact-link">
                  <DynamicIcon name={data.icons?.phone ?? 'Phone'} size={16} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" />
                  <span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span>
                </a>
                <a href={`mailto:${contact.email}`} className="fr-contact-link">
                  <DynamicIcon name={data.icons?.email ?? 'Mail'} size={16} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" />
                  <span data-edit="contact.email" data-edit-type="text">{contact.email}</span>
                </a>
                <span className="fr-contact-link">
                  <DynamicIcon name={data.icons?.address ?? 'MapPin'} size={16} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" />
                  <span data-edit="contact.address" data-edit-type="text">{contact.address}</span>
                </span>
              </div>
              <div className="fr-socials">
                {socials.map((s, i) => (
                  <a key={i} href={s.url} className="fr-social" target="_blank" rel="noreferrer" aria-label={s.platform} data-edit-item={`contact.socials.${i}`}>
                    <SocialIcon platform={s.platform} size={18} />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="fr-eyebrow fr-eyebrow-dark">
                <span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? st.hoursLabel}</span>
              </p>
              <table className="fr-hours">
                <tbody>
                  {hours.map((h) => (
                    <tr key={h.day} className={h.closed ? 'is-closed' : ''}>
                      <td>{h.day}</td>
                      <td>{h.closed ? st.closedLabel : `${h.open} – ${h.close}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="fr-footer-bottom">
            <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
            <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? st.footerCredit}</span>
          </div>
        </FrGlass>
      </div>
    </footer>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function Frosted({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts([
    'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap',
  ]);

  const ids = Object.values(SECTION_IDS);
  const active = useScrollSpy(ids);

  /**
   * GSAP scrub-parallax (no pin — avoids layout jumps):
   * • Hero photo: ken-burns scale + translate while hero scrolls past.
   * • About photo: vertical drift while about section traverses the viewport.
   * Both are no-ops under prefers-reduced-motion (handled by useGsapScrollTrigger).
   */
  useGsapScrollTrigger(({ gsap }) => {
    // Hero background photo — scale + drift down as user scrolls away
    gsap.to('.tmpl-frosted .fr-hero-bg-photo', {
      yPercent: 22,
      scale: 1.09,
      ease: 'none',
      scrollTrigger: {
        trigger: '.tmpl-frosted .fr-hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.4,
      },
    });

    // About section photo — parallax drift
    gsap.to('.tmpl-frosted .fr-about-bg-photo', {
      yPercent: 16,
      ease: 'none',
      scrollTrigger: {
        trigger: '.tmpl-frosted .fr-about-photo-wrap',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.4,
      },
    });
  }, []);

  return (
    <div
      className="tmpl-frosted"
      dir={data.dir}
      style={data.theme as CSSProperties}
      data-edit="theme.bg"
      data-edit-type="background"
    >
      <FrNav data={data} active={active} />
      <main>
        <FrHero data={data} />
        <FrStats stats={data.stats} />
        <FrWhy data={data} />
        {data.packages.length > 0 && <FrPackages data={data} />}
        <FrAbout data={data} />
        <FrAreas data={data} />
        {data.reviews.length > 0 && <FrReviews data={data} />}
        {data.gallery.length > 0 && <FrGallery data={data} />}
        <FrFaq data={data} />
        <FrBook data={data} />
        <FrContact data={data} />
      </main>
    </div>
  );
}

import { useState, useRef, type CSSProperties } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Star, ChevronDown, Check, Clock, Award, Navigation,
} from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import {
  SECTION_IDS, scrollToSection, useScrollSpy,
  useTemplateFonts, Reveal, useCountUp, usePrefersReducedMotion,
} from '../shared';
import { elStrings, type ElStrings } from './strings';
import './easy-lane.css';

// ── Spring transition preset ──────────────────────────────────────────────────
const spring = { type: 'spring', stiffness: 220, damping: 16 } as const;
const springFast = { type: 'spring', stiffness: 380, damping: 20 } as const;

// ── NAV ───────────────────────────────────────────────────────────────────────
const NAV_LINKS = (s: ElStrings) => [
  { label: s.navPackages, id: SECTION_IDS.packages },
  { label: s.navAbout,    id: SECTION_IDS.about    },
  { label: s.navAreas,    id: SECTION_IDS.areas    },
  { label: s.navReviews,  id: SECTION_IDS.reviews  },
  { label: s.navFaq,      id: SECTION_IDS.faq      },
];

function Nav({ data, active }: { data: TemplateData; active: string }) {
  const s = elStrings(data.locale);
  const [open, setOpen] = useState(false);
  const bookLabel = data.labels?.bookCta ?? s.bookCtaEl;
  const navLinks = data.reviews.length > 0
    ? NAV_LINKS(s)
    : NAV_LINKS(s).filter(l => l.id !== SECTION_IDS.reviews);
  return (
    <nav className="el-nav" role="navigation" aria-label={s.mainNavAria}>
      <div className="el-nav-inner">
        <button className="el-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label={s.backToTop}>
          {data.business.logoSrc
            ? <img src={data.business.logoSrc} alt="" style={{ width: '2.2rem', height: '2.2rem', borderRadius: 12, objectFit: 'cover' }} data-edit="business.logoSrc" data-edit-type="image" />
            : <span className="el-logo-mark" aria-hidden="true" data-edit="business.logoSrc" data-edit-type="image">{data.business.logoText[0]}</span>}
          <span className="el-logo-text" data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <ul className="el-nav-links" role="list">
          {navLinks.map(({ label, id }) => (
            <li key={id}>
              <button
                className={`el-nav-link${active === id ? ' el-nav-link--active' : ''}`}
                onClick={() => scrollToSection(id)}
                data-edit={`copy.nav_${id}`}
                data-edit-type="text"
              >{data.copy?.[`nav_${id}`] ?? label}</button>
            </li>
          ))}
        </ul>
        <button className="el-btn el-btn-primary" onClick={() => scrollToSection(SECTION_IDS.book)}>
          <span data-edit="labels.bookCta" data-edit-type="text">{bookLabel}</span>
        </button>
        <button
          className="el-hamburger"
          aria-label={open ? s.closeMenu : s.openMenu}
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >
          <span /><span /><span />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            className="el-nav-mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: 'easeInOut' }}
          >
            {navLinks.map(({ label, id }) => (
              <button key={id} className="el-nav-mobile-link"
                onClick={() => { scrollToSection(id); setOpen(false); }}>
                {label}
              </button>
            ))}
            <button className="el-btn el-btn-primary" style={{ marginTop: '0.5rem' }}
              onClick={() => { scrollToSection(SECTION_IDS.book); setOpen(false); }}>
              {bookLabel}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ── HERO ──────────────────────────────────────────────────────────────────────
function Hero({ data }: { data: TemplateData }) {
  const s = elStrings(data.locale);
  const reduced = usePrefersReducedMotion();
  return (
    <section id={SECTION_IDS.hero} className="el-hero">
      <div className="el-blob el-blob-1" aria-hidden="true" />
      <div className="el-blob el-blob-2" aria-hidden="true" />
      <div className="el-hero-inner">
        <div className="el-hero-copy">
          <Reveal delay={0.05}>
            <span className="el-eyebrow" data-edit="hero.eyebrow" data-edit-type="text">{data.hero.eyebrow}</span>
          </Reveal>
          <Reveal delay={0.16} y={32}>
            <h1 className="el-hero-title" data-edit="hero.headline" data-edit-type="text">{data.hero.headline}</h1>
          </Reveal>
          <Reveal delay={0.28}>
            <p className="el-hero-sub" data-edit="hero.sub" data-edit-type="text">{data.hero.sub}</p>
          </Reveal>
          <Reveal delay={0.4}>
            <div className="el-hero-ctas">
              <motion.button
                className="el-btn el-btn-primary el-btn-lg"
                onClick={() => scrollToSection(SECTION_IDS.book)}
                whileHover={reduced ? {} : { scale: 1.05, y: -3 }}
                whileTap={reduced ? {} : { scale: 0.96 }}
                transition={springFast}
              ><span data-edit="hero.ctaPrimary" data-edit-type="text">{data.hero.ctaPrimary}</span></motion.button>
              <motion.button
                className="el-btn el-btn-ghost el-btn-lg"
                onClick={() => scrollToSection(SECTION_IDS.packages)}
                whileHover={reduced ? {} : { scale: 1.03 }}
                transition={springFast}
              ><span data-edit="hero.ctaSecondary" data-edit-type="text">{data.hero.ctaSecondary}</span></motion.button>
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.3} x={30} y={0}>
          <div className="el-hero-img-wrap">
            <img src={data.hero.image} alt={s.heroImageAlt} className="el-hero-img" loading="lazy" data-edit="hero.image" data-edit-type="image" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── STATS ─────────────────────────────────────────────────────────────────────
function StatCard({ stat, i }: { stat: TemplateData['stats'][number]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const raw = useCountUp(stat.value, inView, 1300);
  const isFloat = !Number.isInteger(stat.value);
  const display = isFloat ? raw.toFixed(1) : Math.round(raw).toString();
  return (
    <motion.div
      ref={ref}
      className="el-stat-card"
      data-edit-item={`stats.${i}`}
      whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(52,211,153,0.2)' }}
      transition={spring}
    >
      <div className="el-stat-num" data-edit={`stats.${i}.value`} data-edit-type="text">{stat.prefix}{display}{stat.suffix}</div>
      <div className="el-stat-label" data-edit={`stats.${i}.label`} data-edit-type="text">{stat.label}</div>
    </motion.div>
  );
}

function Stats({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.stats} className="el-stats-section">
      <div className="el-container">
        <div className="el-stats-grid">
          {data.stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.09}>
              <StatCard stat={s} i={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── YOUR JOURNEY ──────────────────────────────────────────────────────────────
const JOURNEY_STEPS = (s: ElStrings) => [
  { icon: 'Car',    label: s.journey0Label, sub: s.journey0Sub },
  { icon: 'Zap',    label: s.journey1Label, sub: s.journey1Sub },
  { icon: 'Award',  label: s.journey2Label, sub: s.journey2Sub },
  { icon: 'Trophy', label: s.journey3Label, sub: s.journey3Sub },
];

function Journey({ data }: { data: TemplateData }) {
  const s = elStrings(data.locale);
  const reduced = usePrefersReducedMotion();
  return (
    <section className="el-journey-section" aria-label={s.journeyAria}>
      <div className="el-container">
        <Reveal>
          <h2 className="el-section-title" style={{ textAlign: 'center' }} data-edit="copy.journeyHeading" data-edit-type="text">{data.copy?.journeyHeading ?? s.journeyHeading}</h2>
          <p className="el-section-sub" style={{ textAlign: 'center', maxWidth: '460px', margin: '0 auto 2.5rem' }} data-edit="copy.journeyBody" data-edit-type="text">
            {data.copy?.journeyBody ?? s.journeyBody}
          </p>
        </Reveal>
        <div className="el-journey-track" role="list">
          {JOURNEY_STEPS(s).map(({ icon, label, sub }, i) => (
            <Reveal key={label} delay={i * 0.13}>
              <div className="el-journey-step" role="listitem">
                <motion.div
                  className="el-journey-dot"
                  whileHover={reduced ? {} : { scale: 1.15, rotate: 8 }}
                  transition={{ type: 'spring', stiffness: 340, damping: 14 }}
                >
                  <DynamicIcon name={data.icons?.[`journey${i}`] ?? icon} size={24} aria-hidden="true" data-edit={`icons.journey${i}`} data-edit-type="icon" />
                </motion.div>
                <div className="el-journey-label" data-edit={`copy.journey${i}Label`} data-edit-type="text">{data.copy?.[`journey${i}Label`] ?? label}</div>
                <div className="el-journey-sub" data-edit={`copy.journey${i}Sub`} data-edit-type="text">{data.copy?.[`journey${i}Sub`] ?? sub}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── PACKAGES ──────────────────────────────────────────────────────────────────
function PackageCard({
  pkg, i, selected, onSelect, ctaLabel, s,
}: { pkg: TemplateData['packages'][number]; i: number; selected: boolean; onSelect: () => void; ctaLabel: string; s: ElStrings }) {
  return (
    <motion.div
      className={`el-pkg-card${pkg.popular ? ' el-pkg-card--popular' : ''}${selected ? ' el-pkg-card--selected' : ''}`}
      data-edit-item={`packages.${i}`}
      whileHover={{ y: -8, boxShadow: '0 28px 52px rgba(59,130,246,0.16)' }}
      transition={spring}
    >
      {pkg.badge && <span className="el-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge}</span>}
      <h3 className="el-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</h3>
      <div className="el-pkg-price">
        <span className="el-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">£{pkg.price}</span>
        {pkg.unit && <span className="el-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
      </div>
      {pkg.duration && (
        <p className="el-pkg-detail">
          <Clock size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
          {pkg.lessons ? `${pkg.lessons} × ` : ''}{pkg.duration}{(pkg.lessons ?? 1) !== 1 ? s.minLessonsSuffix : s.minLessonSuffix}
        </p>
      )}
      <ul className="el-pkg-features">
        {pkg.features.map((f, j) => (
          <li key={f} className="el-pkg-feature"><Check size={13} className="el-check" /><span data-edit={`packages.${i}.features.${j}`} data-edit-type="text">{f}</span></li>
        ))}
      </ul>
      <button
        className={`el-btn el-btn-primary${selected ? ' el-btn-selected' : ''}`}
        style={{ width: '100%', marginTop: 'auto' }}
        onClick={() => { onSelect(); scrollToSection(SECTION_IDS.book); }}
        aria-pressed={selected}
      >
        {selected ? s.selectedLabel : <span data-edit="labels.packageCta" data-edit-type="text">{ctaLabel}</span>}
      </button>
    </motion.div>
  );
}

function Packages({
  data, selectedId, onSelect,
}: { data: TemplateData; selectedId: string | null; onSelect: (id: string) => void }) {
  const s = elStrings(data.locale);
  return (
    <section id={SECTION_IDS.packages} className="el-packages-section">
      <div className="el-blob el-blob-3" aria-hidden="true" />
      <div className="el-container">
        <Reveal>
          <h2 className="el-section-title" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingEl}</h2>
          <p className="el-section-sub" data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubEl}</p>
        </Reveal>
        <div className="el-packages-grid">
          {data.packages.map((pkg, i) => {
            const baseCta = data.labels?.packageCta ?? s.packageCtaEl;
            const ctaLabel = pkg.popular ? (data.labels?.packageCtaPopular ?? baseCta) : baseCta;
            return (
              <Reveal key={pkg.id} delay={i * 0.1}>
                <PackageCard pkg={pkg} i={i} selected={selectedId === pkg.id} onSelect={() => onSelect(pkg.id)} ctaLabel={ctaLabel} s={s} />
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── ABOUT ─────────────────────────────────────────────────────────────────────
function About({ data }: { data: TemplateData }) {
  const s = elStrings(data.locale);
  return (
    <section id={SECTION_IDS.about} className="el-about-section">
      <div className="el-container">
        <div className="el-about-grid">
          <Reveal x={-26} y={0}>
            <div className="el-about-img-col">
              <div className="el-about-img-wrap">
                <img src={data.about.image} alt={s.aboutImageAlt} className="el-about-img" loading="lazy" data-edit="about.image" data-edit-type="image" />
              </div>
              <motion.div className="el-instructor-card" whileHover={{ y: -4 }} transition={spring}>
                <img src={data.instructor.photo} alt={data.instructor.name} className="el-instructor-photo" loading="lazy" data-edit="instructor.photo" data-edit-type="image" />
                <div>
                  <strong className="el-instructor-name" data-edit="instructor.name" data-edit-type="text">{data.instructor.name}</strong>
                  <span className="el-instructor-title" data-edit="instructor.title" data-edit-type="text">{data.instructor.title}</span>
                </div>
              </motion.div>
            </div>
          </Reveal>
          <div>
            <Reveal><h2 className="el-section-title" data-edit="about.heading" data-edit-type="text">{data.about.heading}</h2></Reveal>
            {data.about.body.map((para, i) => (
              <Reveal key={i} delay={i * 0.1 + 0.1}><p className="el-body-text" data-edit={`about.body.${i}`} data-edit-type="text">{para}</p></Reveal>
            ))}
            <Reveal delay={0.25}>
              <ul className="el-checklist">
                {data.about.checklist.map((item, i) => (
                  <li key={i} className="el-checklist-item" data-edit-item={`about.checklist.${i}`}><Check size={15} className="el-check" /><span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span></li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.35}>
              <div className="el-credentials">
                {data.instructor.credentials.map((c, i) => (
                  <span key={i} className="el-credential-chip" data-edit-item={`instructor.credentials.${i}`}>
                    <Award size={11} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} /><span data-edit={`instructor.credentials.${i}`} data-edit-type="text">{c}</span>
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── AREAS ─────────────────────────────────────────────────────────────────────
function Areas({ data }: { data: TemplateData }) {
  const s = elStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="el-areas-section">
      <div className="el-blob el-blob-4" aria-hidden="true" />
      <div className="el-container">
        <Reveal>
          <h2 className="el-section-title" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingEl}</h2>
          <p className="el-section-sub" data-edit="copy.areasSub" data-edit-type="text">{data.copy?.areasSub ?? s.areasSubEl}</p>
        </Reveal>
        <div className="el-areas-grid">
          {data.areas.map((area, i) => (
            <Reveal key={area.name} delay={i * 0.07}>
              <motion.div
                className={`el-area-pill${area.note ? ' el-area-pill--home' : ''}`}
                data-edit-item={`areas.${i}`}
                whileHover={{ scale: 1.07, y: -3 }}
                transition={{ type: 'spring', stiffness: 360, damping: 18 }}
              >
                <Navigation size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                <span data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
                {area.note && <span className="el-area-note"> · <span data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span></span>}
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── REVIEWS ───────────────────────────────────────────────────────────────────
function StarRow({ rating }: { rating: number }) {
  return (
    <div className="el-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={15} className={i < rating ? 'el-star-on' : 'el-star-off'} />
      ))}
    </div>
  );
}

function Reviews({ data }: { data: TemplateData }) {
  const s = elStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="el-reviews-section">
      <div className="el-container">
        <Reveal><h2 className="el-section-title" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingEl}</h2></Reveal>
        <div className="el-reviews-grid">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.1}>
              <motion.div
                className="el-review-card"
                data-edit-item={`reviews.${i}`}
                whileHover={{ y: -6, boxShadow: '0 22px 44px rgba(52,211,153,0.15)' }}
                transition={spring}
              >
                <StarRow rating={r.rating} />
                <p className="el-review-text">"<span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span>"</p>
                <div className="el-review-author">
                  {r.avatar && <img src={r.avatar} alt={r.name} className="el-review-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                  <div>
                    <strong className="el-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</strong>
                    {r.meta && <span className="el-review-meta" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</span>}
                  </div>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── GALLERY ───────────────────────────────────────────────────────────────────
function Gallery({ data }: { data: TemplateData }) {
  const s = elStrings(data.locale);
  if (data.gallery.length === 0) return null;
  return (
    <section className="el-gallery-section" aria-label={s.galleryEyebrow}>
      <div className="el-container">
        <Reveal>
          <h2 className="el-section-title" style={{ textAlign: 'center' }} data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingEl}</h2>
          <p className="el-section-sub" style={{ textAlign: 'center', maxWidth: '480px', margin: '0 auto 2.5rem' }} data-edit="copy.gallerySub" data-edit-type="text">
            {data.copy?.gallerySub ?? s.gallerySubEl}
          </p>
        </Reveal>
        <div className="el-gallery-grid">
          {data.gallery.map((src, i) => (
            <Reveal key={src + i} delay={(i % 3) * 0.08}>
              <motion.div
                className="el-gallery-item"
                data-edit-item={`gallery.${i}`}
                whileHover={{ y: -5, boxShadow: '0 22px 44px rgba(59,130,246,0.16)' }}
                transition={spring}
              >
                <img src={src} alt="" className="el-gallery-img" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
function FaqItem({
  faq, i, open, toggle,
}: { faq: TemplateData['faqs'][number]; i: number; open: boolean; toggle: () => void }) {
  return (
    <div className={`el-faq-item${open ? ' el-faq-item--open' : ''}`} data-edit-item={`faqs.${i}`}>
      <button className="el-faq-q" onClick={toggle} aria-expanded={open}>
        <span data-edit={`faqs.${i}.q`} data-edit-type="text">{faq.q}</span>
        <motion.span
          className="el-faq-chevron"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.28, ease: 'easeInOut' }}
        ><ChevronDown size={20} /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="el-faq-a"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <p data-edit={`faqs.${i}.a`} data-edit-type="text">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FAQ({ data }: { data: TemplateData }) {
  const s = elStrings(data.locale);
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section id={SECTION_IDS.faq} className="el-faq-section">
      <div className="el-container el-container--narrow">
        <Reveal><h2 className="el-section-title" style={{ textAlign: 'center' }} data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingEl}</h2></Reveal>
        <div className="el-faq-list">
          {data.faqs.map((faq, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <FaqItem faq={faq} i={i} open={openIdx === i} toggle={() => setOpenIdx(openIdx === i ? null : i)} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── BOOK ──────────────────────────────────────────────────────────────────────
function Book({ data }: { data: TemplateData }) {
  const s = elStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  const btnClass = 'el-btn el-btn-primary el-btn-lg';
  return (
    <section id={SECTION_IDS.book} className="el-book-section">
      <div className="el-blob el-blob-5" aria-hidden="true" />
      <div className="el-container el-container--narrow">
        <Reveal>
          <h2 className="el-section-title" style={{ textAlign: 'center' }} data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingEl}</h2>
          <p className="el-section-sub" style={{ textAlign: 'center', maxWidth: '480px', margin: '0 auto 2rem' }} data-edit="copy.bookBody" data-edit-type="text">
            {data.copy?.bookBody ?? s.bookBodyEl}
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="el-book-cta">
            {data.bookingUrl ? (
              <>
                <a href={data.bookingUrl} className={btnClass} data-edit="labels.bookCta" data-edit-type="text">{bookLabel}</a>
                {data.enrollUrl && (
                  <a href={data.enrollUrl} className="el-btn el-btn-ghost el-btn-lg" data-edit="copy.enrollLabel" data-edit-type="text">{data.copy?.enrollLabel ?? s.enrollLabel}</a>
                )}
              </>
            ) : (
              <button type="button" className={btnClass} title="Available once your site is published" data-edit="labels.bookCta" data-edit-type="text">{bookLabel}</button>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── CONTACT / FOOTER ──────────────────────────────────────────────────────────
function Contact({ data }: { data: TemplateData }) {
  const s = elStrings(data.locale);
  const socials = data.contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="el-contact-section" style={{ paddingBottom: '7rem' }}>
      <div className="el-container">
        <div className="el-contact-grid">
          <div>
            <Reveal>
              <div className="el-footer-logo" data-edit="business.name" data-edit-type="text">{data.business.name}</div>
              <p className="el-footer-tagline" data-edit="business.tagline" data-edit-type="text">{data.business.tagline}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="el-contact-list">
                <a href={`tel:${data.contact.phone}`} className="el-contact-item" aria-label={s.callCta}>
                  <DynamicIcon name={data.icons?.phone ?? 'Phone'} size={15} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{data.contact.phone}</span>
                </a>
                <a href={`mailto:${data.contact.email}`} className="el-contact-item" aria-label={s.emailUs}>
                  <DynamicIcon name={data.icons?.email ?? 'Mail'} size={15} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{data.contact.email}</span>
                </a>
                <span className="el-contact-item">
                  <DynamicIcon name={data.icons?.address ?? 'MapPin'} size={15} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{data.contact.address}</span>
                </span>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="el-social-row">
                {socials.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    className="el-social-btn"
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.platform}
                    data-edit-item={`contact.socials.${i}`}
                  >
                    <SocialIcon platform={s.platform} size={17} />
                  </a>
                ))}
              </div>
            </Reveal>
          </div>
          <div>
            <Reveal>
              <h3 className="el-hours-heading" data-edit="copy.hoursHeading" data-edit-type="text">{data.copy?.hoursHeading ?? s.hoursHeadingEl}</h3>
              <table className="el-hours-table" aria-label={s.hoursLabel}>
                <tbody>
                  {data.hours.map(h => (
                    <tr key={h.day} className={h.closed ? 'el-hours-closed' : ''}>
                      <td className="el-hours-day">{h.day}</td>
                      <td>{h.closed ? s.closedLabel : `${h.open} – ${h.close}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          </div>
        </div>
        <div className="el-footer-bar">
          © {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span>. <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCreditEl}</span>
        </div>
      </div>
    </footer>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function EasyLane({ data = sampleData }: { data?: TemplateData }) {
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const active = useScrollSpy(Object.values(SECTION_IDS));

  useTemplateFonts([
    'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap',
  ]);

  return (
    <div
      className="tmpl-easy-lane"
      dir={data.dir}
      style={data.theme as CSSProperties}
      data-edit="theme.bg"
      data-edit-type="background"
    >
      <Nav data={data} active={active} />
      <Hero data={data} />
      <Stats data={data} />
      <Journey data={data} />
      <Packages data={data} selectedId={selectedPkg} onSelect={setSelectedPkg} />
      <About data={data} />
      <Areas data={data} />
      {data.reviews.length > 0 && <Reviews data={data} />}
      <Gallery data={data} />
      <FAQ data={data} />
      <Book data={data} />
      <Contact data={data} />
    </div>
  );
}

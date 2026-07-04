/**
 * Prism — premium automotive dark luxury (Polestar / Rivian / Porsche energy).
 * Dark, cinematic, spacious, calm. Iridescence as a whisper — hero ShaderBackground
 * sheen + a thin gradient edge on the popular plan only. Never a neon rainbow.
 *
 * Layout rhythm (like a car brand's scroll):
 *  · Full-bleed cinematic hero: huge headline over ShaderBackground → full-width image band
 *  · Automotive spec row (stats as big numbers with hairline dividers)
 *  · Numbered product-highlight features (3-col, minimal, no glass)
 *  · "Configure your trim" package cards (popular: thin iridescent edge)
 *  · Cinematic instructor portrait band (50/50 split, no glass)
 *  · Calm coverage chips on a dark alternate band
 *  · Large quiet pull-quotes (reviews)
 *  · Clean gallery grid
 *  · Minimal accordion FAQ
 *  · Dramatic full-bleed booking band (ShaderBackground)
 *  · Minimal dark footer
 *
 * Fonts: Bricolage Grotesque 600/700/800 (headings) · Inter (body).
 * Palette CSS vars: --pr-bg / --pr-ink / --pr-c1 (magenta) / --pr-c2 (cyan) / --pr-c3 (lime).
 */
import { useRef, useState, type CSSProperties } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ChevronDown, Check, Star, Menu, X, ArrowRight } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { ShaderBackground } from '../webgl/ShaderBackground';
import { SHADER_IRIDESCENT } from '../webgl/shaders';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, useCountUp, useScrollParallax,
} from '../shared';
import { prStrings, type PrStrings } from './strings';
import './prism.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');
const PR_VARS = ['--pr-bg', '--pr-c1', '--pr-c2', '--pr-c3'];

// ── Star rating ─────────────────────────────────────────────────────────────────

function Stars({ n }: { n: number }) {
  return (
    <span className="pr-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={14}
          fill={i < n ? 'var(--pr-c2)' : 'none'}
          color={i < n ? 'var(--pr-c2)' : 'var(--pr-muted)'}
        />
      ))}
    </span>
  );
}

// ── Nav ──────────────────────────────────────────────────────────────────────────

const navLinks = (s: PrStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about,    label: s.navAbout    },
  { id: SECTION_IDS.areas,    label: s.navAreas    },
  { id: SECTION_IDS.reviews,  label: s.navReviews  },
  { id: SECTION_IDS.faq,      label: s.navFaq      },
];

function PrNav({ data, active }: { data: TemplateData; active: string }) {
  const [open, setOpen] = useState(false);
  const s = prStrings(data.locale);
  const links = navLinks(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;

  return (
    <nav className="pr-nav" aria-label="Main navigation">
      <div className="pr-nav-inner">
        <button
          className="pr-logo"
          onClick={() => scrollToSection(SECTION_IDS.hero)}
          aria-label="Go to top"
        >
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark
              letter={data.business.logoText}
              src={data.business.logoSrc}
              size={28}
              bg="#0d0e11"
              fg="#38E1FF"
              radius={8}
            />
          </span>
          <span data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>

        <div className="pr-nav-links">
          {links.map(({ id, label }) => (
            <button
              key={id}
              className={cx('pr-nav-link', active === id && 'is-active')}
              onClick={() => scrollToSection(id)}
              data-edit={`copy.nav_${id}`}
              data-edit-type="text"
            >
              {data.copy?.[`nav_${id}`] ?? label}
            </button>
          ))}
        </div>

        <div className="pr-nav-end">
          <button
            className="pr-btn pr-btn-primary pr-btn-sm"
            data-edit="labels.bookCta"
            data-edit-type="text"
            onClick={() => scrollToSection(SECTION_IDS.book)}
          >
            {bookLabel}
          </button>
          <button
            className="pr-menu"
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
            className="pr-nav-mobile"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {links.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { scrollToSection(id); setOpen(false); }}
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

// ── Hero (cinematic full-bleed) ──────────────────────────────────────────────────

function PrHero({ data }: { data: TemplateData }) {
  const { hero } = data;
  const s = prStrings(data.locale);
  const { ref: filmRef, y: filmY } = useScrollParallax(36);
  const stat = data.stats[0];

  return (
    <section id={SECTION_IDS.hero} className="pr-hero">
      {/* ShaderBackground fills the entire hero */}
      <div className="pr-hero-bg" aria-hidden="true">
        <ShaderBackground
          frag={SHADER_IRIDESCENT}
          colorVars={PR_VARS}
          paletteKey={JSON.stringify(data.theme ?? {})}
          className="pr-shader"
        />
      </div>

      {/* Copy: centered, confident, automotive */}
      <div className="pr-hero-copy">
        <Reveal as="div" className="pr-pill" delay={0.04}>
          <span className="pr-dot" aria-hidden="true" />
          <span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span>
        </Reveal>

        <h1 className="pr-h1" data-edit="hero.headline" data-edit-type="text">
          {hero.headline}
        </h1>

        <Reveal as="p" className="pr-hero-sub" delay={0.14}>
          <span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span>
        </Reveal>

        <Reveal className="pr-hero-ctas" delay={0.22}>
          <button
            className="pr-btn pr-btn-primary pr-btn-lg"
            data-edit="hero.ctaPrimary"
            data-edit-type="text"
            onClick={() => scrollToSection(SECTION_IDS.book)}
          >
            {hero.ctaPrimary} <ArrowRight size={17} aria-hidden="true" />
          </button>
          <button
            className="pr-btn pr-btn-ghost pr-btn-lg"
            data-edit="hero.ctaSecondary"
            data-edit-type="text"
            onClick={() => scrollToSection(SECTION_IDS.packages)}
          >
            {hero.ctaSecondary}
          </button>
        </Reveal>
      </div>

      {/* Full-width cinematic image band with subtle parallax */}
      <div ref={filmRef} className="pr-hero-film">
        <motion.div style={{ y: filmY }} className="pr-hero-film-track">
          <img
            src={hero.image}
            alt={s.heroImageAlt}
            className="pr-hero-film-img"
            data-edit="hero.image"
            data-edit-type="image"
          />
        </motion.div>
        {stat && (
          <div className="pr-hero-film-cap">
            <span className="pr-film-num" data-edit="stats.0.value" data-edit-type="text">
              {stat.prefix}{stat.value}{stat.suffix}
            </span>
            <span className="pr-film-label" data-edit="stats.0.label" data-edit-type="text">
              {stat.label}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Stats (automotive spec row) ──────────────────────────────────────────────────

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value) ? Math.round(n).toLocaleString() : n.toFixed(1);

  return (
    <div ref={ref} className="pr-spec" data-edit-item={`stats.${index}`}>
      <span className="pr-spec-num" data-edit={`stats.${index}.value`} data-edit-type="text">
        {stat.prefix}{formatted}{stat.suffix}
      </span>
      <span className="pr-spec-label" data-edit={`stats.${index}.label`} data-edit-type="text">
        {stat.label}
      </span>
    </div>
  );
}

function PrStats({ stats }: { stats: TemplateData['stats'] }) {
  return (
    <section id={SECTION_IDS.stats} className="pr-specs-section">
      <div className="pr-specs-row">
        {stats.map((s, i) => <StatItem key={i} stat={s} index={i} />)}
      </div>
    </section>
  );
}

// ── Why (numbered product highlights) ──────────────────────────────────────────

const FEATURES = (s: PrStrings) => [
  { icon: 'HeartHandshake', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck',    titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin',         titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function PrWhy({ data }: { data: TemplateData }) {
  const s = prStrings(data.locale);
  return (
    <section className="pr-section">
      <div className="pr-wrap">
        <Reveal>
          <p className="pr-eyebrow">
            <span data-edit="copy.whyEyebrow" data-edit-type="text">
              {data.copy?.whyEyebrow ?? s.whyEyebrowPr}
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="pr-h2" data-edit="copy.whyHeading" data-edit-type="text">
            {data.copy?.whyHeading ?? s.whyHeadingPr}
          </h2>
        </Reveal>
        <div className="pr-features-grid">
          {FEATURES(s).map((f, i) => (
            <Reveal key={i} delay={0.08 * i} className="pr-feature">
              <span className="pr-feature-num" aria-hidden="true">0{i + 1}</span>
              <span className="pr-feature-icon">
                <DynamicIcon
                  name={data.icons?.[`feature${i}`] ?? f.icon}
                  size={22}
                  aria-hidden="true"
                  data-edit={`icons.feature${i}`}
                  data-edit-type="icon"
                />
              </span>
              <h3 className="pr-feature-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">
                {data.copy?.[f.titleKey] ?? f.title}
              </h3>
              <p className="pr-feature-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">
                {data.copy?.[f.bodyKey] ?? f.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages ("configure your trim") ────────────────────────────────────────────

function PrPackages({ data }: { data: TemplateData }) {
  const { packages, labels } = data;
  const s = prStrings(data.locale);
  return (
    <section id={SECTION_IDS.packages} className="pr-section pr-section-alt">
      <div className="pr-wrap">
        <Reveal>
          <p className="pr-eyebrow">
            <span data-edit="copy.packagesEyebrow" data-edit-type="text">
              {data.copy?.packagesEyebrow ?? s.navPackages}
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="pr-h2" data-edit="copy.packagesHeading" data-edit-type="text">
            {data.copy?.packagesHeading ?? s.packagesHeadingPr}
          </h2>
        </Reveal>
        <Reveal as="p" className="pr-section-sub" delay={0.1}>
          <span data-edit="copy.packagesSub" data-edit-type="text">
            {data.copy?.packagesSub ?? s.packagesSubPr}
          </span>
        </Reveal>

        <div className="pr-plans-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.08}>
              <div className={cx('pr-plan', pkg.popular && 'is-popular')} data-edit-item={`packages.${i}`}>
                {pkg.popular && (
                  <span className="pr-plan-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge ?? s.badgePopular}</span>
                )}
                <p className="pr-plan-name" data-edit={`packages.${i}.name`} data-edit-type="text">
                  {pkg.name}
                </p>
                <p className="pr-plan-price">
                  <span className="pr-plan-amount" data-edit={`packages.${i}.price`} data-edit-type="text">
                    £{pkg.price}
                  </span>
                  {pkg.unit && <span className="pr-plan-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                </p>
                <ul className="pr-plan-features">
                  {pkg.features.map((f, fi) => (
                    <li key={fi}>
                      <Check size={15} className="pr-check" aria-hidden="true" />
                      <span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={cx('pr-btn', pkg.popular ? 'pr-btn-primary' : 'pr-btn-outline', 'pr-btn-block')}
                  data-edit="labels.packageCta"
                  data-edit-type="text"
                  onClick={() => scrollToSection(SECTION_IDS.book)}
                >
                  {pkg.popular
                    ? (labels?.packageCtaPopular ?? labels?.packageCta ?? s.bookThisPlan)
                    : (labels?.packageCta ?? s.packageCta)}
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── About (cinematic instructor band) ───────────────────────────────────────────

function PrAbout({ data }: { data: TemplateData }) {
  const { about, instructor } = data;
  const s = prStrings(data.locale);
  return (
    <section id={SECTION_IDS.about} className="pr-section">
      <div className="pr-wrap pr-about-grid">
        <Reveal className="pr-about-media" y={24}>
          <img
            src={about.image}
            alt={s.aboutImageAlt}
            className="pr-about-img"
            data-edit="about.image"
            data-edit-type="image"
            loading="lazy"
          />
          <div className="pr-instructor-strip">
            <img
              src={instructor.photo}
              alt={instructor.name}
              className="pr-instructor-photo"
              data-edit="instructor.photo"
              data-edit-type="image"
              loading="lazy"
            />
            <div>
              <p className="pr-instructor-name" data-edit="instructor.name" data-edit-type="text">
                {instructor.name}
              </p>
              <p className="pr-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
            </div>
          </div>
        </Reveal>

        <div className="pr-about-copy">
          <Reveal>
            <p className="pr-eyebrow">
              <span data-edit="copy.aboutEyebrow" data-edit-type="text">
                {data.copy?.aboutEyebrow ?? s.aboutEyebrow}
              </span>
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="pr-h2" data-edit="about.heading" data-edit-type="text">
              {about.heading}
            </h2>
          </Reveal>
          {about.body.map((p, i) => (
            <Reveal key={i} as="p" className="pr-body" delay={0.1 + i * 0.06}>
              <span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span>
            </Reveal>
          ))}
          <Reveal delay={0.22}>
            <ul className="pr-checklist">
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

// ── Areas (calm coverage chips) ──────────────────────────────────────────────────

function PrAreas({ data }: { data: TemplateData }) {
  const s = prStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="pr-section pr-section-alt">
      <div className="pr-wrap">
        <Reveal>
          <p className="pr-eyebrow">
            <span data-edit="copy.areasEyebrow" data-edit-type="text">
              {data.copy?.areasEyebrow ?? s.areasEyebrowPr}
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="pr-h2" data-edit="copy.areasHeading" data-edit-type="text">
            {data.copy?.areasHeading ?? s.areasHeadingPr}
          </h2>
        </Reveal>
        <div className="pr-areas-wrap">
          {data.areas.map((area, i) => (
            <Reveal key={i} delay={(i % 5) * 0.04} className="pr-area-tag" data-edit-item={`areas.${i}`}>
              <span className="pr-area-dot" aria-hidden="true" />
              <span data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              {area.note && <span className="pr-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Reviews (large quiet pull-quotes) ───────────────────────────────────────────

function PrReviews({ data }: { data: TemplateData }) {
  const s = prStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="pr-section">
      <div className="pr-wrap">
        <Reveal>
          <p className="pr-eyebrow">
            <span data-edit="copy.reviewsEyebrow" data-edit-type="text">
              {data.copy?.reviewsEyebrow ?? s.reviewsEyebrow}
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="pr-h2" data-edit="copy.reviewsHeading" data-edit-type="text">
            {data.copy?.reviewsHeading ?? s.reviewsHeadingPr}
          </h2>
        </Reveal>
        <div className="pr-quotes-grid">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.08} className="pr-quote">
              <div data-edit-item={`reviews.${i}`}>
                <Stars n={r.rating} />
                <blockquote className="pr-quote-text">"<span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span>"</blockquote>
                <div className="pr-quote-meta">
                  {r.avatar && (
                    <img src={r.avatar} alt={r.name} className="pr-avatar" loading="lazy" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />
                  )}
                  <div>
                    <p className="pr-quote-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                    {r.meta && <p className="pr-quote-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery ─────────────────────────────────────────────────────────────────────

function PrGallery({ data }: { data: TemplateData }) {
  const s = prStrings(data.locale);
  return (
    <section className="pr-section pr-section-alt">
      <div className="pr-wrap">
        <Reveal>
          <p className="pr-eyebrow">
            <span data-edit="copy.galleryEyebrow" data-edit-type="text">
              {data.copy?.galleryEyebrow ?? s.galleryEyebrow}
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="pr-h2" data-edit="copy.galleryHeading" data-edit-type="text">
            {data.copy?.galleryHeading ?? s.galleryHeadingPr}
          </h2>
        </Reveal>
        <div className="pr-gallery-grid">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06}>
              <div className="pr-gallery-cell" data-edit-item={`gallery.${i}`}>
                <img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ (minimal accordion) ──────────────────────────────────────────────────────

function FaqItem({ faq, index }: { faq: TemplateData['faqs'][number]; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pr-accord-item" data-edit-item={`faqs.${index}`}>
      <button
        className="pr-accord-q"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span data-edit={`faqs.${index}.q`} data-edit-type="text">{faq.q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="pr-accord-chev"
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
            <p className="pr-accord-a" data-edit={`faqs.${index}.a`} data-edit-type="text">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PrFaq({ data }: { data: TemplateData }) {
  const s = prStrings(data.locale);
  return (
    <section id={SECTION_IDS.faq} className="pr-section">
      <div className="pr-wrap pr-accord-wrap">
        <Reveal>
          <p className="pr-eyebrow">
            <span data-edit="copy.faqEyebrow" data-edit-type="text">
              {data.copy?.faqEyebrow ?? s.faqEyebrow}
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="pr-h2" data-edit="copy.faqHeading" data-edit-type="text">
            {data.copy?.faqHeading ?? s.faqHeadingPr}
          </h2>
        </Reveal>
        <div className="pr-accord-list">
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

// ── Booking CTA (dramatic full-bleed shader band) ───────────────────────────────

function PrBook({ data }: { data: TemplateData }) {
  const s = prStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="pr-book-section">
      <div className="pr-hero-bg" aria-hidden="true">
        <ShaderBackground
          frag={SHADER_IRIDESCENT}
          colorVars={PR_VARS}
          paletteKey={JSON.stringify(data.theme ?? {})}
          speed={0.7}
          className="pr-shader"
        />
      </div>
      <Reveal className="pr-book-inner">
        <h2 className="pr-h2 pr-book-h" data-edit="copy.bookHeading" data-edit-type="text">
          {data.copy?.bookHeading ?? s.bookHeadingPr}
        </h2>
        <p className="pr-book-sub" data-edit="copy.bookBody" data-edit-type="text">
          {data.copy?.bookBody ?? s.bookBodyPr}
        </p>
        <div className="pr-book-ctas">
          {data.bookingUrl ? (
            <a
              href={data.bookingUrl}
              className="pr-btn pr-btn-primary pr-btn-lg"
              data-edit="labels.bookCta"
              data-edit-type="text"
            >
              {bookLabel} <ArrowRight size={17} aria-hidden="true" />
            </a>
          ) : (
            <button
              type="button"
              className="pr-btn pr-btn-primary pr-btn-lg"
              title="Available once your site is published"
              data-edit="labels.bookCta"
              data-edit-type="text"
            >
              {bookLabel} <ArrowRight size={17} aria-hidden="true" />
            </button>
          )}
          {data.enrollUrl && (
            <a href={data.enrollUrl} className="pr-btn pr-btn-ghost pr-btn-lg">
              <span data-edit="copy.enrollCta" data-edit-type="text">
                {data.copy?.enrollCta ?? s.enrollLabel}
              </span>
            </a>
          )}
        </div>
      </Reveal>
    </section>
  );
}

// ── Contact / Footer ─────────────────────────────────────────────────────────────

function PrContact({ data }: { data: TemplateData }) {
  const { contact, hours } = data;
  const s = prStrings(data.locale);
  const socials = contact.socials ?? [];

  return (
    <footer id={SECTION_IDS.contact} className="pr-footer">
      <div className="pr-wrap pr-footer-grid">
        <div>
          <p className="pr-eyebrow">
            <span data-edit="copy.contactHeading" data-edit-type="text">
              {data.copy?.contactHeading ?? s.contactHeading}
            </span>
          </p>
          <div className="pr-contact-info">
            <a href={`tel:${contact.phone}`} className="pr-contact-link">
              <DynamicIcon
                name={data.icons?.phone ?? 'Phone'}
                size={16}
                aria-hidden="true"
                data-edit="icons.phone"
                data-edit-type="icon"
              />
              <span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span>
            </a>
            <a href={`mailto:${contact.email}`} className="pr-contact-link">
              <DynamicIcon
                name={data.icons?.email ?? 'Mail'}
                size={16}
                aria-hidden="true"
                data-edit="icons.email"
                data-edit-type="icon"
              />
              <span data-edit="contact.email" data-edit-type="text">{contact.email}</span>
            </a>
            <span className="pr-contact-link">
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
          <div className="pr-socials">
            {socials.map((s, i) => (
              <a
                key={i}
                href={s.url}
                className="pr-social"
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
          <p className="pr-eyebrow">
            <span data-edit="copy.hoursLabel" data-edit-type="text">
              {data.copy?.hoursLabel ?? s.hoursLabel}
            </span>
          </p>
          <table className="pr-hours">
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

      <div className="pr-wrap pr-footer-bottom">
        <span>
          © {new Date().getFullYear()}{' '}
          <span data-edit="business.name" data-edit-type="text">{data.business.name}</span>
        </span>
        <span data-edit="copy.footerCredit" data-edit-type="text">
          {data.copy?.footerCredit ?? s.footerCredit}
        </span>
      </div>
    </footer>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────

export default function Prism({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts([
    'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&display=swap',
  ]);

  const ids = Object.values(SECTION_IDS);
  const active = useScrollSpy(ids);

  return (
    <div
      className="tmpl-prism"
      dir={data.dir}
      style={data.theme as CSSProperties}
      data-edit="theme.bg"
      data-edit-type="background"
    >
      <PrNav data={data} active={active} />
      <main>
        <PrHero data={data} />
        <PrStats stats={data.stats} />
        <PrWhy data={data} />
        <PrPackages data={data} />
        <PrAbout data={data} />
        <PrAreas data={data} />
        {data.reviews.length > 0 && <PrReviews data={data} />}
        {data.gallery.length > 0 && <PrGallery data={data} />}
        <PrFaq data={data} />
        <PrBook data={data} />
        <PrContact data={data} />
      </main>
    </div>
  );
}

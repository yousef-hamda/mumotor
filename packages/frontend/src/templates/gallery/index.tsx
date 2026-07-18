/**
 * Gallery — the museum exhibition. The instructor's work presented as a fine-art
 * show: a warm gallery wall, the real driving-lesson photos hung as FRAMED WORKS
 * (dark frame + mat + cast shadow) each with a museum WALL-LABEL, and a soft
 * SPOTLIGHT that follows scroll down the wall. Elegant, quiet, authoritative,
 * photography-forward. Not glass, not gradient, not loud.
 *
 * Cormorant (elegant high-contrast serif — signage, headings, prices, italic
 * accents) + Inter (body + the small-caps museum-label / nav voice).
 * Palette via CSS vars on `.tmpl-gallery`: --ga-wall / --ga-ink / --ga-accent
 * (museum ochre, the ONE accent) / --ga-band / --ga-muted. Tints derive via
 * color-mix, so Customize recolouring never breaks.
 *
 * SIGNATURE — the spotlight walk: a fixed radial "gallery light" reads a
 * `--ga-spot` (0..1) CSS var written from useScroll (coalesced in one rAF), so
 * the pool of light drifts down the wall as you scroll. Under reduced motion the
 * listener never binds and the light rests on the hero. The hero framed work
 * gets an EnterTilt; works reveal with the shared Reveal (never whileInView by
 * hand). Frames, mats, shadows and the spotlight are decorative; headings and
 * wall-labels stay real, editable text.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useScroll, useMotionValueEvent, useInView } from 'framer-motion';
import { Plus, Minus, Star, Menu, X, ArrowRight, Check } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { gaStrings, type GaStrings } from './strings';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, EnterTilt, useCountUp, useIsEditing, reviewReplyLabel,
  usePrefersReducedMotion,
} from '../shared';
import './gallery.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

/** Roman numerals for the wall-label plate numbers (hero = Plate I). */
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function Stars({ n }: { n: number }) {
  return (
    <span className="ga-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill={i < n ? 'var(--ga-accent)' : 'none'} color={i < n ? 'var(--ga-accent)' : 'var(--ga-line)'} />
      ))}
    </span>
  );
}

/** A museum wall-label — a real, visible label mounted with the framed work. */
function GaPlate({ title, medium, year, s }: { title: string; medium: string; year?: string; s: GaStrings }) {
  return (
    <figcaption className="ga-plate">
      <span className="ga-plate-title">{title}</span>
      <span className="ga-plate-rows">
        <span className="ga-plate-row">
          <span className="ga-plate-k">{s.mediumLabel}</span>
          <span className="ga-plate-v">{medium}</span>
        </span>
        {year && (
          <span className="ga-plate-row">
            <span className="ga-plate-k">{s.yearLabel}</span>
            <span className="ga-plate-v">{year}</span>
          </span>
        )}
      </span>
    </figcaption>
  );
}

// ── Nav ─────────────────────────────────────────────────────────────────────────

const navLinks = (s: GaStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about, label: s.navAbout },
  { id: SECTION_IDS.areas, label: s.navAreas },
  { id: SECTION_IDS.reviews, label: s.navReviews },
  { id: SECTION_IDS.faq, label: s.navFaq },
];

function GaNav({ data, active }: { data: TemplateData; active: string }) {
  const s = gaStrings(data.locale);
  const [open, setOpen] = useState(false);
  const links = navLinks(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  return (
    <nav className="ga-nav" aria-label={s.mainNavAria}>
      <div className="ga-nav-bar">
        <div className="ga-nav-inner">
          <button className="ga-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label={s.goToTopAria}>
            <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
              <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={30} bg="var(--ga-frame)" fg="var(--ga-wall)" radius={2} />
            </span>
            <span className="ga-logo-word" data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
          </button>
          <div className="ga-nav-links">
            {links.map(({ id, label }) => (
              <button
                key={id}
                className={cx('ga-nav-link', active === id && 'is-active')}
                onClick={() => scrollToSection(id)}
                data-edit={`copy.nav_${id}`}
                data-edit-type="text"
              >
                {data.copy?.[`nav_${id}`] ?? label}
              </button>
            ))}
          </div>
          <div className="ga-nav-end">
            {data.accountUrl && (
              <a href={data.accountUrl} className="ga-btn ga-btn-ghost ga-btn-sm">{data.copy?.nav_account ?? s.navAccount}</a>
            )}
            <button className="ga-btn ga-btn-primary ga-btn-sm" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{bookLabel}</button>
            <button className="ga-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
      </div>
      {open && (
        <div className="ga-nav-mobile">
          {links.map(({ id, label }) => <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{label}</button>)}
          {data.accountUrl && <a href={data.accountUrl} className="ga-nav-mobile-link">{data.copy?.nav_account ?? s.navAccount}</a>}
        </div>
      )}
    </nav>
  );
}

// ── Hero (engraved title | large framed work) ───────────────────────────────────

function GaHero({ data }: { data: TemplateData }) {
  const s = gaStrings(data.locale);
  const { hero } = data;
  return (
    <section id={SECTION_IDS.hero} className="ga-section ga-hero">
      <div className="ga-wrap ga-hero-grid">
        <div className="ga-hero-copy">
          <Reveal><p className="ga-eyebrow"><span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h1 className="ga-h1" data-edit="hero.headline" data-edit-type="text">{hero.headline}</h1></Reveal>
          <Reveal as="p" className="ga-hero-sub" delay={0.12}><span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span></Reveal>
          <Reveal className="ga-hero-ctas" delay={0.18}>
            <button className="ga-btn ga-btn-primary" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{hero.ctaPrimary} <ArrowRight size={15} aria-hidden="true" /></button>
            <button className="ga-btn ga-btn-ghost" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>{hero.ctaSecondary}</button>
          </Reveal>
        </div>
        <div className="ga-hero-media">
          <EnterTilt maxTilt={6} perspective={1500}>
            <figure className="ga-work ga-work-hero">
              <div className="ga-frame">
                <div className="ga-mat">
                  <img src={hero.image} alt={s.heroImageAlt} className="ga-work-img" data-edit="hero.image" data-edit-type="image" />
                </div>
              </div>
              <GaPlate title={s.heroWorkTitle} medium={s.plateMedium} year={s.onView} s={s} />
            </figure>
          </EnterTilt>
        </div>
      </div>
    </section>
  );
}

// ── Stats ───────────────────────────────────────────────────────────────────────

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value) ? Math.round(n).toLocaleString('en-US') : n.toFixed(1);
  return (
    <div ref={ref} className="ga-stat" data-edit-item={`stats.${index}`}>
      <span className="ga-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{formatted}{stat.suffix}</span>
      <span className="ga-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function GaStats({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.stats} className="ga-stats">
      <div className="ga-wrap ga-stats-row">{data.stats.map((st, i) => <StatItem key={i} stat={st} index={i} />)}</div>
    </section>
  );
}

// ── Why (the collection) ────────────────────────────────────────────────────────

const features = (s: GaStrings) => [
  { icon: 'Route', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function GaWhy({ data }: { data: TemplateData }) {
  const s = gaStrings(data.locale);
  return (
    <section className="ga-section">
      <div className="ga-wrap">
        <div className="ga-head">
          <Reveal><p className="ga-eyebrow"><span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? s.whyEyebrowGa}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="ga-h2" data-edit="copy.whyHeading" data-edit-type="text">{data.copy?.whyHeading ?? s.whyHeadingGa}</h2></Reveal>
        </div>
        <div className="ga-why-grid">
          {features(s).map((f, i) => (
            <Reveal key={i} delay={i * 0.06} className="ga-why">
              <span className="ga-why-icon"><DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={20} strokeWidth={1.5} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" /></span>
              <h3 className="ga-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">{data.copy?.[f.titleKey] ?? f.title}</h3>
              <p className="ga-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">{data.copy?.[f.bodyKey] ?? f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages (acquisitions) ─────────────────────────────────────────────────────

function GaPackages({ data }: { data: TemplateData }) {
  const s = gaStrings(data.locale);
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="ga-section ga-band">
      <div className="ga-wrap">
        <div className="ga-head">
          <Reveal><p className="ga-eyebrow"><span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? s.packagesEyebrowGa}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="ga-h2" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingGa}</h2></Reveal>
          <Reveal as="p" className="ga-lead" delay={0.12}><span data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubGa}</span></Reveal>
        </div>
        <div className="ga-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.06} data-edit-item={`packages.${i}`}>
              <div className={cx('ga-pkg', pkg.popular && 'is-popular')}>
                {pkg.popular && (
                  <span className="ga-pkg-plate">
                    <span className="ga-pkg-plate-dot" aria-hidden="true" />
                    <span className="ga-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge ?? s.patronsChoice}</span>
                  </span>
                )}
                <p className="ga-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                <p className="ga-pkg-price">
                  <span className="ga-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">₪{pkg.price}</span>
                  {pkg.unit && <span className="ga-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                </p>
                <ul className="ga-pkg-features">
                  {pkg.features.map((f, fi) => (
                    <li key={fi}><Check size={14} className="ga-check" aria-hidden="true" /><span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span></li>
                  ))}
                </ul>
                <button className={cx('ga-btn', pkg.popular ? 'ga-btn-primary' : 'ga-btn-ghost', 'ga-btn-block')} data-edit="labels.packageCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
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

// ── About (provenance) ──────────────────────────────────────────────────────────

function GaAbout({ data }: { data: TemplateData }) {
  const s = gaStrings(data.locale);
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="ga-section">
      <div className="ga-wrap ga-about">
        <div className="ga-about-media">
          <Reveal y={26}>
            <figure className="ga-work">
              <div className="ga-frame">
                <div className="ga-mat">
                  <img src={about.image} alt={s.aboutImageAlt} className="ga-work-img ga-about-img" data-edit="about.image" data-edit-type="image" />
                </div>
              </div>
              <GaPlate title={s.aboutWorkTitle} medium={s.plateMedium} s={s} />
            </figure>
          </Reveal>
          <Reveal delay={0.1} className="ga-instructor">
            <img src={instructor.photo} alt={instructor.name} className="ga-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div className="ga-instructor-id">
              <p className="ga-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p>
              <p className="ga-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
            </div>
          </Reveal>
        </div>
        <div className="ga-about-copy">
          <Reveal><p className="ga-eyebrow"><span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? s.aboutEyebrowGa}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="ga-h2 ga-h2-tight" data-edit="about.heading" data-edit-type="text">{about.heading}</h2></Reveal>
          {about.body.map((p, i) => (
            <Reveal key={i} as="p" className="ga-body" delay={0.1 + i * 0.06}><span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span></Reveal>
          ))}
          <Reveal delay={0.22}>
            <ul className="ga-checklist">
              {about.checklist.map((item, i) => (
                <li key={i} data-edit-item={`about.checklist.${i}`}>
                  <Check size={15} strokeWidth={2} className="ga-check" aria-hidden="true" />
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          {instructor.bio && <Reveal as="p" className="ga-body" delay={0.26}><span data-edit="instructor.bio" data-edit-type="text">{instructor.bio}</span></Reveal>}
          {instructor.credentials.length > 0 && (
            <Reveal delay={0.3}>
              <div className="ga-creds">
                {instructor.credentials.map((c, i) => (
                  <span key={i} className="ga-cred" data-edit-item={`instructor.credentials.${i}`}>
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

// ── Areas (the floor plan) ──────────────────────────────────────────────────────

function GaAreas({ data }: { data: TemplateData }) {
  const s = gaStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="ga-section ga-band">
      <div className="ga-wrap">
        <div className="ga-head">
          <Reveal><p className="ga-eyebrow"><span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? s.areasEyebrowGa}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="ga-h2" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingGa}</h2></Reveal>
        </div>
        <ul className="ga-areas">
          {data.areas.map((area, i) => (
            <Reveal key={i} as="li" delay={(i % 4) * 0.04} className="ga-area" data-edit-item={`areas.${i}`}>
              <span className="ga-area-key" aria-hidden="true" />
              <span className="ga-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              {area.note && <span className="ga-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Reviews (provenance plaques) ────────────────────────────────────────────────

function GaReviews({ data }: { data: TemplateData }) {
  const s = gaStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="ga-section">
      <div className="ga-wrap">
        <div className="ga-head">
          <Reveal><p className="ga-eyebrow"><span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? s.reviewsEyebrowGa}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="ga-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingGa}</h2></Reveal>
        </div>
        <div className="ga-reviews">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06} className="ga-review" data-edit-item={`reviews.${i}`}>
              <span className="ga-quote-mark" aria-hidden="true">“</span>
              <Stars n={r.rating} />
              <blockquote className="ga-review-text"><span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span></blockquote>
              {r.reply && (
                <p className="ga-review-reply">
                  <span className="ga-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                </p>
              )}
              <div className="ga-review-meta">
                {r.avatar && <img src={r.avatar} alt={r.name} className="ga-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                <div>
                  <p className="ga-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                  {r.meta && <p className="ga-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery (the exhibition — framed works side by side) ─────────────────────────

function GaGallery({ data }: { data: TemplateData }) {
  const s = gaStrings(data.locale);
  return (
    <section className="ga-section ga-band">
      <div className="ga-wrap">
        <div className="ga-head">
          <Reveal><p className="ga-eyebrow"><span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? s.galleryEyebrowGa}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="ga-h2" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingGa}</h2></Reveal>
        </div>
        <div className="ga-gallery">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06} className="ga-gcell" data-edit-item={`gallery.${i}`}>
              <figure className="ga-work">
                <div className="ga-frame">
                  <div className="ga-mat">
                    <img src={src} alt="" loading="lazy" className="ga-work-img" data-edit={`gallery.${i}`} data-edit-type="image" />
                  </div>
                </div>
                <figcaption className="ga-plate">
                  <span className="ga-plate-title">{s.plateWord} {ROMAN[i + 1] ?? String(i + 2)}</span>
                  <span className="ga-plate-rows">
                    <span className="ga-plate-row">
                      <span className="ga-plate-k">{s.mediumLabel}</span>
                      <span className="ga-plate-v">{s.plateMedium}</span>
                    </span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ (catalogue notes) ───────────────────────────────────────────────────────

function GaFaq({ data }: { data: TemplateData }) {
  const s = gaStrings(data.locale);
  const [open, setOpen] = useState<number | null>(0);
  const editing = useIsEditing();
  return (
    <section id={SECTION_IDS.faq} className="ga-section">
      <div className="ga-wrap ga-faq-wrap">
        <div className="ga-head">
          <Reveal><p className="ga-eyebrow"><span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? s.faqEyebrowGa}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="ga-h2" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingGa}</h2></Reveal>
        </div>
        <div className="ga-faq-list">
          {data.faqs.map((faq, i) => {
            const isOpen = editing || open === i;
            return (
              <div key={i} className="ga-faq-item" data-edit-item={`faqs.${i}`}>
                <button className="ga-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span data-edit={`faqs.${i}.q`} data-edit-type="text">{faq.q}</span>
                  <span className="ga-faq-ic" aria-hidden="true">{isOpen ? <Minus size={15} /> : <Plus size={15} />}</span>
                </button>
                <div className={cx('ga-faq-panel', isOpen && 'is-open')}>
                  <div className="ga-faq-panel-in"><p data-edit={`faqs.${i}.a`} data-edit-type="text">{faq.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Book (the private view) ─────────────────────────────────────────────────────

function GaBook({ data }: { data: TemplateData }) {
  const s = gaStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="ga-section ga-book-section">
      <div className="ga-book-glow" aria-hidden="true" />
      <div className="ga-wrap">
        <Reveal className="ga-book">
          <h2 className="ga-h2" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingGa}</h2>
          <p className="ga-lead" data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodyGa}</p>
          <div className="ga-book-ctas">
            {data.bookingUrl ? (
              <a href={data.bookingUrl} className="ga-btn ga-btn-primary" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></a>
            ) : (
              <button type="button" className="ga-btn ga-btn-primary" title={s.publishNote} disabled aria-disabled="true" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></button>
            )}
            {data.enrollUrl && <a href={data.enrollUrl} className="ga-btn ga-btn-ghost"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span></a>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer ────────────────────────────────────────────────────────────

function GaContact({ data }: { data: TemplateData }) {
  const s = gaStrings(data.locale);
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="ga-footer">
      <div className="ga-wrap ga-footer-grid">
        <div>
          <p className="ga-eyebrow"><span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeadingGa}</span></p>
          <div className="ga-contact-info">
            <a href={`tel:${contact.phone}`} className="ga-contact-link"><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span></a>
            <a href={`mailto:${contact.email}`} className="ga-contact-link"><DynamicIcon name={data.icons?.email ?? 'Mail'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span></a>
            <span className="ga-contact-link"><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span></span>
          </div>
          <div className="ga-socials">
            {socials.map((so, i) => (
              <a key={i} href={so.url} className="ga-social" target="_blank" rel="noreferrer" aria-label={so.platform} data-edit-item={`contact.socials.${i}`}>
                <SocialIcon platform={so.platform} size={16} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="ga-eyebrow"><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabelGa}</span></p>
          <table className="ga-hours">
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
      <div className="ga-wrap ga-footer-bottom">
        <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
        <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCredit}</span>
      </div>
    </footer>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────

export default function Gallery({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts(['https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap']);
  const active = useScrollSpy(Object.values(SECTION_IDS));
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  // The spotlight walk: read scroll progress and write it to --ga-spot, coalesced
  // in one rAF. Works in the window AND the builder's inner scroll container.
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ['start start', 'end end'] });
  const rafRef = useRef(0);
  const pendingRef = useRef(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (reduced) return; // reduced motion → light stays at the CSS default (rests on hero)
    pendingRef.current = v;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      rootRef.current?.style.setProperty('--ga-spot', pendingRef.current.toFixed(4));
    });
  });
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  return (
    <div ref={rootRef} className="tmpl-gallery" dir={data.dir} style={data.theme as CSSProperties} data-edit="theme.bg" data-edit-type="background">
      {/* Fixed wall layers (behind content) — the spotlight + faint static grain. */}
      <div className="ga-light" aria-hidden="true" />
      <div className="ga-texture" aria-hidden="true" />
      <div className="ga-content">
        <GaNav data={data} active={active} />
        <main>
          <GaHero data={data} />
          <GaStats data={data} />
          <GaWhy data={data} />
          {data.packages.length > 0 && <GaPackages data={data} />}
          <GaAbout data={data} />
          <GaAreas data={data} />
          {data.reviews.length > 0 && <GaReviews data={data} />}
          {data.gallery.length > 0 && <GaGallery data={data} />}
          <GaFaq data={data} />
          <GaBook data={data} />
          <GaContact data={data} />
        </main>
      </div>
    </div>
  );
}

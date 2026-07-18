/**
 * Bezel — the instrument. A driving instructor's world is dials, needles and
 * knurled rings, so this template is a precision-machined object: cool charcoal
 * anodized metal, milled panel edges built from static layered box-shadows,
 * knurling as the texture motif, and exactly ONE signal-red needle.
 * Braun / Leica / Nomos, not gold-and-serif luxury (that's `prestige`).
 *
 * SIGNATURE: the stats row is a GAUGE CLUSTER — each stat is a circular dial with
 * static tick marks and a signal needle that sweeps 240° to its value, driven by
 * the same eased `useCountUp` that prints the number, so the needle settles like a
 * real instrument. Transform-only (compositor-cheap), final angle under reduced motion.
 *
 * Familjen Grotesk (display + body) · Martian Mono (numerals + utility).
 * Palette vars on `.tmpl-bezel`: --bz-case / --bz-face / --bz-ink / --bz-signal / --bz-metal.
 */
import { useRef, useState, type CSSProperties } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Check, Star, Menu, X, ArrowRight, Plus, Minus } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { usePointerCoarse } from '../../lib/useDevice';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, useCountUp, useMouseTilt, EnterMount, useIsEditing, reviewReplyLabel,
} from '../shared';
import { bzStrings, type BzStrings } from './strings';
import './bezel.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

/** 12 static hairline ticks spanning the dial's 240° sweep (−120° … +120°). */
const TICKS = Array.from({ length: 12 }, (_, i) => -120 + (i * 240) / 11);

function Stars({ n }: { n: number }) {
  return (
    <span className="bz-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill={i < n ? 'var(--bz-signal)' : 'none'} color={i < n ? 'var(--bz-signal)' : 'var(--bz-metal)'} />
      ))}
    </span>
  );
}

// ── Nav ──────────────────────────────────────────────────────────────────────

const navLinks = (s: BzStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about, label: s.navAbout },
  { id: SECTION_IDS.areas, label: s.navAreas },
  { id: SECTION_IDS.reviews, label: s.navReviews },
  { id: SECTION_IDS.faq, label: s.navFaq },
];

function BzNav({ data, active }: { data: TemplateData; active: string }) {
  const s = bzStrings(data.locale);
  const [open, setOpen] = useState(false);
  const links = navLinks(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  return (
    <nav className="bz-nav" aria-label={s.mainNavAria}>
      <div className="bz-nav-inner">
        <button className="bz-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label={s.goToTopAria}>
          <span className="bz-logo-mark" data-edit="business.logoSrc" data-edit-type="image">
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={28} bg="var(--bz-face)" fg="var(--bz-ink)" radius={8} />
          </span>
          <span data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <div className="bz-nav-links">
          {links.map(({ id, label }) => (
            <button key={id} className={cx('bz-nav-link', active === id && 'is-active')} onClick={() => scrollToSection(id)} data-edit={`copy.nav_${id}`} data-edit-type="text">{data.copy?.[`nav_${id}`] ?? label}</button>
          ))}
        </div>
        <div className="bz-nav-end">
          {data.accountUrl && (
            <a href={data.accountUrl} className="bz-btn bz-btn-ghost bz-btn-sm">{data.copy?.nav_account ?? s.navAccount}</a>
          )}
          <button className="bz-btn bz-btn-primary bz-btn-sm" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{bookLabel}</button>
          <button className="bz-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      <span className="bz-knurl bz-nav-knurl" aria-hidden="true" />
      <AnimatePresence>
        {open && (
          <motion.div className="bz-nav-mobile" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {links.map(({ id, label }) => <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{label}</button>)}
            {data.accountUrl && (
              <a href={data.accountUrl} className="bz-nav-mobile-link">{data.copy?.nav_account ?? s.navAccount}</a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ── Hero (centred column + bezel-framed viewport) ─────────────────────────────

function BzHero({ data }: { data: TemplateData }) {
  const s = bzStrings(data.locale);
  const { hero } = data;
  return (
    <section id={SECTION_IDS.hero} className="bz-hero">
      <div className="bz-wrap bz-hero-copy">
        <Reveal><p className="bz-eyebrow"><span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span></p></Reveal>
        <Reveal delay={0.05}><h1 className="bz-h1" data-edit="hero.headline" data-edit-type="text">{hero.headline}</h1></Reveal>
        <Reveal as="p" className="bz-hero-sub" delay={0.1}><span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span></Reveal>
        <Reveal className="bz-hero-ctas" delay={0.15}>
          <button className="bz-btn bz-btn-primary bz-btn-lg" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{hero.ctaPrimary} <ArrowRight size={16} aria-hidden="true" /></button>
          <button className="bz-btn bz-btn-ghost bz-btn-lg" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>{hero.ctaSecondary}</button>
        </Reveal>
      </div>
      <EnterMount tilt={12} perspective={1200} className="bz-wrap bz-hero-tilt">
        <div className="bz-panel bz-viewport">
          <img src={hero.image} alt={s.heroImageAlt} className="bz-viewport-img" data-edit="hero.image" data-edit-type="image" />
          <span className="bz-viewport-ring" aria-hidden="true" />
        </div>
      </EnterMount>
    </section>
  );
}

// ── Stats (THE GAUGE CLUSTER — the signature) ─────────────────────────────────

/**
 * The dial's full-scale reading: the next "nice" round number at or above the value
 * — 100 for a percentage, 5 for a rating, otherwise 1/2/5/10 × a power of ten.
 * The needle then points at something TRUE (96 on a 0–100 dial, 4.9 on a 0–5), and
 * the four gauges rest at different angles like a real cluster. Scaling against the
 * stat's own value instead would peg every needle at full deflection.
 */
function fullScale(stat: TemplateData['stats'][number]): number {
  if (stat.suffix?.includes('%')) return 100;
  if (!Number.isInteger(stat.value) && stat.value <= 5) return 5;
  const v = Math.max(stat.value, 1);
  const mag = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 5]) if (v <= m * mag) return m * mag;
  return 10 * mag;
}

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value) ? Math.round(n).toLocaleString('en-US') : n.toFixed(1);
  // 240° sweep. useCountUp eases (and returns the FINAL value immediately under
  // reduced motion), so the needle settles like a real instrument — or snaps to
  // its final angle for users who asked for no motion.
  const ratio = Math.max(0, Math.min(1, n / fullScale(stat)));
  const angle = -120 + ratio * 240;
  return (
    <div ref={ref} className="bz-stat" data-edit-item={`stats.${index}`}>
      <div className="bz-dial">
        <span className="bz-dial-face" aria-hidden="true">
          {TICKS.map((t, i) => <span key={i} className={cx('bz-tick', (i === 0 || i === TICKS.length - 1) && 'is-major')} style={{ transform: `rotate(${t}deg)` }} />)}
          <span className="bz-needle" style={{ transform: `rotate(${angle}deg)` }} />
        </span>
        <span className="bz-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{formatted}{stat.suffix}</span>
      </div>
      <span className="bz-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function BzStats({ stats }: { stats: TemplateData['stats'] }) {
  return (
    <section id={SECTION_IDS.stats} className="bz-stats">
      <div className="bz-wrap bz-stats-row">{stats.map((s, i) => <StatItem key={i} stat={s} index={i} />)}</div>
    </section>
  );
}

// ── Why ──────────────────────────────────────────────────────────────────────

const features = (s: BzStrings) => [
  { icon: 'Gauge', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function BzWhy({ data }: { data: TemplateData }) {
  const s = bzStrings(data.locale);
  return (
    <section className="bz-section">
      <div className="bz-wrap">
        <Reveal><p className="bz-eyebrow"><span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? s.whyEyebrowBz}</span></p></Reveal>
        <Reveal delay={0.05}><h2 className="bz-h2" data-edit="copy.whyHeading" data-edit-type="text">{data.copy?.whyHeading ?? s.whyHeadingBz}</h2></Reveal>
        <div className="bz-why-grid">
          {features(s).map((f, i) => (
            <Reveal key={i} delay={i * 0.05} y={18}>
              <div className="bz-panel bz-why">
                <span className="bz-why-icon"><DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={22} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" /></span>
                <h3 className="bz-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">{data.copy?.[f.titleKey] ?? f.title}</h3>
                <p className="bz-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">{data.copy?.[f.bodyKey] ?? f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages (machined panels with a restrained pointer tilt) ──────────────────

function PkgCard({ data, pkg, index }: { data: TemplateData; pkg: TemplateData['packages'][number]; index: number }) {
  const s = bzStrings(data.locale);
  const { labels } = data;
  const coarse = usePointerCoarse();
  const { ref, rotateX, rotateY, onMouseMove, onMouseLeave } = useMouseTilt(6);
  // Hover-only tactile lift: never bind the handlers on touch, so a tap can't
  // leave a card stuck mid-tilt.
  const tilt = coarse ? {} : { ref, onMouseMove, onMouseLeave, style: { rotateX, rotateY, transformPerspective: 1000 } };
  return (
    <motion.div {...tilt} className={cx('bz-panel', 'bz-pkg', pkg.popular && 'is-popular')} data-edit-item={`packages.${index}`}>
      {pkg.popular && <span className="bz-pkg-badge" data-edit={`packages.${index}.badge`} data-edit-type="text">{pkg.badge ?? s.badgePopular}</span>}
      <p className="bz-pkg-name" data-edit={`packages.${index}.name`} data-edit-type="text">{pkg.name}</p>
      <p className="bz-pkg-price">
        <span className="bz-pkg-amount" data-edit={`packages.${index}.price`} data-edit-type="text">₪{pkg.price}</span>
        {pkg.unit && <span className="bz-pkg-unit" data-edit={`packages.${index}.unit`} data-edit-type="text">{pkg.unit}</span>}
      </p>
      <ul className="bz-pkg-features">
        {pkg.features.map((f, fi) => <li key={fi}><Check size={14} className="bz-check" aria-hidden="true" /><span data-edit={`packages.${index}.features.${fi}`} data-edit-type="text">{f}</span></li>)}
      </ul>
      <button className={cx('bz-btn', pkg.popular ? 'bz-btn-primary' : 'bz-btn-ghost', 'bz-btn-block')} data-edit="labels.packageCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
        {pkg.popular ? (labels?.packageCtaPopular ?? labels?.packageCta ?? s.bookThisPlan) : (labels?.packageCta ?? s.packageCta)}
      </button>
    </motion.div>
  );
}

function BzPackages({ data }: { data: TemplateData }) {
  const s = bzStrings(data.locale);
  return (
    <section id={SECTION_IDS.packages} className="bz-section">
      <div className="bz-wrap">
        <Reveal><p className="bz-eyebrow"><span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? s.navPackages}</span></p></Reveal>
        <Reveal delay={0.05}><h2 className="bz-h2" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingBz}</h2></Reveal>
        <Reveal as="p" className="bz-lead" delay={0.1}><span data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubBz}</span></Reveal>
        <div className="bz-pkg-grid">
          {data.packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.05} y={18}><PkgCard data={data} pkg={pkg} index={i} /></Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── About ─────────────────────────────────────────────────────────────────────

function BzAbout({ data }: { data: TemplateData }) {
  const s = bzStrings(data.locale);
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="bz-section">
      <div className="bz-wrap bz-about">
        <Reveal className="bz-about-media" y={18}>
          <div className="bz-panel bz-viewport bz-about-frame">
            <img src={about.image} alt={s.aboutImageAlt} className="bz-viewport-img bz-about-img" data-edit="about.image" data-edit-type="image" />
            <span className="bz-viewport-ring" aria-hidden="true" />
          </div>
          <div className="bz-panel bz-instructor">
            <img src={instructor.photo} alt={instructor.name} className="bz-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div>
              <p className="bz-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p>
              <p className="bz-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
            </div>
          </div>
        </Reveal>
        <div className="bz-about-copy">
          <Reveal><p className="bz-eyebrow"><span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? s.aboutEyebrow}</span></p></Reveal>
          <Reveal delay={0.05}><h2 className="bz-h2 bz-h2-start" data-edit="about.heading" data-edit-type="text">{about.heading}</h2></Reveal>
          {about.body.map((p, i) => <Reveal key={i} as="p" className="bz-body" delay={0.1 + i * 0.05} y={18}><span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span></Reveal>)}
          <Reveal delay={0.2} y={18}>
            <ul className="bz-checklist">
              {about.checklist.map((item, i) => (
                <li key={i} data-edit-item={`about.checklist.${i}`}>
                  <Check size={15} aria-hidden="true" />
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          {instructor.bio && <Reveal as="p" className="bz-body" delay={0.25} y={18}><span data-edit="instructor.bio" data-edit-type="text">{instructor.bio}</span></Reveal>}
          {instructor.credentials.length > 0 && (
            <Reveal delay={0.3} y={18}>
              <div className="bz-creds">
                {instructor.credentials.map((c, i) => (
                  <span key={i} className="bz-cred" data-edit-item={`instructor.credentials.${i}`}>
                    <Check size={13} aria-hidden="true" />
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

// ── Areas (machined mono chips) ───────────────────────────────────────────────

function BzAreas({ data }: { data: TemplateData }) {
  const s = bzStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="bz-section">
      <div className="bz-wrap">
        <Reveal><p className="bz-eyebrow"><span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? s.areasEyebrowBz}</span></p></Reveal>
        <Reveal delay={0.05}><h2 className="bz-h2" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingBz}</h2></Reveal>
        <div className="bz-areas">
          {data.areas.map((area, i) => (
            <Reveal key={i} delay={(i % 4) * 0.05} y={18} as="span" className="bz-area" data-edit-item={`areas.${i}`}>
              <span className="bz-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              {area.note && <span className="bz-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Reviews ───────────────────────────────────────────────────────────────────

function BzReviews({ data }: { data: TemplateData }) {
  const s = bzStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="bz-section">
      <div className="bz-wrap">
        <Reveal><p className="bz-eyebrow"><span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? s.reviewsEyebrow}</span></p></Reveal>
        <Reveal delay={0.05}><h2 className="bz-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingBz}</h2></Reveal>
        <div className="bz-reviews">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.05} y={18} className="bz-panel bz-review" data-edit-item={`reviews.${i}`}>
              <Stars n={r.rating} />
              <blockquote className="bz-review-text">"<span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span>"</blockquote>
              {r.reply && (
                <p className="bz-review-reply">
                  <span className="bz-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                </p>
              )}
              <div className="bz-review-meta">
                {r.avatar && <img src={r.avatar} alt={r.name} className="bz-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                <div>
                  <p className="bz-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                  {r.meta && <p className="bz-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
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

function BzGallery({ data }: { data: TemplateData }) {
  const s = bzStrings(data.locale);
  return (
    <section className="bz-section">
      <div className="bz-wrap">
        <Reveal><p className="bz-eyebrow"><span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? s.galleryEyebrow}</span></p></Reveal>
        <Reveal delay={0.05}><h2 className="bz-h2" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingBz}</h2></Reveal>
        <div className="bz-gallery">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.05} y={18} className="bz-panel bz-gallery-cell" data-edit-item={`gallery.${i}`}>
              <img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ (hairline rows on the case, mono +/−) ─────────────────────────────────

function BzFaq({ data }: { data: TemplateData }) {
  const s = bzStrings(data.locale);
  const [open, setOpen] = useState<number | null>(0);
  const editing = useIsEditing();
  return (
    <section id={SECTION_IDS.faq} className="bz-section">
      <div className="bz-wrap bz-faq-wrap">
        <Reveal><p className="bz-eyebrow"><span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? s.faqEyebrow}</span></p></Reveal>
        <Reveal delay={0.05}><h2 className="bz-h2" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingBz}</h2></Reveal>
        <div className="bz-faq-list">
          {data.faqs.map((faq, i) => {
            const isOpen = editing || open === i;
            return (
              <div key={i} className="bz-faq-item" data-edit-item={`faqs.${i}`}>
                <button className="bz-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span data-edit={`faqs.${i}.q`} data-edit-type="text">{faq.q}</span>
                  <span className="bz-faq-ic" aria-hidden="true">{isOpen ? <Minus size={15} /> : <Plus size={15} />}</span>
                </button>
                <div className={cx('bz-faq-panel', isOpen && 'is-open')}>
                  <div className="bz-faq-panel-in"><p data-edit={`faqs.${i}.a`} data-edit-type="text">{faq.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Book (one large centred bezel panel) ──────────────────────────────────────

function BzBook({ data }: { data: TemplateData }) {
  const s = bzStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="bz-section">
      <Reveal className="bz-wrap" y={18}>
        <div className="bz-panel bz-book">
          <h2 className="bz-h2" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingBz}</h2>
          <p className="bz-lead" data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodyBz}</p>
          <div className="bz-book-ctas">
            {data.bookingUrl ? (
              <a href={data.bookingUrl} className="bz-btn bz-btn-primary bz-btn-lg" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={16} aria-hidden="true" /></a>
            ) : (
              <button type="button" className="bz-btn bz-btn-primary bz-btn-lg" title={s.publishNote} disabled aria-disabled="true" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={16} aria-hidden="true" /></button>
            )}
            {data.enrollUrl && <a href={data.enrollUrl} className="bz-btn bz-btn-ghost bz-btn-lg"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span></a>}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ── Contact / Footer ──────────────────────────────────────────────────────────

function BzContact({ data }: { data: TemplateData }) {
  const s = bzStrings(data.locale);
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="bz-footer">
      <div className="bz-wrap bz-footer-grid">
        <div>
          <p className="bz-eyebrow"><span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeading}</span></p>
          <div className="bz-contact-info">
            <a href={`tel:${contact.phone}`} className="bz-contact-link"><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={15} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span></a>
            <a href={`mailto:${contact.email}`} className="bz-contact-link"><DynamicIcon name={data.icons?.email ?? 'Mail'} size={15} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span></a>
            <span className="bz-contact-link"><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={15} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span></span>
          </div>
          <div className="bz-socials">
            {socials.map((soc, i) => (
              <a key={i} href={soc.url} className="bz-social" target="_blank" rel="noreferrer" aria-label={soc.platform} data-edit-item={`contact.socials.${i}`}>
                <SocialIcon platform={soc.platform} size={17} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="bz-eyebrow"><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabel}</span></p>
          <table className="bz-hours"><tbody>{hours.map((h) => <tr key={h.day} className={h.closed ? 'is-closed' : ''}><td>{h.day}</td><td>{h.closed ? s.closedLabel : `${h.open} – ${h.close}`}</td></tr>)}</tbody></table>
        </div>
      </div>
      <div className="bz-wrap bz-footer-bottom">
        <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
        <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCredit}</span>
      </div>
    </footer>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function Bezel({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts(['https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;600;700&family=Martian+Mono:wght@400;500;600;700&display=swap']);
  const active = useScrollSpy(Object.values(SECTION_IDS));
  return (
    <div className="tmpl-bezel" dir={data.dir} style={data.theme as CSSProperties} data-edit="theme.bg" data-edit-type="background">
      <BzNav data={data} active={active} />
      <main>
        <BzHero data={data} />
        <BzStats stats={data.stats} />
        <BzWhy data={data} />
        {data.packages.length > 0 && <BzPackages data={data} />}
        <BzAbout data={data} />
        <BzAreas data={data} />
        {data.reviews.length > 0 && <BzReviews data={data} />}
        {data.gallery.length > 0 && <BzGallery data={data} />}
        <BzFaq data={data} />
        <BzBook data={data} />
        <BzContact data={data} />
      </main>
    </div>
  );
}

/**
 * Press — a fine LETTERPRESS-printed prospectus. The kind a prestigious old
 * institution runs on heavy cotton paper with a hand-fed press: type DEBOSSED
 * into the page, one or two inks (warm-black + bottle-green), metal-type
 * fleurons, folio numbers, and a copper WAX SEAL. Warm, authoritative,
 * unmistakably crafted and tactile — a physical printed object on screen.
 *
 * The device is the PRESS / IMPRESSION: everything looks pressed INTO the paper,
 * and on scroll each section heading "presses" down (scale 1.05 → 1 + the deboss
 * blooms), while the wax seal STAMPS (scale 1.4 → 1 with a settle). Headings stay
 * real, editable text — the press is applied to a wrapper/class, never replacing
 * the words. Under reduced motion nothing animates: headings render fully
 * debossed and static, the seal is pre-stamped.
 *
 * Libre Caslon Display (letterpress serif — headings / drop caps / prices /
 * numerals) + Libre Franklin (the print-companion gothic — body, small-caps
 * labels, eyebrows, nav). Palette via CSS vars on `.tmpl-press`:
 * --ps-paper / --ps-ink / --ps-accent (bottle green, the ONE accent) /
 * --ps-copper (ornaments & seal only) / --ps-band. Tints derive via color-mix,
 * so Customize recolouring never breaks.
 */
import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useInView } from 'framer-motion';
import { Plus, Minus, Star, Menu, X, ArrowRight, Check } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { psStrings, type PsStrings } from './strings';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, EnterTilt, useCountUp, useIsEditing, reviewReplyLabel,
  usePrefersReducedMotion,
} from '../shared';
import './press.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

// ── Print furniture ──────────────────────────────────────────────────────────

/** Folio number — small-caps "— 02 —" page mark. Decorative; encodes the real
 *  section order, so the numbering is legitimate. */
function Folio({ n }: { n: number }) {
  return <span className="ps-folio" aria-hidden="true">— {String(n).padStart(2, '0')} —</span>;
}

/** A metal-type fleuron ornament (❦). Decorative. */
function Fleuron({ className }: { className?: string }) {
  return <span className={cx('ps-fleuron', className)} aria-hidden="true">❦</span>;
}

/**
 * SIGNATURE (1/2) — the press. Wraps a section heading; on scroll-into-view the
 * wrapper "presses" (scale 1.05 → 1) and the child heading's deboss blooms to
 * full. The heading stays a real editable element — only a class toggles.
 * Reduced motion → pressed immediately, no transition (guarded in CSS).
 */
function Stamp({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -14% 0px' });
  const pressed = reduced || inView;
  return (
    <span ref={ref} className={cx('ps-stamp', pressed && 'is-pressed', className)}>
      {children}
    </span>
  );
}

/**
 * SIGNATURE (2/2) — the wax seal. A circular copper seal embossing the business
 * initial, pressed onto the hero and the Book invitation. On inView it STAMPS
 * (scale 1.4 → 1 with a small rotate settle + impression shadow). Decorative
 * (aria-hidden). Under reduced motion it's simply present, pre-stamped.
 */
function WaxSeal({ data, size = 84 }: { data: TemplateData; size?: number }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -8% 0px' });
  const stamped = reduced || inView;
  const initial = (data.business.logoText || data.business.name || 'M').trim().charAt(0).toUpperCase();
  return (
    <span
      ref={ref}
      className={cx('ps-seal', stamped && 'is-stamped')}
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      <span className="ps-seal-initial">{initial}</span>
    </span>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="ps-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill={i < n ? 'var(--ps-accent)' : 'none'} color={i < n ? 'var(--ps-accent)' : 'var(--ps-line)'} />
      ))}
    </span>
  );
}

// ── Nav (a running header) ─────────────────────────────────────────────────────

const navLinks = (s: PsStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about, label: s.navAbout },
  { id: SECTION_IDS.areas, label: s.navAreas },
  { id: SECTION_IDS.reviews, label: s.navReviews },
  { id: SECTION_IDS.faq, label: s.navFaq },
];

function PsNav({ data, active }: { data: TemplateData; active: string }) {
  const s = psStrings(data.locale);
  const [open, setOpen] = useState(false);
  const links = navLinks(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  return (
    <nav className="ps-nav" aria-label={s.mainNavAria}>
      <div className="ps-nav-inner">
        <button className="ps-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label={s.goToTopAria}>
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={30} bg="var(--ps-ink)" fg="var(--ps-paper)" radius={2} />
          </span>
          <span className="ps-logo-word" data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <div className="ps-nav-links">
          {links.map(({ id, label }) => (
            <button
              key={id}
              className={cx('ps-nav-link', active === id && 'is-active')}
              onClick={() => scrollToSection(id)}
              data-edit={`copy.nav_${id}`}
              data-edit-type="text"
            >
              {data.copy?.[`nav_${id}`] ?? label}
            </button>
          ))}
        </div>
        <div className="ps-nav-end">
          {data.accountUrl && (
            <a href={data.accountUrl} className="ps-btn ps-btn-ghost ps-btn-sm">{data.copy?.nav_account ?? s.navAccount}</a>
          )}
          <button className="ps-btn ps-btn-primary ps-btn-sm" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{bookLabel}</button>
          <button className="ps-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && (
        <div className="ps-nav-mobile">
          {links.map(({ id, label }) => <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{label}</button>)}
          {data.accountUrl && <a href={data.accountUrl} className="ps-nav-mobile-link">{data.copy?.nav_account ?? s.navAccount}</a>}
        </div>
      )}
    </nav>
  );
}

// ── Hero (engraved title + wax seal | tipped-in plate) ─────────────────────────

function PsHero({ data }: { data: TemplateData }) {
  const s = psStrings(data.locale);
  const { hero } = data;
  return (
    <section id={SECTION_IDS.hero} className="ps-section ps-hero">
      <div className="ps-wrap ps-hero-grid">
        <div className="ps-hero-copy">
          <Folio n={1} />
          <Reveal><p className="ps-eyebrow"><span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span></p></Reveal>
          <Stamp><h1 className="ps-h1" data-edit="hero.headline" data-edit-type="text">{hero.headline}</h1></Stamp>
          <div className="ps-seal-row">
            <WaxSeal data={data} size={82} />
            <span className="ps-seal-motto">{s.sealMotto}</span>
          </div>
          <Reveal as="p" className="ps-hero-sub" delay={0.12}><span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span></Reveal>
          <Reveal className="ps-hero-ctas" delay={0.18}>
            <button className="ps-btn ps-btn-primary" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{hero.ctaPrimary} <ArrowRight size={15} aria-hidden="true" /></button>
            <button className="ps-btn ps-btn-ghost" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>{hero.ctaSecondary}</button>
          </Reveal>
        </div>
        <div className="ps-hero-media">
          <EnterTilt maxTilt={8} perspective={1500}>
            <figure className="ps-figure">
              <div className="ps-plate ps-plate-tilt">
                <img src={hero.image} alt={s.heroImageAlt} className="ps-plate-img" data-edit="hero.image" data-edit-type="image" />
              </div>
              <figcaption className="ps-caption">{s.heroCaption}</figcaption>
            </figure>
          </EnterTilt>
        </div>
      </div>
    </section>
  );
}

// ── Stats (Caslon numerals over a copper hairline) ─────────────────────────────

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value) ? Math.round(n).toLocaleString('en-US') : n.toFixed(1);
  return (
    <div ref={ref} className="ps-stat" data-edit-item={`stats.${index}`}>
      <span className="ps-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{formatted}{stat.suffix}</span>
      <span className="ps-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function PsStats({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.stats} className="ps-stats">
      <div className="ps-wrap ps-stats-row">{data.stats.map((st, i) => <StatItem key={i} stat={st} index={i} />)}</div>
    </section>
  );
}

// ── Why (the imprint) ──────────────────────────────────────────────────────────

const features = (s: PsStrings) => [
  { icon: 'Feather', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function PsWhy({ data }: { data: TemplateData }) {
  const s = psStrings(data.locale);
  return (
    <section className="ps-section ps-band">
      <div className="ps-wrap">
        <div className="ps-head">
          <Folio n={3} />
          <Reveal><p className="ps-eyebrow"><span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? s.whyEyebrowPs}</span></p></Reveal>
          <Stamp><h2 className="ps-h2" data-edit="copy.whyHeading" data-edit-type="text">{data.copy?.whyHeading ?? s.whyHeadingPs}</h2></Stamp>
        </div>
        <Fleuron className="ps-fleuron-rule" />
        <div className="ps-why-grid">
          {features(s).map((f, i) => (
            <Reveal key={i} delay={i * 0.06} className="ps-why">
              <span className="ps-why-icon"><DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={20} strokeWidth={1.5} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" /></span>
              <h3 className="ps-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">{data.copy?.[f.titleKey] ?? f.title}</h3>
              <p className="ps-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">{data.copy?.[f.bodyKey] ?? f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages (paper cards; popular gets a wax seal) ────────────────────────────

function PsPackages({ data }: { data: TemplateData }) {
  const s = psStrings(data.locale);
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="ps-section">
      <div className="ps-wrap">
        <div className="ps-head">
          <Folio n={4} />
          <Reveal><p className="ps-eyebrow"><span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? s.packagesEyebrow}</span></p></Reveal>
          <Stamp><h2 className="ps-h2" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingPs}</h2></Stamp>
          <Reveal as="p" className="ps-lead" delay={0.12}><span data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubPs}</span></Reveal>
        </div>
        <div className="ps-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.06} data-edit-item={`packages.${i}`}>
              <div className={cx('ps-pkg', pkg.popular && 'is-popular')}>
                {pkg.popular && (
                  <span className="ps-pkg-seal">
                    <WaxSeal data={data} size={46} />
                    <span className="ps-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge ?? s.badgePopular}</span>
                  </span>
                )}
                <p className="ps-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                <p className="ps-pkg-price">
                  <span className="ps-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">₪{pkg.price}</span>
                  {pkg.unit && <span className="ps-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                </p>
                <ul className="ps-pkg-features">
                  {pkg.features.map((f, fi) => (
                    <li key={fi}><Check size={14} className="ps-check" aria-hidden="true" /><span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span></li>
                  ))}
                </ul>
                <button className={cx('ps-btn', pkg.popular ? 'ps-btn-primary' : 'ps-btn-ghost', 'ps-btn-block')} data-edit="labels.packageCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
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

// ── About (drop cap opens the first paragraph) ─────────────────────────────────

function PsAbout({ data }: { data: TemplateData }) {
  const s = psStrings(data.locale);
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="ps-section">
      <div className="ps-wrap ps-about">
        <div className="ps-about-media">
          <Reveal y={26}>
            <figure className="ps-figure">
              <div className="ps-plate">
                <img src={about.image} alt={s.aboutImageAlt} className="ps-plate-img ps-about-img" data-edit="about.image" data-edit-type="image" />
              </div>
            </figure>
          </Reveal>
          <Reveal delay={0.1} className="ps-instructor">
            <img src={instructor.photo} alt={instructor.name} className="ps-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div className="ps-instructor-id">
              <p className="ps-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p>
              <p className="ps-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
            </div>
          </Reveal>
        </div>
        <div className="ps-about-copy">
          <Folio n={5} />
          <Reveal><p className="ps-eyebrow"><span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? s.aboutEyebrow}</span></p></Reveal>
          <Stamp><h2 className="ps-h2 ps-h2-tight" data-edit="about.heading" data-edit-type="text">{about.heading}</h2></Stamp>
          {about.body.map((p, i) => (
            <Reveal key={i} as="p" className={cx('ps-body', i === 0 && 'ps-dropcap')} delay={0.1 + i * 0.06}><span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span></Reveal>
          ))}
          <Reveal delay={0.22}>
            <ul className="ps-checklist">
              {about.checklist.map((item, i) => (
                <li key={i} data-edit-item={`about.checklist.${i}`}>
                  <Check size={15} strokeWidth={2} className="ps-check" aria-hidden="true" />
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          {instructor.bio && <Reveal as="p" className="ps-body" delay={0.26}><span data-edit="instructor.bio" data-edit-type="text">{instructor.bio}</span></Reveal>}
          {instructor.credentials.length > 0 && (
            <Reveal delay={0.3}>
              <div className="ps-creds">
                {instructor.credentials.map((c, i) => (
                  <span key={i} className="ps-cred" data-edit-item={`instructor.credentials.${i}`}>
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

// ── Areas (a two-column ruled index with copper leaders) ───────────────────────

function PsAreas({ data }: { data: TemplateData }) {
  const s = psStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="ps-section ps-band">
      <div className="ps-wrap">
        <div className="ps-head">
          <Folio n={6} />
          <Reveal><p className="ps-eyebrow"><span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? s.areasEyebrowPs}</span></p></Reveal>
          <Stamp><h2 className="ps-h2" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingPs}</h2></Stamp>
        </div>
        <ul className="ps-areas">
          {data.areas.map((area, i) => (
            <Reveal key={i} as="li" delay={(i % 4) * 0.04} className="ps-area" data-edit-item={`areas.${i}`}>
              <span className="ps-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              <span className="ps-leader" aria-hidden="true" />
              {area.note && <span className="ps-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Reviews (pull-quote cards, copper quote mark) ──────────────────────────────

function PsReviews({ data }: { data: TemplateData }) {
  const s = psStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="ps-section">
      <div className="ps-wrap">
        <div className="ps-head">
          <Folio n={7} />
          <Reveal><p className="ps-eyebrow"><span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? s.reviewsEyebrow}</span></p></Reveal>
          <Stamp><h2 className="ps-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingPs}</h2></Stamp>
        </div>
        <div className="ps-reviews">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06} className="ps-review" data-edit-item={`reviews.${i}`}>
              <span className="ps-quote-mark" aria-hidden="true">“</span>
              <Stars n={r.rating} />
              <blockquote className="ps-review-text"><span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span></blockquote>
              {r.reply && (
                <p className="ps-review-reply">
                  <span className="ps-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                </p>
              )}
              <div className="ps-review-meta">
                {r.avatar && <img src={r.avatar} alt={r.name} className="ps-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                <div>
                  <p className="ps-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                  {r.meta && <p className="ps-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery (tipped-in plates) ─────────────────────────────────────────────────

function PsGallery({ data }: { data: TemplateData }) {
  const s = psStrings(data.locale);
  return (
    <section className="ps-section">
      <div className="ps-wrap">
        <div className="ps-head">
          <Folio n={8} />
          <Reveal><p className="ps-eyebrow"><span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? s.galleryEyebrow}</span></p></Reveal>
          <Stamp><h2 className="ps-h2" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingPs}</h2></Stamp>
        </div>
        <div className="ps-gallery">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06} className="ps-gallery-cell" data-edit-item={`gallery.${i}`}>
              <img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ (ruled rows) ───────────────────────────────────────────────────────────

function PsFaq({ data }: { data: TemplateData }) {
  const s = psStrings(data.locale);
  const [open, setOpen] = useState<number | null>(0);
  const editing = useIsEditing();
  return (
    <section id={SECTION_IDS.faq} className="ps-section ps-band">
      <div className="ps-wrap ps-faq-wrap">
        <div className="ps-head">
          <Folio n={9} />
          <Reveal><p className="ps-eyebrow"><span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? s.faqEyebrow}</span></p></Reveal>
          <Stamp><h2 className="ps-h2" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingPs}</h2></Stamp>
        </div>
        <div className="ps-faq-list">
          {data.faqs.map((faq, i) => {
            const isOpen = editing || open === i;
            return (
              <div key={i} className="ps-faq-item" data-edit-item={`faqs.${i}`}>
                <button className="ps-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span data-edit={`faqs.${i}.q`} data-edit-type="text">{faq.q}</span>
                  <span className="ps-faq-ic" aria-hidden="true">{isOpen ? <Minus size={15} /> : <Plus size={15} />}</span>
                </button>
                <div className={cx('ps-faq-panel', isOpen && 'is-open')}>
                  <div className="ps-faq-panel-in"><p data-edit={`faqs.${i}.a`} data-edit-type="text">{faq.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Book (the formal invitation, strongest impression) ─────────────────────────

function PsBook({ data }: { data: TemplateData }) {
  const s = psStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="ps-section">
      <div className="ps-wrap">
        <Reveal className="ps-book">
          <Folio n={10} />
          <WaxSeal data={data} size={92} />
          <Stamp><h2 className="ps-h2" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingPs}</h2></Stamp>
          <p className="ps-lead" data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodyPs}</p>
          <div className="ps-book-ctas">
            {data.bookingUrl ? (
              <a href={data.bookingUrl} className="ps-btn ps-btn-primary" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></a>
            ) : (
              <button type="button" className="ps-btn ps-btn-primary" title={s.publishNote} disabled aria-disabled="true" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></button>
            )}
            {data.enrollUrl && <a href={data.enrollUrl} className="ps-btn ps-btn-ghost"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span></a>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer ───────────────────────────────────────────────────────────

function PsContact({ data }: { data: TemplateData }) {
  const s = psStrings(data.locale);
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="ps-footer">
      <div className="ps-wrap ps-footer-grid">
        <div>
          <p className="ps-eyebrow"><span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeading}</span></p>
          <div className="ps-contact-info">
            <a href={`tel:${contact.phone}`} className="ps-contact-link"><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span></a>
            <a href={`mailto:${contact.email}`} className="ps-contact-link"><DynamicIcon name={data.icons?.email ?? 'Mail'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span></a>
            <span className="ps-contact-link"><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span></span>
          </div>
          <div className="ps-socials">
            {socials.map((so, i) => (
              <a key={i} href={so.url} className="ps-social" target="_blank" rel="noreferrer" aria-label={so.platform} data-edit-item={`contact.socials.${i}`}>
                <SocialIcon platform={so.platform} size={16} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="ps-eyebrow"><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabel}</span></p>
          <table className="ps-hours">
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
      <div className="ps-wrap ps-footer-bottom">
        <Fleuron />
        <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
        <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCredit}</span>
      </div>
    </footer>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────

export default function Press({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts(['https://fonts.googleapis.com/css2?family=Libre+Caslon+Display&family=Libre+Franklin:wght@400;500;600;700&display=swap']);
  const active = useScrollSpy(Object.values(SECTION_IDS));
  return (
    <div className="tmpl-press" dir={data.dir} style={data.theme as CSSProperties} data-edit="theme.bg" data-edit-type="background">
      <PsNav data={data} active={active} />
      <main>
        <PsHero data={data} />
        <PsStats data={data} />
        <PsWhy data={data} />
        {data.packages.length > 0 && <PsPackages data={data} />}
        <PsAbout data={data} />
        <PsAreas data={data} />
        {data.reviews.length > 0 && <PsReviews data={data} />}
        {data.gallery.length > 0 && <PsGallery data={data} />}
        <PsFaq data={data} />
        <PsBook data={data} />
        <PsContact data={data} />
      </main>
    </div>
  );
}

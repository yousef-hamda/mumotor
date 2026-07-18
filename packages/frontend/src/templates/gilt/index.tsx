/**
 * Gilt — a foil-stamped invitation from a prestige marque. Deep charcoal, warm
 * cream type, and CHAMPAGNE-GOLD FOIL that catches the light: restrained, elegant,
 * expensive (a fine hotel card / a luxury watch brochure). Gold is used sparingly
 * and preciously — mostly quiet dark, with the metal reserved for the few precious
 * moments (the hero + book headlines, the wordmark, big numerals, the seal, CTAs,
 * links, active state, hairlines).
 *
 * SIGNATURE — THE FOIL GLEAM: the big Marcellus headlines + the wordmark are
 * stamped in a champagne-gold gradient clipped to the text, with a highlight that
 * RAKES across them like light catching foil — an ambient CSS keyframe loop on
 * every `.gt-foil`, plus the HERO headline is scroll-linked via a `--gt-sheen`
 * CSS var written from `useScroll`. CRITICAL: a solid `color: var(--gt-gold)`
 * fallback is set FIRST and the clip only applies under `@supports`, so the
 * headline is NEVER invisible. Non-foil body headings stay solid `--gt-ink` for
 * legibility. Under reduced motion nothing animates (still gradient / static).
 *
 * Marcellus (classical Roman serif — display / big numerals / the foil headline)
 * + Outfit (refined geometric sans — body, small-caps labels, nav, hours).
 * Palette via CSS vars on `.tmpl-gilt`: --gt-charcoal / --gt-panel / --gt-ink /
 * --gt-gold (the ONE accent) / --gt-bronze (secondary, foil shadow) — the first
 * five are user-recolourable; --gt-muted / --gt-line are internal. Tints derive
 * with color-mix() so Customize recolouring never breaks.
 */
import { useRef, useState, type CSSProperties } from 'react';
import { useInView, useScroll, useMotionValueEvent } from 'framer-motion';
import { Plus, Minus, Star, Menu, X, ArrowRight, Check } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { gtStrings, type GtStrings } from './strings';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, EnterMount, useCountUp, useIsEditing, reviewReplyLabel,
  usePrefersReducedMotion,
} from '../shared';
import './gilt.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

// ── Foil furniture ─────────────────────────────────────────────────────────────

/** A thin gold-foil hairline rule. Decorative. */
function GtRule({ className }: { className?: string }) {
  return <span className={cx('gt-rule', className)} aria-hidden="true" />;
}

/**
 * A small foil monogram seal — a circular gold disc embossing the business
 * initial, pressed onto the hero and the Book invitation. Decorative (aria-hidden).
 */
function GtSeal({ data, size = 78 }: { data: TemplateData; size?: number }) {
  const initial = (data.business.logoText || data.business.name || 'M').trim().charAt(0).toUpperCase();
  return (
    <span className="gt-seal" aria-hidden="true" style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}>
      <span className="gt-seal-initial">{initial}</span>
    </span>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="gt-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill={i < n ? 'var(--gt-gold)' : 'none'} color={i < n ? 'var(--gt-gold)' : 'var(--gt-bronze)'} />
      ))}
    </span>
  );
}

// ── Nav (a sticky invitation header) ────────────────────────────────────────────

const navLinks = (s: GtStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about, label: s.navAbout },
  { id: SECTION_IDS.areas, label: s.navAreas },
  { id: SECTION_IDS.reviews, label: s.navReviews },
  { id: SECTION_IDS.faq, label: s.navFaq },
];

function GtNav({ data, active }: { data: TemplateData; active: string }) {
  const s = gtStrings(data.locale);
  const [open, setOpen] = useState(false);
  const links = navLinks(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  return (
    <nav className="gt-nav" aria-label={s.mainNavAria}>
      <div className="gt-nav-inner">
        <button className="gt-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label={s.goToTopAria}>
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={30} bg="var(--gt-gold)" fg="var(--gt-charcoal)" radius={6} />
          </span>
          <span className="gt-logo-word gt-foil" data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <div className="gt-nav-links">
          {links.map(({ id, label }) => (
            <button
              key={id}
              className={cx('gt-nav-link', active === id && 'is-active')}
              onClick={() => scrollToSection(id)}
              data-edit={`copy.nav_${id}`}
              data-edit-type="text"
            >
              {data.copy?.[`nav_${id}`] ?? label}
            </button>
          ))}
        </div>
        <div className="gt-nav-end">
          {data.accountUrl && (
            <a href={data.accountUrl} className="gt-btn gt-btn-ghost gt-btn-sm">{data.copy?.nav_account ?? s.navAccount}</a>
          )}
          <button className="gt-btn gt-btn-primary gt-btn-sm" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{bookLabel}</button>
          <button className="gt-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && (
        <div className="gt-nav-mobile">
          {links.map(({ id, label }) => <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{label}</button>)}
          {data.accountUrl && <a href={data.accountUrl} className="gt-nav-mobile-link">{data.copy?.nav_account ?? s.navAccount}</a>}
        </div>
      )}
    </nav>
  );
}

// ── Hero (foil headline + CTAs | large framed plate) ─────────────────────────────

function GtHero({ data }: { data: TemplateData }) {
  const s = gtStrings(data.locale);
  const { hero } = data;
  return (
    <section id={SECTION_IDS.hero} className="gt-hero">
      <div className="gt-wrap gt-hero-grid">
        <div className="gt-hero-copy">
          <Reveal><p className="gt-eyebrow"><span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h1 className="gt-h1 gt-foil gt-foil-scroll" data-edit="hero.headline" data-edit-type="text">{hero.headline}</h1></Reveal>
          <Reveal as="p" className="gt-hero-sub" delay={0.12}><span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span></Reveal>
          <div className="gt-seal-row">
            <GtSeal data={data} size={72} />
            <span className="gt-seal-motto">{s.sealMotto}</span>
          </div>
          <Reveal className="gt-hero-ctas" delay={0.2}>
            <button className="gt-btn gt-btn-primary" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{hero.ctaPrimary} <ArrowRight size={15} aria-hidden="true" /></button>
            <button className="gt-btn gt-btn-ghost" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>{hero.ctaSecondary}</button>
          </Reveal>
        </div>
        <div className="gt-hero-media">
          <EnterMount tilt={7} perspective={1500}>
            <figure className="gt-figure">
              <div className="gt-plate">
                <img src={hero.image} alt={s.heroImageAlt} className="gt-plate-img" data-edit="hero.image" data-edit-type="image" />
              </div>
              <figcaption className="gt-caption">{s.heroCaption}</figcaption>
            </figure>
          </EnterMount>
        </div>
      </div>
    </section>
  );
}

// ── Stats (big foil numerals under a gold hairline) ──────────────────────────────

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value) ? Math.round(n).toLocaleString('en-US') : n.toFixed(1);
  return (
    <div ref={ref} className="gt-stat" data-edit-item={`stats.${index}`}>
      <span className="gt-stat-num gt-foil" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{formatted}{stat.suffix}</span>
      <span className="gt-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function GtStats({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.stats} className="gt-stats">
      <div className="gt-wrap gt-stats-row">{data.stats.map((st, i) => <StatItem key={i} stat={st} index={i} />)}</div>
    </section>
  );
}

// ── Why (the hallmark) ───────────────────────────────────────────────────────────

const features = (s: GtStrings) => [
  { icon: 'Gem', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function GtWhy({ data }: { data: TemplateData }) {
  const s = gtStrings(data.locale);
  return (
    <section className="gt-section">
      <div className="gt-wrap">
        <Reveal><p className="gt-eyebrow"><span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? s.whyEyebrowGt}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="gt-h2" data-edit="copy.whyHeading" data-edit-type="text">{data.copy?.whyHeading ?? s.whyHeadingGt}</h2></Reveal>
        <GtRule className="gt-rule-head" />
        <div className="gt-why-grid">
          {features(s).map((f, i) => (
            <Reveal key={i} delay={i * 0.06} className="gt-why">
              <span className="gt-why-icon"><DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={20} strokeWidth={1.5} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" /></span>
              <h3 className="gt-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">{data.copy?.[f.titleKey] ?? f.title}</h3>
              <p className="gt-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">{data.copy?.[f.bodyKey] ?? f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages (charcoal panels; popular gets a gold foil frame) ───────────────────

function GtPackages({ data }: { data: TemplateData }) {
  const s = gtStrings(data.locale);
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="gt-section">
      <div className="gt-wrap">
        <Reveal><p className="gt-eyebrow"><span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? s.packagesEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="gt-h2" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingGt}</h2></Reveal>
        <Reveal as="p" className="gt-lead" delay={0.12}><span data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubGt}</span></Reveal>
        <div className="gt-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.06} data-edit-item={`packages.${i}`}>
              <div className={cx('gt-pkg', pkg.popular && 'is-popular')}>
                {pkg.popular && <span className="gt-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge ?? s.badgePopular}</span>}
                <p className="gt-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                <p className="gt-pkg-price">
                  <span className="gt-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">₪{pkg.price}</span>
                  {pkg.unit && <span className="gt-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                </p>
                <ul className="gt-pkg-features">
                  {pkg.features.map((f, fi) => (
                    <li key={fi}><Check size={14} className="gt-check" aria-hidden="true" /><span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span></li>
                  ))}
                </ul>
                <button className={cx('gt-btn', pkg.popular ? 'gt-btn-primary' : 'gt-btn-ghost', 'gt-btn-block')} data-edit="labels.packageCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
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

// ── About ────────────────────────────────────────────────────────────────────────

function GtAbout({ data }: { data: TemplateData }) {
  const s = gtStrings(data.locale);
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="gt-section">
      <div className="gt-wrap gt-about">
        <div className="gt-about-media">
          <Reveal y={26}>
            <figure className="gt-figure">
              <div className="gt-plate">
                <img src={about.image} alt={s.aboutImageAlt} className="gt-plate-img gt-about-img" data-edit="about.image" data-edit-type="image" />
              </div>
            </figure>
          </Reveal>
          <Reveal delay={0.1} className="gt-instructor">
            <img src={instructor.photo} alt={instructor.name} className="gt-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div className="gt-instructor-id">
              <p className="gt-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p>
              <p className="gt-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
            </div>
          </Reveal>
        </div>
        <div className="gt-about-copy">
          <Reveal><p className="gt-eyebrow"><span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? s.aboutEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="gt-h2 gt-h2-tight" data-edit="about.heading" data-edit-type="text">{about.heading}</h2></Reveal>
          {about.body.map((p, i) => (
            <Reveal key={i} as="p" className="gt-body" delay={0.1 + i * 0.06}><span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span></Reveal>
          ))}
          <Reveal delay={0.22}>
            <ul className="gt-checklist">
              {about.checklist.map((item, i) => (
                <li key={i} data-edit-item={`about.checklist.${i}`}>
                  <Check size={15} strokeWidth={2} className="gt-check" aria-hidden="true" />
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          {instructor.bio && <Reveal as="p" className="gt-body" delay={0.26}><span data-edit="instructor.bio" data-edit-type="text">{instructor.bio}</span></Reveal>}
          {instructor.credentials.length > 0 && (
            <Reveal delay={0.3}>
              <div className="gt-creds">
                {instructor.credentials.map((c, i) => (
                  <span key={i} className="gt-cred" data-edit-item={`instructor.credentials.${i}`}>
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

// ── Areas (small-caps gold-marker list) ──────────────────────────────────────────

function GtAreas({ data }: { data: TemplateData }) {
  const s = gtStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="gt-section">
      <div className="gt-wrap">
        <Reveal><p className="gt-eyebrow"><span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? s.areasEyebrowGt}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="gt-h2" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingGt}</h2></Reveal>
        <ul className="gt-areas">
          {data.areas.map((area, i) => (
            <Reveal key={i} as="li" delay={(i % 4) * 0.04} className="gt-area" data-edit-item={`areas.${i}`}>
              <span className="gt-area-marker" aria-hidden="true" />
              <span className="gt-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              {area.note && <span className="gt-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Reviews (charcoal panels, Marcellus-italic quote, gold quote mark) ───────────

function GtReviews({ data }: { data: TemplateData }) {
  const s = gtStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="gt-section">
      <div className="gt-wrap">
        <Reveal><p className="gt-eyebrow"><span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? s.reviewsEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="gt-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingGt}</h2></Reveal>
        <div className="gt-reviews">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06} className="gt-review" data-edit-item={`reviews.${i}`}>
              <span className="gt-quote-mark" aria-hidden="true">“</span>
              <Stars n={r.rating} />
              <blockquote className="gt-review-text"><span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span></blockquote>
              {r.reply && (
                <p className="gt-review-reply">
                  <span className="gt-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                </p>
              )}
              <div className="gt-review-meta">
                {r.avatar && <img src={r.avatar} alt={r.name} className="gt-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                <div>
                  <p className="gt-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                  {r.meta && <p className="gt-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery (framed plates) ──────────────────────────────────────────────────────

function GtGallery({ data }: { data: TemplateData }) {
  const s = gtStrings(data.locale);
  return (
    <section className="gt-section">
      <div className="gt-wrap">
        <Reveal><p className="gt-eyebrow"><span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? s.galleryEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="gt-h2" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingGt}</h2></Reveal>
        <div className="gt-gallery">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06} className="gt-gallery-cell" data-edit-item={`gallery.${i}`}>
              <img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ (gold-hairline rows, gold +/−) ───────────────────────────────────────────

function GtFaq({ data }: { data: TemplateData }) {
  const s = gtStrings(data.locale);
  const [open, setOpen] = useState<number | null>(0);
  const editing = useIsEditing();
  return (
    <section id={SECTION_IDS.faq} className="gt-section">
      <div className="gt-wrap gt-faq-wrap">
        <Reveal><p className="gt-eyebrow"><span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? s.faqEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="gt-h2" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingGt}</h2></Reveal>
        <div className="gt-faq-list">
          {data.faqs.map((faq, i) => {
            const isOpen = editing || open === i;
            return (
              <div key={i} className="gt-faq-item" data-edit-item={`faqs.${i}`}>
                <button className="gt-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span data-edit={`faqs.${i}.q`} data-edit-type="text">{faq.q}</span>
                  <span className="gt-faq-ic" aria-hidden="true">{isOpen ? <Minus size={15} /> : <Plus size={15} />}</span>
                </button>
                <div className={cx('gt-faq-panel', isOpen && 'is-open')}>
                  <div className="gt-faq-panel-in"><p data-edit={`faqs.${i}.a`} data-edit-type="text">{faq.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Book (the full-bleed foil invitation — the strongest gold moment) ────────────

function GtBook({ data }: { data: TemplateData }) {
  const s = gtStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="gt-book">
      <div className="gt-wrap">
        <Reveal className="gt-book-inner">
          <GtSeal data={data} size={88} />
          <h2 className="gt-h2 gt-book-h gt-foil" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingGt}</h2>
          <GtRule className="gt-rule-book" />
          <p className="gt-lead" data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodyGt}</p>
          <div className="gt-book-ctas">
            {data.bookingUrl ? (
              <a href={data.bookingUrl} className="gt-btn gt-btn-primary" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></a>
            ) : (
              <button type="button" className="gt-btn gt-btn-primary" title={s.publishNote} disabled aria-disabled="true" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></button>
            )}
            {data.enrollUrl && <a href={data.enrollUrl} className="gt-btn gt-btn-ghost"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span></a>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer ─────────────────────────────────────────────────────────────

function GtContact({ data }: { data: TemplateData }) {
  const s = gtStrings(data.locale);
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="gt-footer">
      <div className="gt-wrap gt-footer-grid">
        <div>
          <p className="gt-eyebrow"><span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeading}</span></p>
          <div className="gt-contact-info">
            <a href={`tel:${contact.phone}`} className="gt-contact-link"><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span></a>
            <a href={`mailto:${contact.email}`} className="gt-contact-link"><DynamicIcon name={data.icons?.email ?? 'Mail'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span></a>
            <span className="gt-contact-link"><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span></span>
          </div>
          <div className="gt-socials">
            {socials.map((so, i) => (
              <a key={i} href={so.url} className="gt-social" target="_blank" rel="noreferrer" aria-label={so.platform} data-edit-item={`contact.socials.${i}`}>
                <SocialIcon platform={so.platform} size={16} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="gt-eyebrow"><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabel}</span></p>
          <table className="gt-hours">
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
      <div className="gt-wrap gt-footer-bottom">
        <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
        <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCredit}</span>
      </div>
    </footer>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────

export default function Gilt({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts(['https://fonts.googleapis.com/css2?family=Marcellus&family=Outfit:wght@300;400;500;600;700&display=swap']);
  const active = useScrollSpy(Object.values(SECTION_IDS));
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const rafRef = useRef(0);
  // SIGNATURE (scroll sheen) — drive the hero foil headline's gleam as you scroll,
  // like light raking across foil. Works in the window AND the builder's inner
  // scroll container. Written to a `--gt-sheen` CSS var in ONE coalesced rAF.
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ['start start', 'end end'] });
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (reduced) return; // reduced motion → no scroll sheen (still gradient)
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      rootRef.current?.style.setProperty('--gt-sheen', String(v));
    });
  });

  return (
    <div ref={rootRef} className="tmpl-gilt" dir={data.dir} style={data.theme as CSSProperties} data-edit="theme.bg" data-edit-type="background">
      <GtNav data={data} active={active} />
      <main>
        <GtHero data={data} />
        <GtStats data={data} />
        <GtWhy data={data} />
        {data.packages.length > 0 && <GtPackages data={data} />}
        <GtAbout data={data} />
        <GtAreas data={data} />
        {data.reviews.length > 0 && <GtReviews data={data} />}
        {data.gallery.length > 0 && <GtGallery data={data} />}
        <GtFaq data={data} />
        <GtBook data={data} />
        <GtContact data={data} />
      </main>
    </div>
  );
}

/**
 * Cadence — kinetic editorial typography. Confidence has a rhythm.
 *
 * A loud, type-first, Swiss-poster-disciplined site where TYPOGRAPHY IS THE
 * DESIGN: oversized variable-weight Roboto Flex that reacts to how you scroll.
 * Not calm Apple-minimal (mumotor), not a static Swiss grid (grid-ink) — the
 * words move. No glass, no gradients, no photography-led hero.
 *
 * SIGNATURE — two coupled scroll-velocity effects:
 *  1. Velocity-reactive headings — the smoothed scroll velocity drives three CSS
 *     vars on the root (--cd-wght / --cd-slnt / --cd-skew, one coalesced write per
 *     frame) that the headings read via `font-variation-settings` + `skewY`. The
 *     headings stay real, selectable, Customize-editable `<h1>/<h2>` elements —
 *     nothing is wrapped in a motion component that would break contentEditable.
 *  2. A reversing marquee band — a horizontal strip of mono phrases that auto-
 *     drifts and REVERSES with scroll direction (velocity sign, layout-agnostic).
 *  Both are fully disabled under reduced motion (no listeners registered): the
 *  headings render at a fixed heavy weight with 0 skew and the marquee is a
 *  single static row.
 *
 * Utility type: Red Hat Mono (eyebrows / nav / stats / prices / labels / marquee).
 * Palette via CSS vars on `.tmpl-cadence`: --cd-paper / --cd-ink / --cd-accent
 * (electric ultramarine, used BIG) / --cd-band / --cd-muted — every tint derives
 * with color-mix() so Customize recolouring never breaks.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  motion, useInView, useScroll, useVelocity, useSpring, useMotionValueEvent,
} from 'framer-motion';
import { Plus, Minus, Star, Menu, X, ArrowRight, Check } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { cdStrings, type CdStrings } from './strings';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, EnterMount, useCountUp, useIsEditing, reviewReplyLabel,
  usePrefersReducedMotion,
} from '../shared';
import './cadence.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

function Stars({ n }: { n: number }) {
  return (
    <span className="cd-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={15} fill={i < n ? 'var(--cd-accent)' : 'none'} color={i < n ? 'var(--cd-accent)' : 'var(--cd-line)'} />
      ))}
    </span>
  );
}

/**
 * Clip-wipe reveal (top→down, direction-neutral so it's RTL-safe). Settles to a
 * negatively-inset clip so it never crops the headings' kinetic `skewY`. No-op
 * under reduced motion. Wraps headings without touching their editability.
 */
// A heading reveal. Delegates to the shared `Reveal` (ref-driven useInView, proven
// across the other templates) — the earlier hand-rolled clip-path `whileInView`
// intermittently never fired, leaving headings clipped to nothing.
function Wipe({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return <Reveal className={className} delay={delay} y={26}>{children}</Reveal>;
}

// ── Nav ─────────────────────────────────────────────────────────────────────

const navLinks = (s: CdStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about, label: s.navAbout },
  { id: SECTION_IDS.areas, label: s.navAreas },
  { id: SECTION_IDS.reviews, label: s.navReviews },
  { id: SECTION_IDS.faq, label: s.navFaq },
];

function CdNav({ data, active }: { data: TemplateData; active: string }) {
  const s = cdStrings(data.locale);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const links = navLinks(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  // The link currently "lit" — hover takes over from scroll-spy, falls back to it.
  const current = hovered ?? active;
  const linkRefs = useRef(new Map<string, HTMLButtonElement>());
  const [ink, setInk] = useState({ x: 0, w: 0, on: false });

  // Kinetic sliding ink bar: measures the current link's real laid-out box (works
  // unmodified under RTL — offsetLeft/offsetWidth are already physical values).
  // Link width never shifts under the hover/active weight morph (see .cd-nav-link
  // ::before ghost in cadence.css), so this measurement is stable, not a feedback loop.
  useEffect(() => {
    const sync = () => {
      const el = linkRefs.current.get(current);
      if (el) setInk({ x: el.offsetLeft, w: el.offsetWidth, on: true });
      else setInk((v) => ({ ...v, on: false }));
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [current, links.length, data.locale]);

  return (
    <nav className="cd-nav" aria-label={s.mainNavAria}>
      <div className="cd-nav-inner">
        <button className="cd-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label={s.goToTopAria}>
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={28} bg="var(--cd-accent)" fg="var(--cd-onaccent)" radius={2} />
          </span>
          <span data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <div className="cd-nav-links" onMouseLeave={() => setHovered(null)}>
          <span
            className="cd-nav-ink"
            aria-hidden="true"
            style={{ transform: `translateX(${ink.x}px)`, width: `${ink.w}px`, opacity: ink.on ? 1 : 0 }}
          />
          {links.map(({ id, label }) => {
            const text = data.copy?.[`nav_${id}`] ?? label;
            return (
              <button
                key={id}
                ref={(el) => { if (el) linkRefs.current.set(id, el); else linkRefs.current.delete(id); }}
                className={cx('cd-nav-link', active === id && 'is-active')}
                data-label={text}
                onClick={() => scrollToSection(id)}
                onMouseEnter={() => setHovered(id)}
                onFocus={() => setHovered(id)}
                onBlur={() => setHovered(null)}
              >
                <span data-edit={`copy.nav_${id}`} data-edit-type="text">{text}</span>
              </button>
            );
          })}
        </div>
        <div className="cd-nav-end">
          {data.accountUrl && (
            <a href={data.accountUrl} className="cd-btn cd-btn-ghost cd-btn-sm">{data.copy?.nav_account ?? s.navAccount}</a>
          )}
          <button className="cd-btn cd-btn-primary cd-btn-sm" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{bookLabel}</button>
          <button className="cd-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && (
        <div className="cd-nav-mobile">
          {links.map(({ id, label }) => <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{label}</button>)}
          {data.accountUrl && <a href={data.accountUrl} className="cd-nav-mobile-link">{data.copy?.nav_account ?? s.navAccount}</a>}
        </div>
      )}
    </nav>
  );
}

// ── Hero (type IS the hero; image subordinate) ───────────────────────────────

function CdHero({ data }: { data: TemplateData }) {
  const s = cdStrings(data.locale);
  const { hero } = data;
  return (
    <section id={SECTION_IDS.hero} className="cd-section cd-hero">
      <div className="cd-wrap cd-hero-grid">
        <div className="cd-hero-copy">
          <Reveal><p className="cd-eyebrow"><span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span></p></Reveal>
          <Wipe delay={0.04}><h1 className="cd-h1" data-edit="hero.headline" data-edit-type="text">{hero.headline}</h1></Wipe>
          <Reveal as="p" className="cd-hero-sub" delay={0.14}><span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span></Reveal>
          <Reveal className="cd-hero-ctas" delay={0.2}>
            <button className="cd-btn cd-btn-primary cd-btn-lg" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{hero.ctaPrimary} <ArrowRight size={16} aria-hidden="true" /></button>
            <button className="cd-btn cd-btn-ghost cd-btn-lg" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>{hero.ctaSecondary}</button>
          </Reveal>
        </div>
        <div className="cd-hero-media">
          <EnterMount perspective={1400}>
            <figure className="cd-figure">
              <div className="cd-frame">
                <img src={hero.image} alt={s.heroImageAlt} className="cd-frame-img" data-edit="hero.image" data-edit-type="image" />
              </div>
            </figure>
          </EnterMount>
        </div>
      </div>
    </section>
  );
}

// ── Stats ────────────────────────────────────────────────────────────────────

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value) ? Math.round(n).toLocaleString('en-US') : n.toFixed(1);
  return (
    <div ref={ref} className="cd-stat" data-edit-item={`stats.${index}`}>
      <span className="cd-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{formatted}{stat.suffix}</span>
      <span className="cd-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function CdStats({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.stats} className="cd-stats">
      <div className="cd-wrap cd-stats-row">{data.stats.map((st, i) => <StatItem key={i} stat={st} index={i} />)}</div>
    </section>
  );
}

// ── Why (the method) ─────────────────────────────────────────────────────────

const features = (s: CdStrings) => [
  { icon: 'Activity', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function CdWhy({ data }: { data: TemplateData }) {
  const s = cdStrings(data.locale);
  return (
    <section className="cd-section cd-band cd-has-ghost">
      <span className="cd-ghost" aria-hidden="true" data-edit="copy.ghostWhy" data-edit-type="text">{data.copy?.ghostWhy ?? s.ghostWhy}</span>
      <div className="cd-wrap">
        <Reveal><p className="cd-eyebrow"><span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? s.whyEyebrowCd}</span></p></Reveal>
        <Wipe delay={0.05}><h2 className="cd-h2" data-edit="copy.whyHeading" data-edit-type="text">{data.copy?.whyHeading ?? s.whyHeadingCd}</h2></Wipe>
        <div className="cd-why-grid">
          {features(s).map((f, i) => (
            <Reveal key={i} delay={i * 0.06} className="cd-why">
              <span className="cd-why-index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <span className="cd-why-icon"><DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={22} strokeWidth={1.75} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" /></span>
              <h3 className="cd-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">{data.copy?.[f.titleKey] ?? f.title}</h3>
              <p className="cd-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">{data.copy?.[f.bodyKey] ?? f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages ──────────────────────────────────────────────────────────────────

function CdPackages({ data }: { data: TemplateData }) {
  const s = cdStrings(data.locale);
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="cd-section">
      <div className="cd-wrap">
        <Reveal><p className="cd-eyebrow"><span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? s.packagesEyebrow}</span></p></Reveal>
        <Wipe delay={0.05}><h2 className="cd-h2" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingCd}</h2></Wipe>
        <Reveal as="p" className="cd-lead" delay={0.1}><span data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubCd}</span></Reveal>
        <div className="cd-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.06} data-edit-item={`packages.${i}`}>
              <div className={cx('cd-pkg', pkg.popular && 'is-popular')}>
                {pkg.popular && <span className="cd-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge ?? s.badgePopular}</span>}
                <p className="cd-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                <p className="cd-pkg-price">
                  <span className="cd-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">₪{pkg.price}</span>
                  {pkg.unit && <span className="cd-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                </p>
                <ul className="cd-pkg-features">
                  {pkg.features.map((f, fi) => (
                    <li key={fi}><Check size={14} className="cd-check" aria-hidden="true" /><span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span></li>
                  ))}
                </ul>
                <button className={cx('cd-btn', pkg.popular ? 'cd-btn-primary' : 'cd-btn-ghost', 'cd-btn-block')} data-edit="labels.packageCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
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

// ── About ─────────────────────────────────────────────────────────────────────

function CdAbout({ data }: { data: TemplateData }) {
  const s = cdStrings(data.locale);
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="cd-section">
      <div className="cd-wrap cd-about">
        <div className="cd-about-media">
          <Reveal y={26}>
            <figure className="cd-figure">
              <div className="cd-frame">
                <img src={about.image} alt={s.aboutImageAlt} className="cd-frame-img cd-about-img" data-edit="about.image" data-edit-type="image" />
              </div>
            </figure>
          </Reveal>
          <Reveal delay={0.1} className="cd-instructor">
            <img src={instructor.photo} alt={instructor.name} className="cd-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div className="cd-instructor-id">
              <p className="cd-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p>
              <p className="cd-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
            </div>
          </Reveal>
        </div>
        <div className="cd-about-copy">
          <Reveal><p className="cd-eyebrow"><span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? s.aboutEyebrow}</span></p></Reveal>
          <Wipe delay={0.05}><h2 className="cd-h2 cd-h2-tight" data-edit="about.heading" data-edit-type="text">{about.heading}</h2></Wipe>
          {about.body.map((p, i) => (
            <Reveal key={i} as="p" className="cd-body" delay={0.1 + i * 0.06}><span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span></Reveal>
          ))}
          <Reveal delay={0.22}>
            <ul className="cd-checklist">
              {about.checklist.map((item, i) => (
                <li key={i} data-edit-item={`about.checklist.${i}`}>
                  <Check size={16} strokeWidth={2} className="cd-check" aria-hidden="true" />
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          {instructor.bio && <Reveal as="p" className="cd-body" delay={0.26}><span data-edit="instructor.bio" data-edit-type="text">{instructor.bio}</span></Reveal>}
          {instructor.credentials.length > 0 && (
            <Reveal delay={0.3}>
              <div className="cd-creds">
                {instructor.credentials.map((c, i) => (
                  <span key={i} className="cd-cred" data-edit-item={`instructor.credentials.${i}`}>
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

// ── Areas (typographic list, mono index + hairlines) ─────────────────────────

function CdAreas({ data }: { data: TemplateData }) {
  const s = cdStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="cd-section cd-band">
      <div className="cd-wrap">
        <Reveal><p className="cd-eyebrow"><span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? s.areasEyebrowCd}</span></p></Reveal>
        <Wipe delay={0.05}><h2 className="cd-h2" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingCd}</h2></Wipe>
        <ul className="cd-areas">
          {data.areas.map((area, i) => (
            <Reveal key={i} as="li" delay={(i % 4) * 0.04} className="cd-area" data-edit-item={`areas.${i}`}>
              <span className="cd-area-index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <span className="cd-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              {area.note && <span className="cd-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Reviews (big pull-quotes) ────────────────────────────────────────────────

function CdReviews({ data }: { data: TemplateData }) {
  const s = cdStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="cd-section">
      <div className="cd-wrap">
        <Reveal><p className="cd-eyebrow"><span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? s.reviewsEyebrow}</span></p></Reveal>
        <Wipe delay={0.05}><h2 className="cd-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingCd}</h2></Wipe>
        <div className="cd-reviews">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06} className="cd-review" data-edit-item={`reviews.${i}`}>
              <span className="cd-quote" aria-hidden="true">“</span>
              <Stars n={r.rating} />
              <blockquote className="cd-review-text"><span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span></blockquote>
              {r.reply && (
                <p className="cd-review-reply">
                  <span className="cd-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                </p>
              )}
              <div className="cd-review-meta">
                {r.avatar && <img src={r.avatar} alt={r.name} className="cd-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                <div>
                  <p className="cd-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                  {r.meta && <p className="cd-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery ──────────────────────────────────────────────────────────────────

function CdGallery({ data }: { data: TemplateData }) {
  const s = cdStrings(data.locale);
  return (
    <section className="cd-section cd-band">
      <div className="cd-wrap">
        <Reveal><p className="cd-eyebrow"><span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? s.galleryEyebrow}</span></p></Reveal>
        <Wipe delay={0.05}><h2 className="cd-h2" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingCd}</h2></Wipe>
        <div className="cd-gallery">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06} className="cd-gallery-cell" data-edit-item={`gallery.${i}`}>
              <img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ (hairline rows, mono +/−) ────────────────────────────────────────────

function CdFaq({ data }: { data: TemplateData }) {
  const s = cdStrings(data.locale);
  const [open, setOpen] = useState<number | null>(0);
  const editing = useIsEditing();
  return (
    <section id={SECTION_IDS.faq} className="cd-section">
      <div className="cd-wrap cd-faq-wrap">
        <Reveal><p className="cd-eyebrow"><span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? s.faqEyebrow}</span></p></Reveal>
        <Wipe delay={0.05}><h2 className="cd-h2" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingCd}</h2></Wipe>
        <div className="cd-faq-list">
          {data.faqs.map((faq, i) => {
            const isOpen = editing || open === i;
            return (
              <div key={i} className="cd-faq-item" data-edit-item={`faqs.${i}`}>
                <button className="cd-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span data-edit={`faqs.${i}.q`} data-edit-type="text">{faq.q}</span>
                  <span className="cd-faq-ic" aria-hidden="true">{isOpen ? <Minus size={16} /> : <Plus size={16} />}</span>
                </button>
                <div className={cx('cd-faq-panel', isOpen && 'is-open')}>
                  <div className="cd-faq-panel-in"><p data-edit={`faqs.${i}.a`} data-edit-type="text">{faq.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Book (a giant ultramarine word) ──────────────────────────────────────────

function CdBook({ data }: { data: TemplateData }) {
  const s = cdStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="cd-section cd-book cd-has-ghost">
      <span className="cd-ghost" aria-hidden="true" data-edit="copy.ghostBook" data-edit-type="text">{data.copy?.ghostBook ?? s.ghostBook}</span>
      <div className="cd-wrap cd-book-inner">
        <Wipe><h2 className="cd-h2 cd-book-h" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingCd}</h2></Wipe>
        <Reveal as="p" className="cd-lead cd-book-lead" delay={0.08}><span data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodyCd}</span></Reveal>
        <Reveal className="cd-book-ctas" delay={0.14}>
          {data.bookingUrl ? (
            <a href={data.bookingUrl} className="cd-btn cd-btn-primary cd-btn-lg" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={16} aria-hidden="true" /></a>
          ) : (
            <button type="button" className="cd-btn cd-btn-primary cd-btn-lg" title={s.publishNote} disabled aria-disabled="true" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={16} aria-hidden="true" /></button>
          )}
          {data.enrollUrl && <a href={data.enrollUrl} className="cd-btn cd-btn-ghost cd-btn-lg"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span></a>}
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer ─────────────────────────────────────────────────────────

function CdContact({ data }: { data: TemplateData }) {
  const s = cdStrings(data.locale);
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="cd-footer">
      <div className="cd-wrap cd-footer-grid">
        <div>
          <p className="cd-eyebrow"><span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeading}</span></p>
          <div className="cd-contact-info">
            <a href={`tel:${contact.phone}`} className="cd-contact-link"><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={16} strokeWidth={1.75} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span></a>
            <a href={`mailto:${contact.email}`} className="cd-contact-link"><DynamicIcon name={data.icons?.email ?? 'Mail'} size={16} strokeWidth={1.75} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span></a>
            <span className="cd-contact-link"><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={16} strokeWidth={1.75} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span></span>
          </div>
          <div className="cd-socials">
            {socials.map((so, i) => (
              <a key={i} href={so.url} className="cd-social" target="_blank" rel="noreferrer" aria-label={so.platform} data-edit-item={`contact.socials.${i}`}>
                <SocialIcon platform={so.platform} size={16} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="cd-eyebrow"><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabel}</span></p>
          <table className="cd-hours">
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
      <div className="cd-wrap cd-footer-bottom">
        <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
        <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCredit}</span>
      </div>
    </footer>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function Cadence({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts(['https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,slnt,wdth,wght@8..144,-10..0,75..125,100..1000&family=Red+Hat+Mono:wght@400;500;600&display=swap']);
  const active = useScrollSpy(Object.values(SECTION_IDS));
  const s = cdStrings(data.locale);
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  // SIGNATURE — smoothed scroll velocity → a single TRANSFORM var on the root
  // (`--cd-skew`), one coalesced write per frame. Headings read it via
  // `transform: skewY(...)` — a compositor-only property, so it stays smooth at
  // any scroll speed. (An earlier version also morphed the Roboto Flex `wght`/`slnt`
  // axes live, but font-variation-settings re-rasterizes every glyph every frame —
  // that was the jank; the weight is now fixed and only the skew is animated.)
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smooth = useSpring(scrollVelocity, { stiffness: 400, damping: 60 });
  useMotionValueEvent(smooth, 'change', (v) => {
    if (reduced) return;
    const el = rootRef.current;
    if (!el) return;
    const mag = Math.min(1, Math.abs(v) / 2400);
    const dir = v < 0 ? -1 : 1;
    el.style.setProperty('--cd-skew', `${(dir * mag * 4).toFixed(2)}deg`); // ±4°, direction-aware
  });

  return (
    <div ref={rootRef} className="tmpl-cadence" dir={data.dir} style={data.theme as CSSProperties} data-edit="theme.bg" data-edit-type="background">
      <CdNav data={data} active={active} />
      <main>
        <CdHero data={data} />
        <CdStats data={data} />
        <CdWhy data={data} />
        {data.packages.length > 0 && <CdPackages data={data} />}
        <CdAbout data={data} />
        <CdAreas data={data} />
        {data.reviews.length > 0 && <CdReviews data={data} />}
        {data.gallery.length > 0 && <CdGallery data={data} />}
        <CdFaq data={data} />
        <CdBook data={data} />
        <CdContact data={data} />
      </main>
    </div>
  );
}

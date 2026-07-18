/**
 * Folio — the glossy magazine. A high-fashion feature about the instructor:
 * Vogue / The Gentlewoman / Kinfolk energy. A FULL-BLEED cover photograph with a
 * giant Bodoni MASTHEAD, an issue dateline + thin red rule, then editorial
 * SPREADS that alternate full-bleed photography with wide text, pull-quotes,
 * folio page numbers, running heads and a drop cap. Photography-forward and
 * confidently full-width — never a centered narrow column.
 *
 * Bodoni Moda (dramatic Didone — masthead, headings, pull-quotes, prices,
 * numerals; italic for kickers/quotes) + DM Sans (clean grotesque — body, labels,
 * eyebrows, nav, captions in small-caps). Palette via CSS vars on `.tmpl-folio`:
 * --fo-paper / --fo-ink / --fo-accent (bold editorial red, the ONE accent) /
 * --fo-band / --fo-muted. Every tint derives via color-mix, so Customize
 * recolouring never breaks; the darker text/CTA red is
 * `color-mix(--fo-accent 84%, #000)` so it clears 4.5:1 on paper AND band.
 *
 * Motion: the cover photo parallaxes (translate-only), and headings + pull-quotes
 * reveal with a clip-wipe. Both collapse to static under reduced motion. The
 * scrim, rules, folios, running heads and quote marks are aria-hidden; every real
 * heading / photo stays real, editable text with a real alt.
 */
import { useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { Plus, Minus, Star, Menu, X, ArrowRight, Check } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { foStrings, type FoStrings } from './strings';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, EnterTilt, useCountUp, useIsEditing, reviewReplyLabel,
  usePrefersReducedMotion,
} from '../shared';
import './folio.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

// ── Magazine furniture ─────────────────────────────────────────────────────────

/** Folio page number — "— 04 —". Decorative; encodes the real section order. */
function PageFolio({ n }: { n: number }) {
  return <span className="fo-folio" aria-hidden="true">— {String(n).padStart(2, '0')} —</span>;
}

/** Running header — small-caps masthead kicker + section name. Decorative. */
function RunHead({ label, kicker }: { label: string; kicker: string }) {
  return (
    <span className="fo-runhead" aria-hidden="true">
      <span className="fo-runhead-mast">{kicker}</span>
      <span className="fo-runhead-sep">/</span>
      <span>{label}</span>
    </span>
  );
}

/**
 * SIGNATURE motion — a clip-wipe reveal for headings and pull-quotes. The child
 * (a real, editable heading) is unwrapped and static under reduced motion. The
 * wipe is vertical (top→down), so it reads the same in LTR and RTL.
 */
function Wipe({
  children, className, style, delay = 0, as = 'div', ...rest
}: {
  children: ReactNode; className?: string; style?: CSSProperties; delay?: number; as?: ElementType;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLElement>(null);
  // Ref-driven useInView with explicit both-states — framer's declarative
  // `whileInView` intermittently never fires for above-the-fold headings, leaving
  // them clipped + opacity:0 (invisible). This is the reliable pattern.
  const inView = useInView(ref, { once: true, margin: '0px 0px -12% 0px' });
  const M = (typeof as === 'string' ? (motion as never)[as] : motion.create(as)) as ElementType;
  if (reduced) return <div className={className} style={style} {...rest}>{children}</div>;
  return (
    <M
      ref={ref}
      className={className}
      style={style}
      {...rest}
      initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
      animate={inView ? { opacity: 1, clipPath: 'inset(0 0 0% 0)' } : { opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
      transition={{ duration: 0.82, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </M>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="fo-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={16} fill={i < n ? 'var(--fo-accent)' : 'none'} color={i < n ? 'var(--fo-accent)' : 'var(--fo-line)'} />
      ))}
    </span>
  );
}

// ── Nav (a running header) ──────────────────────────────────────────────────────

const navLinks = (s: FoStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about, label: s.navAbout },
  { id: SECTION_IDS.areas, label: s.navAreas },
  { id: SECTION_IDS.reviews, label: s.navReviews },
  { id: SECTION_IDS.faq, label: s.navFaq },
];

function FoNav({ data, active }: { data: TemplateData; active: string }) {
  const s = foStrings(data.locale);
  const [open, setOpen] = useState(false);
  const links = navLinks(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  return (
    <nav className="fo-nav" aria-label={s.mainNavAria}>
      <div className="fo-nav-row">
        <button className="fo-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label={s.goToTopAria}>
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={30} bg="var(--fo-ink)" fg="var(--fo-paper)" radius={2} />
          </span>
          <span className="fo-logo-word" data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <div className="fo-nav-links">
          {links.map(({ id, label }) => (
            <button
              key={id}
              className={cx('fo-nav-link', active === id && 'is-active')}
              onClick={() => scrollToSection(id)}
              data-edit={`copy.nav_${id}`}
              data-edit-type="text"
            >
              {data.copy?.[`nav_${id}`] ?? label}
            </button>
          ))}
        </div>
        <div className="fo-nav-end">
          {data.accountUrl && (
            <a href={data.accountUrl} className="fo-btn fo-btn-ghost fo-btn-sm">{data.copy?.nav_account ?? s.navAccount}</a>
          )}
          <button className="fo-btn fo-btn-primary fo-btn-sm" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{bookLabel}</button>
          <button className="fo-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && (
        <div className="fo-nav-mobile">
          {links.map(({ id, label }) => <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{label}</button>)}
          {data.accountUrl && <a href={data.accountUrl} className="fo-nav-mobile-link">{data.copy?.nav_account ?? s.navAccount}</a>}
        </div>
      )}
    </nav>
  );
}

// ── Hero (FULL-BLEED cover photograph + giant masthead) ─────────────────────────

function FoHero({ data }: { data: TemplateData }) {
  const s = foStrings(data.locale);
  const { hero } = data;
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '-9%']);
  return (
    <section id={SECTION_IDS.hero} className="fo-hero" ref={ref}>
      <div className="fo-hero-photo">
        <motion.img
          src={hero.image}
          alt={s.heroImageAlt}
          className="fo-hero-img"
          style={reduced ? undefined : { y }}
          data-edit="hero.image"
          data-edit-type="image"
        />
      </div>
      <div className="fo-hero-scrim" aria-hidden="true" />
      <div className="fo-hero-inner">
        <div className="fo-hero-top">
          <span className="fo-issue" aria-hidden="true">{s.issueLabel}</span>
          <span className="fo-hero-rule" aria-hidden="true" />
          <Reveal as="p" className="fo-hero-dateline" delay={0.04}><span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span></Reveal>
        </div>
        <Wipe><h1 className="fo-masthead" data-edit="hero.headline" data-edit-type="text">{hero.headline}</h1></Wipe>
        <Reveal as="p" className="fo-hero-sub" delay={0.12}><span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span></Reveal>
        <Reveal className="fo-hero-ctas" delay={0.18}>
          <button className="fo-btn fo-btn-primary" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{hero.ctaPrimary} <ArrowRight size={15} aria-hidden="true" /></button>
          <button className="fo-btn fo-btn-ghost" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>{hero.ctaSecondary}</button>
        </Reveal>
        <span className="fo-hero-caption" aria-hidden="true">{s.heroCaption}</span>
      </div>
    </section>
  );
}

// ── Stats (big Bodoni numerals under hairlines) ─────────────────────────────────

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value) ? Math.round(n).toLocaleString('en-US') : n.toFixed(1);
  return (
    <div ref={ref} className="fo-stat" data-edit-item={`stats.${index}`}>
      <span className="fo-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{formatted}{stat.suffix}</span>
      <span className="fo-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function FoStats({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.stats} className="fo-stats">
      <div className="fo-wrap fo-stats-row">{data.stats.map((st, i) => <StatItem key={i} stat={st} index={i} />)}</div>
    </section>
  );
}

// ── Why (the feature) ───────────────────────────────────────────────────────────

const features = (s: FoStrings) => [
  { icon: 'Sparkles', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function FoWhy({ data }: { data: TemplateData }) {
  const s = foStrings(data.locale);
  return (
    <section className="fo-section">
      <div className="fo-wrap">
        <div className="fo-head">
          <PageFolio n={3} />
          <RunHead kicker={s.mastheadKicker} label={s.whyEyebrowFo} />
          <Reveal><p className="fo-eyebrow"><span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? s.whyEyebrowFo}</span></p></Reveal>
          <Wipe><h2 className="fo-h2" data-edit="copy.whyHeading" data-edit-type="text">{data.copy?.whyHeading ?? s.whyHeadingFo}</h2></Wipe>
        </div>
        <div className="fo-why-grid">
          {features(s).map((f, i) => (
            <Reveal key={i} delay={i * 0.06} className="fo-why">
              <span className="fo-why-icon"><DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={22} strokeWidth={1.4} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" /></span>
              <h3 className="fo-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">{data.copy?.[f.titleKey] ?? f.title}</h3>
              <p className="fo-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">{data.copy?.[f.bodyKey] ?? f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages (editorial cards; popular = red keyline) ───────────────────────────

function FoPackages({ data }: { data: TemplateData }) {
  const s = foStrings(data.locale);
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="fo-section fo-band-section">
      <div className="fo-wrap">
        <div className="fo-head">
          <PageFolio n={4} />
          <RunHead kicker={s.mastheadKicker} label={s.navPackages} />
          <Reveal><p className="fo-eyebrow"><span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? s.packagesEyebrow}</span></p></Reveal>
          <Wipe><h2 className="fo-h2" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingFo}</h2></Wipe>
          <Reveal as="p" className="fo-lead" delay={0.1}><span data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubFo}</span></Reveal>
        </div>
        <div className="fo-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.06} data-edit-item={`packages.${i}`}>
              <div className={cx('fo-pkg', pkg.popular && 'is-popular')}>
                <span className="fo-pkg-folio" aria-hidden="true">№ {String(i + 1).padStart(2, '0')}</span>
                {pkg.popular && <span className="fo-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge ?? s.badgePopular}</span>}
                <p className="fo-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                <p className="fo-pkg-price">
                  <span className="fo-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">₪{pkg.price}</span>
                  {pkg.unit && <span className="fo-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                </p>
                <ul className="fo-pkg-features">
                  {pkg.features.map((f, fi) => (
                    <li key={fi}><Check size={14} className="fo-check" aria-hidden="true" /><span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span></li>
                  ))}
                </ul>
                <button className={cx('fo-btn', pkg.popular ? 'fo-btn-primary' : 'fo-btn-ghost', 'fo-btn-block')} data-edit="labels.packageCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
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

// ── About (a framed-plate spread: drop cap + pull-quote) ────────────────────────

function FoAbout({ data }: { data: TemplateData }) {
  const s = foStrings(data.locale);
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="fo-section">
      <div className="fo-wrap fo-about">
        <div className="fo-about-media">
          <EnterTilt maxTilt={6} perspective={1500}>
            <figure className="fo-plate">
              <img src={about.image} alt={s.aboutImageAlt} className="fo-plate-img fo-about-img" data-edit="about.image" data-edit-type="image" />
            </figure>
          </EnterTilt>
          <Reveal delay={0.1} className="fo-instructor">
            <img src={instructor.photo} alt={instructor.name} className="fo-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div className="fo-instructor-id">
              <p className="fo-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p>
              <p className="fo-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
            </div>
          </Reveal>
        </div>
        <div className="fo-about-copy">
          <PageFolio n={5} />
          <RunHead kicker={s.mastheadKicker} label={s.aboutEyebrow} />
          <Reveal><p className="fo-eyebrow"><span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? s.aboutEyebrow}</span></p></Reveal>
          <Wipe><h2 className="fo-h2 fo-h2-tight" data-edit="about.heading" data-edit-type="text">{about.heading}</h2></Wipe>
          {about.body.map((p, i) => (
            <Reveal key={i} as="p" className={cx('fo-body', i === 0 && 'fo-dropcap')} delay={0.1 + i * 0.06}><span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span></Reveal>
          ))}
          <Wipe as="blockquote" className="fo-pull" delay={0.14}>
            <span data-edit="copy.aboutPull" data-edit-type="text">{data.copy?.aboutPull ?? s.aboutPull}</span>
          </Wipe>
          <Reveal delay={0.22}>
            <ul className="fo-checklist">
              {about.checklist.map((item, i) => (
                <li key={i} data-edit-item={`about.checklist.${i}`}>
                  <Check size={15} strokeWidth={2} className="fo-check" aria-hidden="true" />
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          {instructor.bio && <Reveal as="p" className="fo-body" delay={0.26}><span data-edit="instructor.bio" data-edit-type="text">{instructor.bio}</span></Reveal>}
          {instructor.credentials.length > 0 && (
            <Reveal delay={0.3}>
              <div className="fo-creds">
                {instructor.credentials.map((c, i) => (
                  <span key={i} className="fo-cred" data-edit-item={`instructor.credentials.${i}`}>
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

// ── Areas (a two-column editorial index with hairline leaders) ──────────────────

function FoAreas({ data }: { data: TemplateData }) {
  const s = foStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="fo-section fo-band-section">
      <div className="fo-wrap">
        <div className="fo-head">
          <PageFolio n={6} />
          <RunHead kicker={s.mastheadKicker} label={s.areasEyebrowFo} />
          <Reveal><p className="fo-eyebrow"><span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? s.areasEyebrowFo}</span></p></Reveal>
          <Wipe><h2 className="fo-h2" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingFo}</h2></Wipe>
        </div>
        <ul className="fo-areas">
          {data.areas.map((area, i) => (
            <Reveal key={i} as="li" delay={(i % 4) * 0.04} className="fo-area" data-edit-item={`areas.${i}`}>
              <span className="fo-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              <span className="fo-leader" aria-hidden="true" />
              {area.note && <span className="fo-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Reviews (big Bodoni-italic pull-quote cards) ────────────────────────────────

function FoReviews({ data }: { data: TemplateData }) {
  const s = foStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="fo-section">
      <div className="fo-wrap">
        <div className="fo-head">
          <PageFolio n={7} />
          <RunHead kicker={s.mastheadKicker} label={s.reviewsEyebrow} />
          <Reveal><p className="fo-eyebrow"><span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? s.reviewsEyebrow}</span></p></Reveal>
          <Wipe><h2 className="fo-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingFo}</h2></Wipe>
        </div>
        <div className="fo-reviews">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06} className="fo-review" data-edit-item={`reviews.${i}`}>
              <span className="fo-quote-mark" aria-hidden="true">“</span>
              <Stars n={r.rating} />
              <blockquote className="fo-review-text"><span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span></blockquote>
              {r.reply && (
                <p className="fo-review-reply">
                  <span className="fo-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                </p>
              )}
              <div className="fo-review-meta">
                {r.avatar && <img src={r.avatar} alt={r.name} className="fo-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                <div>
                  <p className="fo-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                  {r.meta && <p className="fo-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery (a FULL-BLEED editorial photo strip) ────────────────────────────────

function FoGallery({ data }: { data: TemplateData }) {
  const s = foStrings(data.locale);
  return (
    <section className="fo-gallery-section">
      <div className="fo-wrap">
        <div className="fo-head">
          <PageFolio n={8} />
          <RunHead kicker={s.mastheadKicker} label={s.galleryEyebrow} />
          <Reveal><p className="fo-eyebrow"><span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? s.galleryEyebrow}</span></p></Reveal>
          <Wipe><h2 className="fo-h2" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingFo}</h2></Wipe>
        </div>
      </div>
      <div className="fo-gallery">
        {data.gallery.map((src, i) => (
          <Reveal key={i} delay={(i % 3) * 0.06} className="fo-gallery-cell" data-edit-item={`gallery.${i}`}>
            <img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ── FAQ (hairline rows, small-caps +/−) ─────────────────────────────────────────

function FoFaq({ data }: { data: TemplateData }) {
  const s = foStrings(data.locale);
  const [open, setOpen] = useState<number | null>(0);
  const editing = useIsEditing();
  return (
    <section id={SECTION_IDS.faq} className="fo-section fo-band-section">
      <div className="fo-wrap fo-faq-wrap">
        <div className="fo-head">
          <PageFolio n={9} />
          <RunHead kicker={s.mastheadKicker} label={s.faqEyebrow} />
          <Reveal><p className="fo-eyebrow"><span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? s.faqEyebrow}</span></p></Reveal>
          <Wipe><h2 className="fo-h2" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingFo}</h2></Wipe>
        </div>
        <div className="fo-faq-list">
          {data.faqs.map((faq, i) => {
            const isOpen = editing || open === i;
            return (
              <div key={i} className="fo-faq-item" data-edit-item={`faqs.${i}`}>
                <button className="fo-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span data-edit={`faqs.${i}.q`} data-edit-type="text">{faq.q}</span>
                  <span className="fo-faq-ic" aria-hidden="true">{isOpen ? <Minus size={15} /> : <Plus size={15} />}</span>
                </button>
                <div className={cx('fo-faq-panel', isOpen && 'is-open')}>
                  <div className="fo-faq-panel-in"><p data-edit={`faqs.${i}.a`} data-edit-type="text">{faq.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Book (a FULL-BLEED "Subscribe" spread over a dimmed photo) ──────────────────

function FoBook({ data }: { data: TemplateData }) {
  const s = foStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="fo-book">
      <div className="fo-book-photo" aria-hidden="true"><img src={data.hero.image} alt="" /></div>
      <div className="fo-book-scrim" aria-hidden="true" />
      <div className="fo-wrap fo-book-inner">
        <Reveal>
          <span className="fo-book-kicker" aria-hidden="true">{s.subscribeLabel}</span>
          <span className="fo-book-rule" aria-hidden="true" />
        </Reveal>
        <Wipe><h2 className="fo-book-h2" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingFo}</h2></Wipe>
        <Reveal as="p" className="fo-book-body" delay={0.1}><span data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodyFo}</span></Reveal>
        <Reveal className="fo-book-ctas" delay={0.16}>
          {data.bookingUrl ? (
            <a href={data.bookingUrl} className="fo-btn fo-btn-primary fo-btn-lg" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={16} aria-hidden="true" /></a>
          ) : (
            <button type="button" className="fo-btn fo-btn-primary fo-btn-lg" title={s.publishNote} disabled aria-disabled="true" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={16} aria-hidden="true" /></button>
          )}
          {data.enrollUrl && <a href={data.enrollUrl} className="fo-btn fo-btn-paper fo-btn-lg"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span></a>}
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer ────────────────────────────────────────────────────────────

function FoContact({ data }: { data: TemplateData }) {
  const s = foStrings(data.locale);
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="fo-footer">
      <div className="fo-wrap fo-footer-grid">
        <div>
          <p className="fo-eyebrow"><span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeading}</span></p>
          <div className="fo-contact-info">
            <a href={`tel:${contact.phone}`} className="fo-contact-link"><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span></a>
            <a href={`mailto:${contact.email}`} className="fo-contact-link"><DynamicIcon name={data.icons?.email ?? 'Mail'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span></a>
            <span className="fo-contact-link"><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span></span>
          </div>
          <div className="fo-socials">
            {socials.map((so, i) => (
              <a key={i} href={so.url} className="fo-social" target="_blank" rel="noreferrer" aria-label={so.platform} data-edit-item={`contact.socials.${i}`}>
                <SocialIcon platform={so.platform} size={16} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="fo-eyebrow"><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabel}</span></p>
          <table className="fo-hours">
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
      <div className="fo-wrap fo-footer-bottom">
        <span className="fo-footer-mast" aria-hidden="true">{s.mastheadKicker}</span>
        <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
        <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCredit}</span>
      </div>
    </footer>
  );
}

// ── Root ────────────────────────────────────────────────────────────────────────

export default function Folio({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts(['https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,600;0,6..96,700;0,6..96,800;1,6..96,400;1,6..96,500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap']);
  const active = useScrollSpy(Object.values(SECTION_IDS));
  return (
    <div className="tmpl-folio" dir={data.dir} style={data.theme as CSSProperties} data-edit="theme.bg" data-edit-type="background">
      <FoNav data={data} active={active} />
      <main>
        <FoHero data={data} />
        <FoStats data={data} />
        <FoWhy data={data} />
        {data.packages.length > 0 && <FoPackages data={data} />}
        <FoAbout data={data} />
        <FoAreas data={data} />
        {data.reviews.length > 0 && <FoReviews data={data} />}
        {data.gallery.length > 0 && <FoGallery data={data} />}
        <FoFaq data={data} />
        <FoBook data={data} />
        <FoContact data={data} />
      </main>
    </div>
  );
}

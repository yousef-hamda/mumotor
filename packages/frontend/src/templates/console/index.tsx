/**
 * Console — a modern product OS. "Your driving school, engineered like software."
 * A Linear / Vercel / Raycast-grade dark product site: the instructor's offering
 * presented as a beautifully-built product. Cool near-black surfaces, one
 * electric-indigo accent, a faint dotted grid, mono for the "system" voice.
 *
 * SIGNATURE (the one bold thing): a ⌘K COMMAND PALETTE that types a query on
 * mount (blinking caret, result rows) beside LIVE DASHBOARD WIDGETS — a framed
 * hero panel with a floating "today's schedule" card, and stat meter cards whose
 * bars fill on view. The palette animation + hero entrance play ON MOUNT (not a
 * scroll-scrub, which pre-settles for a top-of-page element). Everything reduced-
 * motion safe: the palette shows its final typed state, the meters snap full.
 *
 * Inter Tight (product-grade display) · Inter (body) · Space Mono (the system
 * voice: eyebrows, keys, stat numerals, hours, labels).
 *
 * Palette via CSS vars on `.tmpl-console`: --co-bg (page) / --co-panel (widgets)
 * / --co-ink (text) / --co-accent (the ONE accent) / --co-metal (steel secondary).
 * Every tint derives via color-mix from those, so Customize recolouring never
 * breaks. The command-palette animation + grid are aria-hidden decoration; the
 * real nav + CTAs are the accessible controls.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';
import { Plus, Minus, Star, Menu, X, ArrowRight, Check, Search, CornerDownLeft } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { coStrings, type CoStrings } from './strings';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, useCountUp, useIsEditing, reviewReplyLabel,
  usePrefersReducedMotion,
} from '../shared';
import './console.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

/**
 * A one-shot entrance that plays ON MOUNT (page load) — so the hero dashboard
 * animates as it appears, instead of a scroll-scrub which is pre-settled for a
 * top-of-page element and only reads once you scroll far past it.
 */
function EnterMount({ children, className, delay = 0.1 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay }}
      style={{ willChange: 'transform' }}
    >
      {children}
    </motion.div>
  );
}

/** Reveal a substring on mount (the command-palette typewriter). Reduced motion
 *  → the full string immediately. */
function useTypewriter(text: string, enabled: boolean, speed = 60): string {
  const [n, setN] = useState(enabled ? 0 : text.length);
  useEffect(() => {
    if (!enabled) { setN(text.length); return; }
    setN(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, enabled, speed]);
  return text.slice(0, Math.max(0, n));
}

function Stars({ n }: { n: number }) {
  return (
    <span className="co-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill={i < n ? 'var(--co-accent)' : 'none'} color={i < n ? 'var(--co-accent)' : 'var(--co-line-strong)'} />
      ))}
    </span>
  );
}

// ── SIGNATURE: the ⌘K command palette (types on mount) ────────────────────────
// Entirely decorative (aria-hidden): the real nav + CTAs are the accessible
// controls. On reduced motion it shows the final typed state statically.

function CoCommand({ s }: { s: CoStrings }) {
  const reduced = usePrefersReducedMotion();
  const typed = useTypewriter(s.cmdQuery, !reduced);
  const done = typed.length >= s.cmdQuery.length;
  const results = [
    { icon: 'CalendarCheck', label: s.cmdResult1, enter: true },
    { icon: 'Wallet', label: s.cmdResult2, enter: false },
    { icon: 'MessageCircle', label: s.cmdResult3, enter: false },
  ];
  return (
    <div className="co-cmd" aria-hidden="true">
      <div className="co-cmd-bar">
        <Search size={15} className="co-cmd-search" strokeWidth={2} />
        <span className="co-cmd-input">
          {typed}
          <span className={cx('co-cmd-caret', (reduced || done) && 'is-static')} />
        </span>
        <span className="co-cmd-key"><kbd>⌘</kbd><kbd>K</kbd></span>
      </div>
      <div className="co-cmd-results">
        {results.map((r, i) => (
          <div key={i} className={cx('co-cmd-row', i === 0 && 'is-active')}>
            <DynamicIcon name={r.icon} size={15} strokeWidth={2} className="co-cmd-row-ic" />
            <span className="co-cmd-row-label">{r.label}</span>
            {r.enter && <span className="co-cmd-row-enter"><CornerDownLeft size={13} strokeWidth={2} /></span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Nav (the product app top-bar) ─────────────────────────────────────────────

const navLinks = (s: CoStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about, label: s.navAbout },
  { id: SECTION_IDS.areas, label: s.navAreas },
  { id: SECTION_IDS.reviews, label: s.navReviews },
  { id: SECTION_IDS.faq, label: s.navFaq },
];

function CoNav({ data, active }: { data: TemplateData; active: string }) {
  const s = coStrings(data.locale);
  const [open, setOpen] = useState(false);
  const links = navLinks(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  return (
    <nav className="co-nav" aria-label={s.mainNavAria}>
      <div className="co-nav-inner">
        <button className="co-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label={s.goToTopAria}>
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={30} bg="var(--co-accent)" fg="var(--co-bg)" radius={8} />
          </span>
          <span className="co-logo-name" data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <div className="co-nav-links">
          {links.map(({ id, label }) => (
            <button
              key={id}
              className={cx('co-nav-link', active === id && 'is-active')}
              onClick={() => scrollToSection(id)}
              data-edit={`copy.nav_${id}`}
              data-edit-type="text"
            >
              {data.copy?.[`nav_${id}`] ?? label}
            </button>
          ))}
        </div>
        <div className="co-nav-end">
          <button className="co-cmdk-pill" onClick={() => scrollToSection(SECTION_IDS.book)} aria-label={s.cmdkAria}>
            <Search size={14} strokeWidth={2} aria-hidden="true" />
            <span className="co-cmdk-pill-hint">{s.cmdkHint}</span>
            <span className="co-cmdk-pill-key" aria-hidden="true"><kbd>⌘</kbd><kbd>K</kbd></span>
          </button>
          {data.accountUrl && (
            <a href={data.accountUrl} className="co-btn co-btn-ghost co-btn-sm">{data.copy?.nav_account ?? s.navAccount}</a>
          )}
          <button className="co-btn co-btn-primary co-btn-sm" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{bookLabel}</button>
          <button className="co-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && (
        <div className="co-nav-mobile">
          {links.map(({ id, label }) => <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{label}</button>)}
          {data.accountUrl && <a href={data.accountUrl} className="co-nav-mobile-link">{data.copy?.nav_account ?? s.navAccount}</a>}
        </div>
      )}
    </nav>
  );
}

// ── Hero (product title | live dashboard) ─────────────────────────────────────

function CoHero({ data }: { data: TemplateData }) {
  const s = coStrings(data.locale);
  const { hero } = data;
  return (
    <section id={SECTION_IDS.hero} className="co-section co-hero">
      <div className="co-wrap co-hero-grid">
        <div className="co-hero-copy">
          <Reveal><p className="co-eyebrow co-eyebrow-live"><span className="co-livedot" aria-hidden="true" /><span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h1 className="co-h1" data-edit="hero.headline" data-edit-type="text">{hero.headline}</h1></Reveal>
          <Reveal as="p" className="co-hero-sub" delay={0.12}><span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span></Reveal>
          <Reveal className="co-hero-ctas" delay={0.18}>
            <button className="co-btn co-btn-primary" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{hero.ctaPrimary} <ArrowRight size={15} aria-hidden="true" /></button>
            <button className="co-btn co-btn-ghost" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>{hero.ctaSecondary}</button>
          </Reveal>
          <p className="co-hero-status" aria-hidden="true"><span className="co-livedot" />{s.statusLabel}</p>
        </div>
        <div className="co-hero-media">
          <EnterMount className="co-dash">
            <CoCommand s={s} />
            <figure className="co-figure">
              <div className="co-panel co-hero-frame">
                <img src={hero.image} alt={s.heroImageAlt} className="co-hero-img" data-edit="hero.image" data-edit-type="image" />
                <span className="co-hero-chip" aria-hidden="true"><span className="co-livedot" />{s.liveLabel}</span>
              </div>
              <div className="co-widget co-widget-sched" aria-hidden="true">
                <div className="co-widget-head"><span className="co-livedot" />{s.scheduleLabel}</div>
                <div className="co-widget-row"><span className="co-widget-time">08:00</span><span className="co-widget-tag">{s.availLabel}</span></div>
                <div className="co-widget-row"><span className="co-widget-time">09:00</span><span className="co-widget-tag">{s.availLabel}</span></div>
              </div>
              <figcaption className="co-figcap">{s.heroCaption}</figcaption>
            </figure>
          </EnterMount>
        </div>
      </div>
    </section>
  );
}

// ── Stats (dashboard meter cards) ─────────────────────────────────────────────

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value) ? Math.round(n).toLocaleString('en-US') : n.toFixed(1);
  const ratio = stat.value ? Math.min(100, Math.max(0, (n / stat.value) * 100)) : (inView ? 100 : 0);
  return (
    <div ref={ref} className="co-stat" data-edit-item={`stats.${index}`}>
      <div className="co-stat-top">
        <span className="co-stat-id">{String(index + 1).padStart(2, '0')}</span>
        <span className="co-livedot" aria-hidden="true" />
      </div>
      <span className="co-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{formatted}{stat.suffix}</span>
      <span className="co-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
      <span className="co-meter" aria-hidden="true"><span className="co-meter-fill" style={{ width: `${ratio}%` }} /></span>
    </div>
  );
}

function CoStats({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.stats} className="co-stats">
      <div className="co-wrap co-stats-row">{data.stats.map((st, i) => <StatItem key={i} stat={st} index={i} />)}</div>
    </section>
  );
}

// ── Why (the system) ──────────────────────────────────────────────────────────

const features = (s: CoStrings) => [
  { icon: 'Gauge', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function CoWhy({ data }: { data: TemplateData }) {
  const s = coStrings(data.locale);
  return (
    <section className="co-section">
      <div className="co-wrap">
        <Reveal><p className="co-eyebrow"><span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? s.whyEyebrowCo}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="co-h2" data-edit="copy.whyHeading" data-edit-type="text">{data.copy?.whyHeading ?? s.whyHeadingCo}</h2></Reveal>
        <div className="co-why-grid">
          {features(s).map((f, i) => (
            <Reveal key={i} delay={i * 0.06} className="co-why">
              <span className="co-why-icon"><DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={20} strokeWidth={1.75} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" /></span>
              <h3 className="co-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">{data.copy?.[f.titleKey] ?? f.title}</h3>
              <p className="co-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">{data.copy?.[f.bodyKey] ?? f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages (plan cards) ─────────────────────────────────────────────────────

function CoPackages({ data }: { data: TemplateData }) {
  const s = coStrings(data.locale);
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="co-section">
      <div className="co-wrap">
        <Reveal><p className="co-eyebrow"><span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? s.packagesEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="co-h2" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingCo}</h2></Reveal>
        <Reveal as="p" className="co-lead" delay={0.12}><span data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubCo}</span></Reveal>
        <div className="co-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.06} data-edit-item={`packages.${i}`}>
              <div className={cx('co-pkg', pkg.popular && 'is-popular')}>
                {pkg.popular && <span className="co-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge ?? s.badgePopular}</span>}
                <p className="co-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                <p className="co-pkg-price">
                  <span className="co-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">₪{pkg.price}</span>
                  {pkg.unit && <span className="co-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                </p>
                <ul className="co-pkg-features">
                  {pkg.features.map((f, fi) => (
                    <li key={fi}><Check size={14} className="co-check" aria-hidden="true" /><span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span></li>
                  ))}
                </ul>
                <button className={cx('co-btn', pkg.popular ? 'co-btn-primary' : 'co-btn-ghost', 'co-btn-block')} data-edit="labels.packageCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
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

function CoAbout({ data }: { data: TemplateData }) {
  const s = coStrings(data.locale);
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="co-section">
      <div className="co-wrap co-about">
        <div className="co-about-media">
          <Reveal y={26}>
            <figure className="co-figure">
              <div className="co-panel co-hero-frame">
                <img src={about.image} alt={s.aboutImageAlt} className="co-hero-img co-about-img" data-edit="about.image" data-edit-type="image" />
              </div>
            </figure>
          </Reveal>
          <Reveal delay={0.1} className="co-instructor">
            <img src={instructor.photo} alt={instructor.name} className="co-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div className="co-instructor-id">
              <p className="co-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p>
              <p className="co-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
            </div>
          </Reveal>
        </div>
        <div className="co-about-copy">
          <Reveal><p className="co-eyebrow"><span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? s.aboutEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="co-h2 co-h2-tight" data-edit="about.heading" data-edit-type="text">{about.heading}</h2></Reveal>
          {about.body.map((p, i) => (
            <Reveal key={i} as="p" className="co-body" delay={0.1 + i * 0.06}><span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span></Reveal>
          ))}
          <Reveal delay={0.22}>
            <ul className="co-checklist">
              {about.checklist.map((item, i) => (
                <li key={i} data-edit-item={`about.checklist.${i}`}>
                  <Check size={15} strokeWidth={2.5} className="co-check" aria-hidden="true" />
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          {instructor.bio && <Reveal as="p" className="co-body" delay={0.26}><span data-edit="instructor.bio" data-edit-type="text">{instructor.bio}</span></Reveal>}
          {instructor.credentials.length > 0 && (
            <Reveal delay={0.3}>
              <div className="co-creds">
                {instructor.credentials.map((c, i) => (
                  <span key={i} className="co-cred" data-edit-item={`instructor.credentials.${i}`}>
                    <Check size={12} strokeWidth={3} aria-hidden="true" />
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

// ── Areas (coverage list) ─────────────────────────────────────────────────────

function CoAreas({ data }: { data: TemplateData }) {
  const s = coStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="co-section">
      <div className="co-wrap">
        <Reveal><p className="co-eyebrow"><span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? s.areasEyebrowCo}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="co-h2" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingCo}</h2></Reveal>
        <ul className="co-areas">
          {data.areas.map((area, i) => (
            <Reveal key={i} as="li" delay={(i % 4) * 0.04} className="co-area" data-edit-item={`areas.${i}`}>
              <span className="co-area-dot" aria-hidden="true" />
              <span className="co-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              {area.note && <span className="co-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Reviews ───────────────────────────────────────────────────────────────────

function CoReviews({ data }: { data: TemplateData }) {
  const s = coStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="co-section">
      <div className="co-wrap">
        <Reveal><p className="co-eyebrow"><span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? s.reviewsEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="co-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingCo}</h2></Reveal>
        <div className="co-reviews">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06} className="co-review" data-edit-item={`reviews.${i}`}>
              <Stars n={r.rating} />
              <blockquote className="co-review-text">“<span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span>”</blockquote>
              {r.reply && (
                <p className="co-review-reply">
                  <span className="co-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                </p>
              )}
              <div className="co-review-meta">
                {r.avatar && <img src={r.avatar} alt={r.name} className="co-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                <div>
                  <p className="co-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                  {r.meta && <p className="co-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
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

function CoGallery({ data }: { data: TemplateData }) {
  const s = coStrings(data.locale);
  return (
    <section className="co-section">
      <div className="co-wrap">
        <Reveal><p className="co-eyebrow"><span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? s.galleryEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="co-h2" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingCo}</h2></Reveal>
        <div className="co-gallery">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06} className="co-gallery-cell" data-edit-item={`gallery.${i}`}>
              <img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ (disclosure rows) ─────────────────────────────────────────────────────

function CoFaq({ data }: { data: TemplateData }) {
  const s = coStrings(data.locale);
  const [open, setOpen] = useState<number | null>(0);
  const editing = useIsEditing();
  return (
    <section id={SECTION_IDS.faq} className="co-section">
      <div className="co-wrap co-faq-wrap">
        <Reveal><p className="co-eyebrow"><span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? s.faqEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="co-h2" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingCo}</h2></Reveal>
        <div className="co-faq-list">
          {data.faqs.map((faq, i) => {
            const isOpen = editing || open === i;
            return (
              <div key={i} className={cx('co-faq-item', isOpen && 'is-open')} data-edit-item={`faqs.${i}`}>
                <button className="co-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span data-edit={`faqs.${i}.q`} data-edit-type="text">{faq.q}</span>
                  <span className="co-faq-ic" aria-hidden="true">{isOpen ? <Minus size={15} /> : <Plus size={15} />}</span>
                </button>
                <div className={cx('co-faq-panel', isOpen && 'is-open')}>
                  <div className="co-faq-panel-in"><p data-edit={`faqs.${i}.a`} data-edit-type="text">{faq.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Book (a "get started" product CTA panel) ──────────────────────────────────

function CoBook({ data }: { data: TemplateData }) {
  const s = coStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="co-section co-book-section">
      <div className="co-wrap">
        <Reveal className="co-book">
          <div className="co-book-echo" aria-hidden="true">
            <Search size={14} strokeWidth={2} />
            <span className="co-book-echo-q">{s.cmdQuery}</span>
            <span className="co-book-echo-key"><kbd>⌘</kbd><kbd>K</kbd></span>
          </div>
          <p className="co-eyebrow co-eyebrow-center">{s.gridLabel}</p>
          <h2 className="co-h2" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingCo}</h2>
          <p className="co-lead" data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodyCo}</p>
          <div className="co-book-ctas">
            {data.bookingUrl ? (
              <a href={data.bookingUrl} className="co-btn co-btn-primary" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></a>
            ) : (
              <button type="button" className="co-btn co-btn-primary" title={s.publishNote} disabled aria-disabled="true" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></button>
            )}
            {data.enrollUrl && <a href={data.enrollUrl} className="co-btn co-btn-ghost"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span></a>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer ──────────────────────────────────────────────────────────

function CoContact({ data }: { data: TemplateData }) {
  const s = coStrings(data.locale);
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="co-footer">
      <div className="co-wrap co-footer-grid">
        <div>
          <p className="co-eyebrow"><span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeading}</span></p>
          <div className="co-contact-info">
            <a href={`tel:${contact.phone}`} className="co-contact-link"><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={15} strokeWidth={1.75} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span></a>
            <a href={`mailto:${contact.email}`} className="co-contact-link"><DynamicIcon name={data.icons?.email ?? 'Mail'} size={15} strokeWidth={1.75} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span></a>
            <span className="co-contact-link"><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={15} strokeWidth={1.75} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span></span>
          </div>
          <div className="co-socials">
            {socials.map((so, i) => (
              <a key={i} href={so.url} className="co-social" target="_blank" rel="noreferrer" aria-label={so.platform} data-edit-item={`contact.socials.${i}`}>
                <SocialIcon platform={so.platform} size={16} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="co-eyebrow"><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabel}</span></p>
          <table className="co-hours">
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
      <div className="co-wrap co-footer-bottom">
        <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
        <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCredit}</span>
      </div>
    </footer>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function Console({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts(['https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap']);
  const active = useScrollSpy(Object.values(SECTION_IDS));

  return (
    <div className="tmpl-console" dir={data.dir} style={data.theme as CSSProperties} data-edit="theme.bg" data-edit-type="background">
      <CoNav data={data} active={active} />
      <main>
        <CoHero data={data} />
        <CoStats data={data} />
        <CoWhy data={data} />
        {data.packages.length > 0 && <CoPackages data={data} />}
        <CoAbout data={data} />
        <CoAreas data={data} />
        {data.reviews.length > 0 && <CoReviews data={data} />}
        {data.gallery.length > 0 && <CoGallery data={data} />}
        <CoFaq data={data} />
        <CoBook data={data} />
        <CoContact data={data} />
      </main>
    </div>
  );
}

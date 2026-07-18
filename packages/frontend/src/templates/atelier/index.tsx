/**
 * Atelier — the bespoke tailor's studio. Story: a driving course cut to fit
 * you — measured, fitted, made to order; no two drivers alike. Warm, tactile,
 * editorial-craft: ivory/ecru paper, charcoal ink, ONE thread-red accent.
 * Motifs: stitch lines, a paper measuring tape, fabric swatches, tailor's
 * chalk marks, a spool/needle.
 *
 * SIGNATURE (two devices, both scroll-linked via a single --at-progress CSS
 * custom property written once per scroll frame — see useSewProgress below):
 *  1. A measuring-tape rail down the page margin (tick marks + numbers per
 *     section, a moving pin marking how far you've read).
 *  2. A dashed seam that sews itself down the opposite margin (stroke-
 *     dashoffset draws in as you scroll) with a needle leading the stitch.
 * Both live in ordinary (non-fixed) CSS Grid tracks that stretch to the page's
 * own height, so they scroll WITH the content and can never escape the
 * builder's inner scroll container — only the small moving marks inside them
 * use position:absolute against a position:relative ancestor. Reduced motion
 * → the hook sets progress to 1 once and never attaches a scroll listener, so
 * the seam renders fully sewn and the pins sit at rest, with no animation.
 *
 * Fraunces (couture serif — headings, drop caps, prices) + Hanken Grotesk
 * (clean grotesque — body, small-caps tailor labels). Palette via CSS vars on
 * `.tmpl-atelier`: --at-paper (ivory) / --at-ink (charcoal) / --at-accent
 * (thread red, the ONE accent) / --at-band (alternating section band) /
 * --at-tape (brass/kraft — measuring tape, pins, secondary labels). Tints
 * derive via color-mix, so Customize recolouring never breaks.
 */
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { useInView } from 'framer-motion';
import { Plus, Minus, Star, Menu, X, ArrowRight, Check } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { atStrings, type AtStrings } from './strings';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, EnterMount, useCountUp, useIsEditing, reviewReplyLabel,
  usePrefersReducedMotion,
} from '../shared';
import './atelier.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

// ── Scroll progress — drives both signature devices ─────────────────────────

/**
 * Writes an overall 0→1 page-scroll progress directly onto the root element's
 * `--at-progress` CSS custom property, once per animation frame. Resolves the
 * nearest ancestor that GENUINELY scrolls (same technique as `EnterTilt` in
 * shared.tsx) so this reads correctly both on native window scroll AND inside
 * the builder's inner `overflow-y-auto` preview container. Writing a CSS
 * variable (rather than React state) avoids re-rendering the tree every
 * frame — only the CSS that references `var(--at-progress)` repaints.
 * Reduced motion → set once to 1 (fully "sewn"/at-rest) and never listen.
 */
function useSewProgress(rootRef: RefObject<HTMLDivElement>) {
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (reduced) {
      root.style.setProperty('--at-progress', '1');
      return;
    }
    const findScroller = (): HTMLElement | null => {
      let sp: HTMLElement | null = root.parentElement;
      while (sp && sp !== document.body && sp !== document.documentElement) {
        const oy = getComputedStyle(sp).overflowY;
        if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && sp.scrollHeight > sp.clientHeight + 1) return sp;
        sp = sp.parentElement;
      }
      return null; // the window scrolls
    };
    let raf = 0;
    const compute = () => {
      raf = 0;
      const sp = findScroller();
      const rect = root.getBoundingClientRect();
      const scrollerTop = sp ? sp.getBoundingClientRect().top : 0;
      const vh = sp ? sp.clientHeight : window.innerHeight;
      const current = rect.top - scrollerTop; // 0 at page start, negative as we scroll down
      const end = Math.min(-1, vh - rect.height); // negative target reached at full scroll
      const p = Math.max(0, Math.min(1, current / end));
      root.style.setProperty('--at-progress', String(p));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(compute); };
    compute();
    // Capture-phase window listener hears scroll from the window AND from any
    // inner scroll container (builder preview / Customize), whichever moves.
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);
}

// ── Tailor furniture: spool, needle, chalk mark, pinked edge ────────────────

/** A wound spool of thread — pinned beside the wordmark in the nav. Decorative. */
function Spool({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="12" cy="5.2" rx="6.6" ry="2.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <ellipse cx="12" cy="18.8" rx="6.6" ry="2.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.6 5.2 L5.6 18.8 M18.4 5.2 L18.4 18.8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.6 8.4c2.8 1.5 8 1.5 10.8 0M6.6 12c2.8 1.7 8 1.7 10.8 0M6.6 15.6c2.8 1.5 8 1.5 10.8 0" stroke="currentColor" strokeWidth="0.9" fill="none" opacity="0.6" />
    </svg>
  );
}

/** A needle leading the stitch — used at the seam tip and the Book invitation. */
function Needle({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M3.2 16.8 L14.6 5.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="15.8" cy="4.2" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

/** A loose chalk cross — the active-nav-link marker (colour + shape, never colour alone). */
function ChalkMark({ className }: { className?: string }) {
  return (
    <svg className={cx('at-chalk', className)} width="12" height="12" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      <path d="M2.6 2.6 L11.4 11.4" />
      <path d="M11.4 2.6 L2.6 11.4" />
    </svg>
  );
}

/** A pinking-shears zigzag divider under a swatch header strip. Decorative. */
function PinkedEdge({ className }: { className?: string }) {
  return (
    <svg
      className={cx('at-pinked', className)}
      viewBox="0 0 100 7" preserveAspectRatio="none" aria-hidden="true" focusable="false"
    >
      <path
        d="M0 7 L4 0 L8 7 L12 0 L16 7 L20 0 L24 7 L28 0 L32 7 L36 0 L40 7 L44 0 L48 7 L52 0 L56 7 L60 0 L64 7 L68 0 L72 7 L76 0 L80 7 L84 0 L88 7 L92 0 L96 7 L100 0 L100 7 Z"
        fill="var(--at-paper)"
      />
    </svg>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="at-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill={i < n ? 'var(--at-accent)' : 'none'} color={i < n ? 'var(--at-accent)' : 'var(--at-line)'} />
      ))}
    </span>
  );
}

// ── Signature 1: the measuring-tape rail ─────────────────────────────────────

const railTicks = (s: AtStrings) => [
  { id: SECTION_IDS.hero as string | undefined, label: s.tickHero },
  { id: SECTION_IDS.stats as string | undefined, label: s.tickStats },
  { id: undefined, label: s.tickWhy },
  { id: SECTION_IDS.packages as string | undefined, label: s.tickPackages },
  { id: SECTION_IDS.about as string | undefined, label: s.tickAbout },
  { id: SECTION_IDS.areas as string | undefined, label: s.tickAreas },
  { id: SECTION_IDS.reviews as string | undefined, label: s.tickReviews },
  { id: undefined, label: s.tickGallery },
  { id: SECTION_IDS.faq as string | undefined, label: s.tickFaq },
  { id: SECTION_IDS.book as string | undefined, label: s.tickBook },
  { id: SECTION_IDS.contact as string | undefined, label: s.tickContact },
];

function AtTapeRail({ data, active }: { data: TemplateData; active: string }) {
  const s = atStrings(data.locale);
  const ticks = railTicks(s);
  return (
    <div className="at-rail-col" aria-hidden="true">
      <div className="at-tape-line" />
      {ticks.map((t, i) => (
        <div
          key={i}
          className={cx('at-tape-tick', t.id && active === t.id && 'is-active')}
          style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
        >
          <span className="at-tape-num">{String(i + 1).padStart(2, '0')}</span>
          <span className="at-tape-label">{t.label}</span>
        </div>
      ))}
      <div className="at-tape-dot" />
    </div>
  );
}

// ── Signature 2: the self-sewing seam ────────────────────────────────────────

function AtSeamRail() {
  return (
    <div className="at-seam-col" aria-hidden="true">
      <svg className="at-seam-svg" viewBox="0 0 20 1000" preserveAspectRatio="none" focusable="false">
        <path
          className="at-seam-path"
          d="M10 0 L10 1000"
          fill="none"
          stroke="var(--at-tape)"
          strokeWidth="1.6"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
        />
      </svg>
      <Needle className="at-seam-needle" size={18} />
    </div>
  );
}

// ── Nav — a stitched fabric tape ─────────────────────────────────────────────

const navLinks = (s: AtStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about, label: s.navAbout },
  { id: SECTION_IDS.areas, label: s.navAreas },
  { id: SECTION_IDS.reviews, label: s.navReviews },
  { id: SECTION_IDS.faq, label: s.navFaq },
];

function AtNav({ data, active }: { data: TemplateData; active: string }) {
  const s = atStrings(data.locale);
  const [open, setOpen] = useState(false);
  const links = navLinks(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  return (
    <nav className="at-nav" aria-label={s.mainNavAria}>
      <div className="at-nav-tape" />
      <div className="at-nav-inner">
        <button className="at-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label={s.goToTopAria}>
          <span className="at-logo-mark" data-edit="business.logoSrc" data-edit-type="image">
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={30} bg="var(--at-ink)" fg="var(--at-paper)" radius="50%" />
            <Spool size={13} className="at-logo-spool" />
          </span>
          <span className="at-logo-word" data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <div className="at-nav-links">
          {links.map(({ id, label }) => (
            <button
              key={id}
              className={cx('at-nav-link', active === id && 'is-active')}
              onClick={() => scrollToSection(id)}
              data-edit={`copy.nav_${id}`}
              data-edit-type="text"
            >
              {active === id && <ChalkMark className="at-nav-mark" />}
              {data.copy?.[`nav_${id}`] ?? label}
            </button>
          ))}
        </div>
        <div className="at-nav-end">
          {data.accountUrl && (
            <a href={data.accountUrl} className="at-btn at-btn-ghost at-btn-sm">{data.copy?.nav_account ?? s.navAccount}</a>
          )}
          <button className="at-btn at-btn-primary at-btn-sm" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{bookLabel}</button>
          <button className="at-menu" onClick={() => setOpen(!open)} aria-label={open ? s.menuCloseAria : s.menuOpenAria} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && (
        <div className="at-nav-mobile">
          {links.map(({ id, label }) => (
            <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{data.copy?.[`nav_${id}`] ?? label}</button>
          ))}
          {data.accountUrl && <a href={data.accountUrl} className="at-nav-mobile-link">{data.copy?.nav_account ?? s.navAccount}</a>}
        </div>
      )}
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function AtHero({ data }: { data: TemplateData }) {
  const s = atStrings(data.locale);
  const { hero } = data;
  return (
    <section id={SECTION_IDS.hero} className="at-section at-hero">
      <div className="at-wrap at-hero-grid">
        <div className="at-hero-copy">
          <Reveal><p className="at-eyebrow"><ChalkMark /><span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h1 className="at-h1" data-edit="hero.headline" data-edit-type="text">{hero.headline}</h1></Reveal>
          <div className="at-motto-row">
            <span className="at-spool-badge"><Spool size={19} /></span>
            <span className="at-motto">{s.tailorMotto}</span>
          </div>
          <Reveal as="p" className="at-hero-sub" delay={0.12}><span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span></Reveal>
          <Reveal className="at-hero-ctas" delay={0.18}>
            <button className="at-btn at-btn-primary" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{hero.ctaPrimary} <ArrowRight size={15} aria-hidden="true" /></button>
            <button className="at-btn at-btn-ghost" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>{hero.ctaSecondary}</button>
          </Reveal>
        </div>
        <div className="at-hero-media">
          <EnterMount tilt={8} perspective={1500}>
            <figure className="at-figure">
              <div className="at-plate at-plate-tilt">
                <img src={hero.image} alt={s.heroImageAlt} className="at-plate-img" data-edit="hero.image" data-edit-type="image" />
              </div>
              <figcaption className="at-caption">{s.heroCaption}</figcaption>
            </figure>
          </EnterMount>
        </div>
      </div>
    </section>
  );
}

// ── Stats — measurements ─────────────────────────────────────────────────────

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value) ? Math.round(n).toLocaleString('en-US') : n.toFixed(1);
  return (
    <div ref={ref} className="at-stat" data-edit-item={`stats.${index}`}>
      <span className="at-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{formatted}{stat.suffix}</span>
      <span className="at-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function AtStats({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.stats} className="at-stats">
      <div className="at-wrap at-stats-row">{data.stats.map((st, i) => <StatItem key={i} stat={st} index={i} />)}</div>
    </section>
  );
}

// ── Why (the philosophy) ─────────────────────────────────────────────────────

const features = (s: AtStrings) => [
  { icon: 'Ruler', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function AtWhy({ data }: { data: TemplateData }) {
  const s = atStrings(data.locale);
  return (
    <section className="at-section at-band">
      <div className="at-wrap">
        <div className="at-head">
          <Reveal><p className="at-eyebrow"><ChalkMark /><span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? s.whyEyebrowAt}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="at-h2" data-edit="copy.whyHeading" data-edit-type="text">{data.copy?.whyHeading ?? s.whyHeadingAt}</h2></Reveal>
        </div>
        <div className="at-why-grid">
          {features(s).map((f, i) => (
            <Reveal key={i} delay={i * 0.06} className="at-why">
              <span className="at-why-icon"><DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={20} strokeWidth={1.5} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" /></span>
              <h3 className="at-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">{data.copy?.[f.titleKey] ?? f.title}</h3>
              <p className="at-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">{data.copy?.[f.bodyKey] ?? f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages — fabric swatch cards ───────────────────────────────────────────

function AtPackages({ data }: { data: TemplateData }) {
  const s = atStrings(data.locale);
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="at-section">
      <div className="at-wrap">
        <div className="at-head">
          <Reveal><p className="at-eyebrow"><ChalkMark /><span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? s.packagesEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="at-h2" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingAt}</h2></Reveal>
          <Reveal as="p" className="at-lead" delay={0.12}><span data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubAt}</span></Reveal>
        </div>
        <div className="at-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.06} data-edit-item={`packages.${i}`}>
              <div className={cx('at-pkg', pkg.popular && 'is-popular')}>
                <div className="at-pkg-swatch" aria-hidden="true" />
                <PinkedEdge />
                <div className="at-pkg-body">
                  {pkg.popular && (
                    <span className="at-pkg-tag">
                      <span className="at-swingtag" aria-hidden="true"><span className="at-swingtag-hole" /></span>
                      <span className="at-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge ?? s.badgePopularAt}</span>
                    </span>
                  )}
                  <p className="at-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                  <p className="at-pkg-price">
                    <span className="at-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">₪{pkg.price}</span>
                    {pkg.unit && <span className="at-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                  </p>
                  <ul className="at-pkg-features">
                    {pkg.features.map((f, fi) => (
                      <li key={fi}><Check size={14} className="at-check" aria-hidden="true" /><span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span></li>
                    ))}
                  </ul>
                  <button className={cx('at-btn', pkg.popular ? 'at-btn-primary' : 'at-btn-ghost', 'at-btn-block')} data-edit="labels.packageCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
                    {pkg.popular ? (labels?.packageCtaPopular ?? labels?.packageCta ?? s.bookThisPlan) : (labels?.packageCta ?? s.packageCta)}
                  </button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── About — the tailor ───────────────────────────────────────────────────────

function AtAbout({ data }: { data: TemplateData }) {
  const s = atStrings(data.locale);
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="at-section">
      <div className="at-wrap at-about">
        <div className="at-about-media">
          <Reveal y={26}>
            <figure className="at-figure">
              <div className="at-plate">
                <img src={about.image} alt={s.aboutImageAlt} className="at-plate-img at-about-img" data-edit="about.image" data-edit-type="image" />
              </div>
            </figure>
          </Reveal>
          <Reveal delay={0.1} className="at-instructor">
            <img src={instructor.photo} alt={instructor.name} className="at-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div className="at-instructor-id">
              <p className="at-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p>
              <p className="at-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
            </div>
          </Reveal>
        </div>
        <div className="at-about-copy">
          <Reveal><p className="at-eyebrow"><ChalkMark /><span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? s.aboutEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="at-h2 at-h2-tight" data-edit="about.heading" data-edit-type="text">{about.heading}</h2></Reveal>
          {about.body.map((p, i) => (
            <Reveal key={i} as="p" className={cx('at-body', i === 0 && 'at-dropcap')} delay={0.1 + i * 0.06}><span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span></Reveal>
          ))}
          <Reveal delay={0.22}>
            <ul className="at-checklist">
              {about.checklist.map((item, i) => (
                <li key={i} data-edit-item={`about.checklist.${i}`}>
                  <Check size={15} strokeWidth={2} className="at-check" aria-hidden="true" />
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          {instructor.bio && <Reveal as="p" className="at-body" delay={0.26}><span data-edit="instructor.bio" data-edit-type="text">{instructor.bio}</span></Reveal>}
          {instructor.credentials.length > 0 && (
            <Reveal delay={0.3}>
              <div className="at-creds">
                {instructor.credentials.map((c, i) => (
                  <span key={i} className="at-cred" data-edit-item={`instructor.credentials.${i}`}>
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

// ── Areas — reach, a ruled order book ────────────────────────────────────────

function AtAreas({ data }: { data: TemplateData }) {
  const s = atStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="at-section at-band">
      <div className="at-wrap">
        <div className="at-head">
          <Reveal><p className="at-eyebrow"><ChalkMark /><span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? s.areasEyebrowAt}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="at-h2" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingAt}</h2></Reveal>
        </div>
        <ul className="at-areas">
          {data.areas.map((area, i) => (
            <Reveal key={i} as="li" delay={(i % 4) * 0.04} className="at-area" data-edit-item={`areas.${i}`}>
              <span className="at-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              <span className="at-leader" aria-hidden="true" />
              {area.note && <span className="at-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Reviews — fitting-room notes ─────────────────────────────────────────────

function AtReviews({ data }: { data: TemplateData }) {
  const s = atStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="at-section">
      <div className="at-wrap">
        <div className="at-head">
          <Reveal><p className="at-eyebrow"><ChalkMark /><span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? s.reviewsEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="at-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingAt}</h2></Reveal>
        </div>
        <div className="at-reviews">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06} className="at-review" data-edit-item={`reviews.${i}`}>
              <Stars n={r.rating} />
              <blockquote className="at-review-text">“<span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span>”</blockquote>
              {r.reply && (
                <p className="at-review-reply">
                  <span className="at-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                </p>
              )}
              <div className="at-review-meta">
                {r.avatar && <img src={r.avatar} alt={r.name} className="at-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                <div>
                  <p className="at-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                  {r.meta && <p className="at-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery — the workroom ───────────────────────────────────────────────────

function AtGallery({ data }: { data: TemplateData }) {
  const s = atStrings(data.locale);
  return (
    <section className="at-section at-band">
      <div className="at-wrap">
        <div className="at-head">
          <Reveal><p className="at-eyebrow"><ChalkMark /><span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? s.galleryEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="at-h2" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingAt}</h2></Reveal>
        </div>
        <div className="at-gallery">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06} className="at-gallery-cell" data-edit-item={`gallery.${i}`}>
              <img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ — alterations & notes ────────────────────────────────────────────────

function AtFaq({ data }: { data: TemplateData }) {
  const s = atStrings(data.locale);
  const [open, setOpen] = useState<number | null>(0);
  const editing = useIsEditing();
  return (
    <section id={SECTION_IDS.faq} className="at-section">
      <div className="at-wrap at-faq-wrap">
        <div className="at-head">
          <Reveal><p className="at-eyebrow"><ChalkMark /><span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? s.faqEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="at-h2" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingAt}</h2></Reveal>
        </div>
        <div className="at-faq-list">
          {data.faqs.map((faq, i) => {
            const isOpen = editing || open === i;
            return (
              <div key={i} className="at-faq-item" data-edit-item={`faqs.${i}`}>
                <button className="at-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span data-edit={`faqs.${i}.q`} data-edit-type="text">{faq.q}</span>
                  <span className="at-faq-ic" aria-hidden="true">{isOpen ? <Minus size={14} /> : <Plus size={14} />}</span>
                </button>
                <div className={cx('at-faq-panel', isOpen && 'is-open')}>
                  <div className="at-faq-panel-in"><p data-edit={`faqs.${i}.a`} data-edit-type="text">{faq.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Book — the fitting invitation ────────────────────────────────────────────

function AtBook({ data }: { data: TemplateData }) {
  const s = atStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="at-section">
      <div className="at-wrap">
        <Reveal className="at-book">
          <Needle className="at-book-needle" size={26} />
          <p className="at-eyebrow"><ChalkMark /><span data-edit="copy.bookEyebrow" data-edit-type="text">{data.copy?.bookEyebrow ?? s.bookEyebrow}</span></p>
          <h2 className="at-h2" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingAt}</h2>
          <p className="at-lead" data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodyAt}</p>
          <div className="at-book-ctas">
            {data.bookingUrl ? (
              <a href={data.bookingUrl} className="at-btn at-btn-primary" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></a>
            ) : (
              <button type="button" className="at-btn at-btn-primary" title={s.publishNote} disabled aria-disabled="true" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></button>
            )}
            {data.enrollUrl && <a href={data.enrollUrl} className="at-btn at-btn-ghost"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span></a>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer ─────────────────────────────────────────────────────────

function AtContact({ data }: { data: TemplateData }) {
  const s = atStrings(data.locale);
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="at-footer">
      <div className="at-footer-tape" aria-hidden="true" />
      <div className="at-wrap at-footer-grid">
        <div>
          <p className="at-eyebrow"><ChalkMark /><span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeading}</span></p>
          <div className="at-contact-info">
            <a href={`tel:${contact.phone}`} className="at-contact-link"><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span></a>
            <a href={`mailto:${contact.email}`} className="at-contact-link"><DynamicIcon name={data.icons?.email ?? 'Mail'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span></a>
            <span className="at-contact-link"><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span></span>
          </div>
          <div className="at-socials">
            {socials.map((so, i) => (
              <a key={i} href={so.url} className="at-social" target="_blank" rel="noreferrer" aria-label={so.platform} data-edit-item={`contact.socials.${i}`}>
                <SocialIcon platform={so.platform} size={16} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="at-eyebrow"><ChalkMark /><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabel}</span></p>
          <table className="at-hours">
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
      <div className="at-wrap at-footer-bottom">
        <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
        <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCredit}</span>
      </div>
    </footer>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function Atelier({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts(['https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,400;1,9..144,500&family=Hanken+Grotesk:wght@400;500;600;700&display=swap']);
  const active = useScrollSpy(Object.values(SECTION_IDS));
  const rootRef = useRef<HTMLDivElement>(null);
  useSewProgress(rootRef);

  return (
    <div ref={rootRef} className="tmpl-atelier" dir={data.dir} style={data.theme as CSSProperties} data-edit="theme.bg" data-edit-type="background">
      <AtNav data={data} active={active} />
      <div className="at-frame">
        <AtTapeRail data={data} active={active} />
        <div className="at-content">
          <main>
            <AtHero data={data} />
            <AtStats data={data} />
            <AtWhy data={data} />
            {data.packages.length > 0 && <AtPackages data={data} />}
            <AtAbout data={data} />
            <AtAreas data={data} />
            {data.reviews.length > 0 && <AtReviews data={data} />}
            {data.gallery.length > 0 && <AtGallery data={data} />}
            <AtFaq data={data} />
            <AtBook data={data} />
            <AtContact data={data} />
          </main>
        </div>
        <AtSeamRail />
      </div>
    </div>
  );
}

/**
 * Nocturne — celestial night-drive navigation. The story: a confident night
 * drive, guided by someone who knows every road — like navigating by the
 * stars. Deep midnight indigo, warm brass-gold starlight, ivory type. Every
 * section is a "star" in a course that draws itself as you scroll — a thin
 * gold line threading from waypoint to waypoint, each one lighting up as it's
 * reached, over a slow, layered starfield. A compass rose sits by the hero
 * and the logo; a small meteor streak catches each heading as it comes into
 * view.
 *
 * Cormorant Garamond (a high-contrast display serif — headings) + Manrope
 * (a clean, warm sans — body/UI) + JetBrains Mono (coordinate/chart chrome —
 * the small "star marks", labels and instrument numerals).
 *
 * SIGNATURE, non-negotiable constraint: nothing here is `position: fixed` —
 * every decorative layer (starfield, course line, waypoints) is `position:
 * absolute` inside the `position: relative` root, so it scrolls naturally
 * with the page and can never escape the builder's in-page preview frame.
 * Scroll progress is read by hand (nearest real scroller, capture-phase
 * listener, `getBoundingClientRect` each frame — the same technique as
 * `shared.tsx`'s `EnterTilt`) and written once a frame into a single CSS
 * custom property, `--nc-progress`, on the root element; the course line's
 * `stroke-dashoffset` and each waypoint star's lit-opacity are then pure CSS
 * `calc()`/`clamp()` expressions off that one variable — no per-frame React
 * state, no layout thrash. Reduced motion → the course renders fully drawn,
 * every star lit, no twinkle/parallax/needle drift.
 *
 * Palette via CSS vars on `.tmpl-nocturne`: --nc-bg (midnight) / --nc-ink
 * (ivory) / --nc-accent (brass gold — the ONE accent) / --nc-panel (a deeper
 * navy surface for cards) / --nc-star (muted slate-blue — secondary text,
 * hairlines, unlit stars). See nocturne.css header for verified contrast.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { useInView } from 'framer-motion';
import { Plus, Minus, Star, Menu, X, ArrowRight, Check } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { nocStrings, type NocStrings } from './strings';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, EnterMount, useCountUp, useIsEditing, reviewReplyLabel,
  usePrefersReducedMotion,
} from '../shared';
import './nocturne.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

// ── Star-chart furniture ─────────────────────────────────────────────────────

/** A margin "star mark" — e.g. "01 · DEPARTURE". Decorative; encodes the real
 *  section order in mono chart-lettering, like a coordinate readout. */
function NcMark({ n, label }: { n: number; label: string }) {
  return (
    <span className="nc-mark" aria-hidden="true">
      <span className="nc-mark-n">{String(n).padStart(2, '0')}</span>
      <span className="nc-mark-sep">·</span>
      {label}
    </span>
  );
}

function NcStars({ n }: { n: number }) {
  return (
    <span className="nc-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill={i < n ? 'var(--nc-accent)' : 'none'} color={i < n ? 'var(--nc-accent)' : 'var(--nc-star)'} />
      ))}
    </span>
  );
}

/**
 * SIGNATURE (1/3) — the meteor. Wraps a section heading; the first time it
 * scrolls into view a thin streak of light crosses it once and the heading
 * settles into a soft, permanent starlit glow — the same "a star is reached"
 * language as the course line's waypoints, applied to the words themselves.
 * The heading stays a real editable element — only the wrapper class toggles.
 * Reduced motion → glow present immediately, no streak, no transition.
 */
function NcMeteor({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -14% 0px' });
  const lit = reduced || inView;
  return (
    <span ref={ref} className={cx('nc-meteor', lit && 'is-lit', className)}>
      {children}
    </span>
  );
}

/** A small hand-drawn compass rose — cardinal ticks around a ring, a brass
 *  needle that settles side to side as though finding true north. Purely
 *  decorative (aria-hidden); size is passed by the caller (nav vs hero). */
function NcCompass({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={cx('nc-compass', className)}
      width={size} height={size} viewBox="0 0 40 40"
      aria-hidden="true" focusable="false"
    >
      <circle cx="20" cy="20" r="17.5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.55" />
      <circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line key={deg} x1="20" y1="3" x2="20" y2="6.6" stroke="currentColor" strokeWidth="1" opacity="0.65" transform={`rotate(${deg} 20 20)`} />
      ))}
      <g className="nc-compass-needle">
        <polygon points="20,7.5 22.6,20 20,32.5 17.4,20" fill="var(--nc-accent)" />
      </g>
      <circle cx="20" cy="20" r="1.7" fill="var(--nc-accent)" />
    </svg>
  );
}

// ── The course: a self-drawing constellation line threading every section ───
// Hand-authored in a 40×1000 viewBox (preserveAspectRatio="none" stretches it
// to the page's real height), same technique as the survey-route templates —
// EXCEPT positioned `absolute` (never `fixed`), so it scrolls as part of the
// normal page flow instead of pinning to the viewport.

const COURSE_D =
  'M 20 20 C 32 100, 8 160, 20 220 C 32 280, 8 340, 20 400 C 32 460, 8 520, 20 580 ' +
  'C 32 640, 8 700, 20 760 C 32 820, 8 880, 20 940 C 28 968, 14 986, 20 1000';

/** Waypoint stars — [progress-threshold 0..1, x, y] — one per section, roughly
 *  threaded along COURSE_D. Each lights up once `--nc-progress` passes its t. */
const WAYPOINTS: [number, number, number][] = [
  [0.02, 20, 20],
  [0.10, 26, 100],
  [0.18, 14, 220],
  [0.28, 26, 340],
  [0.40, 14, 460],
  [0.52, 26, 580],
  [0.62, 14, 700],
  [0.72, 26, 800],
  [0.80, 14, 880],
  [0.90, 24, 950],
  [0.97, 20, 990],
];

/** Background "field stars" — extra static constellation dots either side of
 *  the course, each joined to the spine by a faint line, for a proper
 *  night-sky-chart feel rather than a single lonely line. [x, y, r]. */
const FIELD_STARS: [number, number, number][] = [
  [8, 60, 1.1], [33, 150, 0.9], [6, 300, 1], [34, 400, 0.8], [9, 500, 1.1],
  [33, 620, 0.9], [7, 750, 1], [35, 840, 0.8], [10, 920, 1.1], [30, 970, 0.9],
];

/**
 * SIGNATURE (2/3) — the course line. Absolute (never fixed), spans the whole
 * page height inside the relative root. Its stroke-dashoffset and each
 * waypoint's lit-opacity are pure CSS `calc()`/`clamp()` off `--nc-progress`
 * (see useCourseProgress + nocturne.css) — no per-frame React re-render.
 */
function NcCourseLine() {
  return (
    <svg className="nc-course-svg" viewBox="0 0 40 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {FIELD_STARS.map(([x, y], i) => (
        <line key={`fl${i}`} x1={x} y1={y} x2="20" y2={y} className="nc-field-line" />
      ))}
      <path d={COURSE_D} className="nc-course-path" pathLength={1} />
      {FIELD_STARS.map(([x, y, r], i) => (
        <circle
          key={`fs${i}`} cx={x} cy={y} r={r} className="nc-field-star"
          style={{ animationDelay: `${(i % 5) * 0.6}s` }}
        />
      ))}
      {WAYPOINTS.map(([t, x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3.1" className="nc-star-dim" />
          <circle cx={x} cy={y} r="4" className="nc-star-bright" style={{ '--nc-t': t } as unknown as CSSProperties} />
        </g>
      ))}
    </svg>
  );
}

/** SIGNATURE (3/3) — the parallax starfield. Three depth layers, absolute
 *  (never fixed) and translate-only (never scale/filter, so nothing
 *  re-rasterizes on scroll) — each moves at a different rate off the same
 *  `--nc-progress` variable. */
function NcStarfield() {
  return (
    <div className="nc-starfield" aria-hidden="true">
      <div className="nc-star-layer nc-star-layer-1" />
      <div className="nc-star-layer nc-star-layer-2" />
      <div className="nc-star-layer nc-star-layer-3" />
    </div>
  );
}

/**
 * Reads page-scroll progress (0 at the top of the root, 1 once its bottom
 * has fully passed) and writes it once a frame into `--nc-progress` on the
 * root element itself — every scroll-bound visual in this template is then a
 * plain CSS expression off that one variable. Resolves the nearest ancestor
 * that GENUINELY scrolls (the builder preview's inner `overflow-y:auto`
 * container) exactly like `shared.tsx`'s EnterTilt, falling back to the
 * window; a capture-phase listener hears scroll from either. Reduced motion →
 * pins to 1 (course fully drawn, every star lit, no listeners attached).
 */
function useCourseProgress(rootRef: RefObject<HTMLDivElement>) {
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (reduced) {
      root.style.setProperty('--nc-progress', '1');
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
      const vTop = sp ? sp.getBoundingClientRect().top : 0;
      const vH = sp ? sp.clientHeight : window.innerHeight;
      const span = Math.max(1, rect.height - vH);
      const p = (vTop - rect.top) / span;
      root.style.setProperty('--nc-progress', String(Math.max(0, Math.min(1, p))));
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

// ── Nav (constellation points, connected by a faint line) ──────────────────

const navLinks = (s: NocStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about, label: s.navAbout },
  { id: SECTION_IDS.areas, label: s.navAreas },
  { id: SECTION_IDS.reviews, label: s.navReviews },
  { id: SECTION_IDS.faq, label: s.navFaq },
];

function NcNav({ data, active }: { data: TemplateData; active: string }) {
  const s = nocStrings(data.locale);
  const [open, setOpen] = useState(false);
  const links = navLinks(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  return (
    <nav className="nc-nav" aria-label={s.mainNavAria}>
      <div className="nc-nav-inner">
        <button className="nc-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label={s.goToTopAria}>
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={30} bg="var(--nc-accent)" fg="var(--nc-bg)" radius={999} />
          </span>
          <span className="nc-logo-word" data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
          <NcCompass size={20} className="nc-logo-compass" />
        </button>
        <div className="nc-nav-links">
          {links.map(({ id, label }) => (
            <button
              key={id}
              className={cx('nc-nav-link', active === id && 'is-active')}
              onClick={() => scrollToSection(id)}
              data-edit={`copy.nav_${id}`}
              data-edit-type="text"
            >
              <span className="nc-nav-dot" aria-hidden="true" />
              {data.copy?.[`nav_${id}`] ?? label}
              <span className="nc-nav-arc" aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="nc-nav-end">
          {data.accountUrl && (
            <a href={data.accountUrl} className="nc-btn nc-btn-ghost nc-btn-sm">{data.copy?.nav_account ?? s.navAccount}</a>
          )}
          <button className="nc-btn nc-btn-primary nc-btn-sm" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{bookLabel}</button>
          <button className="nc-menu" onClick={() => setOpen(!open)} aria-label={open ? s.menuCloseAria : s.menuOpenAria} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && (
        <div className="nc-nav-mobile">
          {links.map(({ id, label }) => <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{label}</button>)}
          {data.accountUrl && <a href={data.accountUrl} className="nc-nav-mobile-link">{data.copy?.nav_account ?? s.navAccount}</a>}
        </div>
      )}
    </nav>
  );
}

// ── Hero (headline | night-drive photo, compass motto beneath) ─────────────

function NcHero({ data }: { data: TemplateData }) {
  const s = nocStrings(data.locale);
  const { hero } = data;
  return (
    <section id={SECTION_IDS.hero} className="nc-section nc-hero">
      <div className="nc-wrap nc-hero-grid">
        <div className="nc-hero-copy">
          <NcMark n={1} label={s.markHero} />
          <Reveal><p className="nc-eyebrow"><span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span></p></Reveal>
          <NcMeteor><h1 className="nc-h1" data-edit="hero.headline" data-edit-type="text">{hero.headline}</h1></NcMeteor>
          <Reveal as="p" className="nc-hero-sub" delay={0.12}><span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span></Reveal>
          <Reveal className="nc-hero-ctas" delay={0.18}>
            <button className="nc-btn nc-btn-primary" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{hero.ctaPrimary} <ArrowRight size={15} aria-hidden="true" /></button>
            <button className="nc-btn nc-btn-ghost" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>{hero.ctaSecondary}</button>
          </Reveal>
          <Reveal className="nc-compass-row" delay={0.24}>
            <NcCompass size={40} />
            <span className="nc-compass-motto">{s.compassMotto}</span>
          </Reveal>
        </div>
        <div className="nc-hero-media">
          <EnterMount tilt={9} perspective={1500}>
            <figure className="nc-figure">
              <div className="nc-plate">
                <img src={hero.image} alt={s.heroImageAlt} className="nc-plate-img" data-edit="hero.image" data-edit-type="image" />
                <span className="nc-plate-glow" aria-hidden="true" />
              </div>
              <figcaption className="nc-caption">{s.heroCaption}</figcaption>
            </figure>
          </EnterMount>
        </div>
      </div>
    </section>
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value) ? Math.round(n).toLocaleString('en-US') : n.toFixed(1);
  return (
    <div ref={ref} className="nc-stat" data-edit-item={`stats.${index}`}>
      <span className="nc-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{formatted}{stat.suffix}</span>
      <span className="nc-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function NcStats({ data }: { data: TemplateData }) {
  const s = nocStrings(data.locale);
  return (
    <section id={SECTION_IDS.stats} className="nc-stats">
      <NcMark n={2} label={s.markStats} />
      <div className="nc-wrap nc-stats-row">{data.stats.map((st, i) => <StatItem key={i} stat={st} index={i} />)}</div>
    </section>
  );
}

// ── Why (the compass — what makes lessons feel guided) ──────────────────────

const features = (s: NocStrings) => [
  { icon: 'Compass', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function NcWhy({ data }: { data: TemplateData }) {
  const s = nocStrings(data.locale);
  return (
    <section className="nc-section nc-band">
      <NcMark n={3} label={s.markWhy} />
      <div className="nc-wrap">
        <div className="nc-head">
          <Reveal><p className="nc-eyebrow"><span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? s.whyEyebrowNc}</span></p></Reveal>
          <NcMeteor><h2 className="nc-h2" data-edit="copy.whyHeading" data-edit-type="text">{data.copy?.whyHeading ?? s.whyHeadingNc}</h2></NcMeteor>
        </div>
        <div className="nc-why-grid">
          {features(s).map((f, i) => (
            <Reveal key={i} delay={i * 0.06} className="nc-why">
              <span className="nc-why-icon"><DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={20} strokeWidth={1.5} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" /></span>
              <h3 className="nc-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">{data.copy?.[f.titleKey] ?? f.title}</h3>
              <p className="nc-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">{data.copy?.[f.bodyKey] ?? f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages (night-panel cards; popular gets a guiding star) ──────────────

function NcPackages({ data }: { data: TemplateData }) {
  const s = nocStrings(data.locale);
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="nc-section">
      <NcMark n={4} label={s.markPackages} />
      <div className="nc-wrap">
        <div className="nc-head">
          <Reveal><p className="nc-eyebrow"><span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? s.packagesEyebrow}</span></p></Reveal>
          <NcMeteor><h2 className="nc-h2" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingNc}</h2></NcMeteor>
          <Reveal as="p" className="nc-lead" delay={0.12}><span data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubNc}</span></Reveal>
        </div>
        <div className="nc-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.06} data-edit-item={`packages.${i}`}>
              <div className={cx('nc-pkg', pkg.popular && 'is-popular')}>
                {pkg.popular && (
                  <span className="nc-pkg-badge-row">
                    <Star size={13} fill="var(--nc-accent)" color="var(--nc-accent)" aria-hidden="true" />
                    <span className="nc-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge ?? s.badgePopular}</span>
                  </span>
                )}
                <p className="nc-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                <p className="nc-pkg-price">
                  <span className="nc-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">₪{pkg.price}</span>
                  {pkg.unit && <span className="nc-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                </p>
                <ul className="nc-pkg-features">
                  {pkg.features.map((f, fi) => (
                    <li key={fi}><Check size={14} className="nc-check" aria-hidden="true" /><span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span></li>
                  ))}
                </ul>
                <button className={cx('nc-btn', pkg.popular ? 'nc-btn-primary' : 'nc-btn-ghost', 'nc-btn-block')} data-edit="labels.packageCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
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

// ── About (the navigator) ────────────────────────────────────────────────────

function NcAbout({ data }: { data: TemplateData }) {
  const s = nocStrings(data.locale);
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="nc-section">
      <NcMark n={5} label={s.markAbout} />
      <div className="nc-wrap nc-about">
        <div className="nc-about-media">
          <Reveal y={26}>
            <figure className="nc-figure">
              <div className="nc-plate">
                <img src={about.image} alt={s.aboutImageAlt} className="nc-plate-img nc-about-img" data-edit="about.image" data-edit-type="image" />
                <span className="nc-plate-glow" aria-hidden="true" />
              </div>
            </figure>
          </Reveal>
          <Reveal delay={0.1} className="nc-instructor">
            <img src={instructor.photo} alt={instructor.name} className="nc-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div className="nc-instructor-id">
              <p className="nc-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p>
              <p className="nc-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
            </div>
          </Reveal>
        </div>
        <div className="nc-about-copy">
          <Reveal><p className="nc-eyebrow"><span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? s.aboutEyebrow}</span></p></Reveal>
          <NcMeteor><h2 className="nc-h2 nc-h2-tight" data-edit="about.heading" data-edit-type="text">{about.heading}</h2></NcMeteor>
          {about.body.map((p, i) => (
            <Reveal key={i} as="p" className="nc-body" delay={0.1 + i * 0.06}><span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span></Reveal>
          ))}
          <Reveal delay={0.22}>
            <ul className="nc-checklist">
              {about.checklist.map((item, i) => (
                <li key={i} data-edit-item={`about.checklist.${i}`}>
                  <span className="nc-star-bullet" aria-hidden="true">✦</span>
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          {instructor.bio && <Reveal as="p" className="nc-body" delay={0.26}><span data-edit="instructor.bio" data-edit-type="text">{instructor.bio}</span></Reveal>}
          {instructor.credentials.length > 0 && (
            <Reveal delay={0.3}>
              <div className="nc-creds">
                {instructor.credentials.map((c, i) => (
                  <span key={i} className="nc-cred" data-edit-item={`instructor.credentials.${i}`}>
                    <span className="nc-star-bullet nc-star-bullet-sm" aria-hidden="true">✦</span>
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

// ── Areas (territory known by starlight) ────────────────────────────────────

function NcAreas({ data }: { data: TemplateData }) {
  const s = nocStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="nc-section nc-band">
      <NcMark n={6} label={s.markAreas} />
      <div className="nc-wrap">
        <div className="nc-head">
          <Reveal><p className="nc-eyebrow"><span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? s.areasEyebrowNc}</span></p></Reveal>
          <NcMeteor><h2 className="nc-h2" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingNc}</h2></NcMeteor>
        </div>
        <ul className="nc-areas">
          {data.areas.map((area, i) => (
            <Reveal key={i} as="li" delay={(i % 4) * 0.04} className="nc-area" data-edit-item={`areas.${i}`}>
              <span className="nc-star-bullet nc-star-bullet-sm" aria-hidden="true">✦</span>
              <span className="nc-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              <span className="nc-leader" aria-hidden="true" />
              {area.note && <span className="nc-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Reviews (logbook entries from fellow travelers) ─────────────────────────

function NcReviews({ data }: { data: TemplateData }) {
  const s = nocStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="nc-section">
      <NcMark n={7} label={s.markReviews} />
      <div className="nc-wrap">
        <div className="nc-head">
          <Reveal><p className="nc-eyebrow"><span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? s.reviewsEyebrow}</span></p></Reveal>
          <NcMeteor><h2 className="nc-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingNc}</h2></NcMeteor>
        </div>
        <div className="nc-reviews">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06} className="nc-review" data-edit-item={`reviews.${i}`}>
              <span className="nc-quote-mark" aria-hidden="true">“</span>
              <NcStars n={r.rating} />
              <blockquote className="nc-review-text"><span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span></blockquote>
              {r.reply && (
                <p className="nc-review-reply">
                  <span className="nc-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                </p>
              )}
              <div className="nc-review-meta">
                {r.avatar && <img src={r.avatar} alt={r.name} className="nc-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                <div>
                  <p className="nc-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                  {r.meta && <p className="nc-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery (frames from the night drive) ───────────────────────────────────

function NcGallery({ data }: { data: TemplateData }) {
  const s = nocStrings(data.locale);
  return (
    <section className="nc-section nc-band">
      <NcMark n={8} label={s.markGallery} />
      <div className="nc-wrap">
        <div className="nc-head">
          <Reveal><p className="nc-eyebrow"><span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? s.galleryEyebrow}</span></p></Reveal>
          <NcMeteor><h2 className="nc-h2" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingNc}</h2></NcMeteor>
        </div>
        <div className="nc-gallery">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06} className="nc-gallery-cell" data-edit-item={`gallery.${i}`}>
              <img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ (notes before you set off) ──────────────────────────────────────────

function NcFaq({ data }: { data: TemplateData }) {
  const s = nocStrings(data.locale);
  const [open, setOpen] = useState<number | null>(0);
  const editing = useIsEditing();
  return (
    <section id={SECTION_IDS.faq} className="nc-section">
      <NcMark n={9} label={s.markFaq} />
      <div className="nc-wrap nc-faq-wrap">
        <div className="nc-head">
          <Reveal><p className="nc-eyebrow"><span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? s.faqEyebrow}</span></p></Reveal>
          <NcMeteor><h2 className="nc-h2" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingNc}</h2></NcMeteor>
        </div>
        <div className="nc-faq-list">
          {data.faqs.map((faq, i) => {
            const isOpen = editing || open === i;
            return (
              <div key={i} className="nc-faq-item" data-edit-item={`faqs.${i}`}>
                <button className="nc-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span data-edit={`faqs.${i}.q`} data-edit-type="text">{faq.q}</span>
                  <span className="nc-faq-ic" aria-hidden="true">{isOpen ? <Minus size={15} /> : <Plus size={15} />}</span>
                </button>
                <div className={cx('nc-faq-panel', isOpen && 'is-open')}>
                  <div className="nc-faq-panel-in"><p data-edit={`faqs.${i}.a`} data-edit-type="text">{faq.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Book (set your course — the strongest gold moment) ─────────────────────

function NcBook({ data }: { data: TemplateData }) {
  const s = nocStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="nc-section">
      <NcMark n={10} label={s.markBook} />
      <div className="nc-wrap">
        <Reveal className="nc-book">
          <NcCompass size={54} />
          <NcMeteor><h2 className="nc-h2" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingNc}</h2></NcMeteor>
          <p className="nc-lead" data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodyNc}</p>
          <div className="nc-book-ctas">
            {data.bookingUrl ? (
              <a href={data.bookingUrl} className="nc-btn nc-btn-primary" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></a>
            ) : (
              <button type="button" className="nc-btn nc-btn-primary" title={s.publishNote} disabled aria-disabled="true" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></button>
            )}
            {data.enrollUrl && <a href={data.enrollUrl} className="nc-btn nc-btn-ghost"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span></a>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer ────────────────────────────────────────────────────────

function NcContact({ data }: { data: TemplateData }) {
  const s = nocStrings(data.locale);
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="nc-footer">
      <NcMark n={11} label={s.markContact} />
      <div className="nc-wrap nc-footer-grid">
        <div>
          <p className="nc-eyebrow"><span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeading}</span></p>
          <div className="nc-contact-info">
            <a href={`tel:${contact.phone}`} className="nc-contact-link"><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span></a>
            <a href={`mailto:${contact.email}`} className="nc-contact-link"><DynamicIcon name={data.icons?.email ?? 'Mail'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span></a>
            <span className="nc-contact-link"><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span></span>
          </div>
          <div className="nc-socials">
            {socials.map((so, i) => (
              <a key={i} href={so.url} className="nc-social" target="_blank" rel="noreferrer" aria-label={so.platform} data-edit-item={`contact.socials.${i}`}>
                <SocialIcon platform={so.platform} size={16} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="nc-eyebrow"><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabel}</span></p>
          <table className="nc-hours">
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
      <div className="nc-wrap nc-footer-bottom">
        <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
        <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCredit}</span>
      </div>
    </footer>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function Nocturne({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts(['https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,500;1,600&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap']);
  const active = useScrollSpy(Object.values(SECTION_IDS));
  const rootRef = useRef<HTMLDivElement>(null);
  useCourseProgress(rootRef);

  return (
    <div ref={rootRef} className="tmpl-nocturne" dir={data.dir} style={data.theme as CSSProperties} data-edit="theme.bg" data-edit-type="background">
      {/* Decorative planes — absolute (never fixed), sit under the content plane. */}
      <NcStarfield />
      <NcCourseLine />
      <div className="nc-content">
        <NcNav data={data} active={active} />
        <main>
          <NcHero data={data} />
          <NcStats data={data} />
          <NcWhy data={data} />
          {data.packages.length > 0 && <NcPackages data={data} />}
          <NcAbout data={data} />
          <NcAreas data={data} />
          {data.reviews.length > 0 && <NcReviews data={data} />}
          {data.gallery.length > 0 && <NcGallery data={data} />}
          <NcFaq data={data} />
          <NcBook data={data} />
          <NcContact data={data} />
        </main>
      </div>
    </div>
  );
}

/**
 * Deco — the golden age of the automobile (1920s Art Deco). Motoring as
 * glamour: arrive in style, first-class instruction from the grand era of the
 * open road. Champagne-ivory paper, deep emerald + gold Art-Deco geometry —
 * ornate but tasteful, mostly LIGHT with jewel + gold detailing. Sunburst
 * fans, fluted gold hairlines, chevrons and symmetrical framing throughout.
 *
 * SIGNATURE (1/2) — the FLOOR DIAL: a brass "elevator floor-indicator" gauge,
 * pinned to the corner via `position: sticky` (NEVER fixed, so it can't
 * escape the builder's in-page scroll container). Its hand sweeps a
 * semicircle bound to a continuous scroll-progress CSS var (--dc-progress,
 * written directly to the DOM each frame — no re-render) while a readout
 * names the current "floor" (the section in view, from the shared scroll-spy).
 * Reduced motion → the var is set once to a static resting value and the
 * hand's CSS transition is removed, so nothing animates.
 *
 * SIGNATURE (2/2) — sunburst FANS unfold (scale + rotate) behind headings on
 * scroll-in, via the `Fan` wrapper below. Fluted gold hairlines + chevron
 * dividers frame the bands.
 *
 * Poiret One (Deco display — headings, numerals, the dial's floor readout) +
 * Jost (a geometric, deco-adjacent sans — body, nav, labels, buttons).
 * Palette via CSS vars on `.tmpl-deco`: --dc-ivory / --dc-ink / --dc-gold /
 * --dc-emerald / --dc-band. ONE accent (--dc-emerald, CTAs/links/active);
 * --dc-gold is ornament/geometry ONLY (fails AA contrast on the light paper —
 * see deco.css header for the verified ratios).
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { motion, useInView } from 'framer-motion';
import { Plus, Minus, Star, Menu, X, ArrowRight, Check } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { usePointerCoarse } from '../../lib/useDevice';
import { fmt } from '../strings';
import { decoStrings, type DecoStrings } from './strings';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, EnterMount, useCountUp, useMouseTilt, useIsEditing, reviewReplyLabel,
  usePrefersReducedMotion,
} from '../shared';
import './deco.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

function toRoman(n: number): string {
  const table: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let num = n, out = '';
  for (const [v, sym] of table) { while (num >= v) { out += sym; num -= v; } }
  return out;
}

// ── Deco ornament ────────────────────────────────────────────────────────────

/** Roman-numeral plate marking the real section order — decorative, aria-hidden. */
function Plate({ n }: { n: number }) {
  return <span className="dc-plate" aria-hidden="true">— {toRoman(n)} —</span>;
}

/**
 * SIGNATURE (2/2) — the sunburst fan. Wraps a section heading; on scroll-into-view
 * a radiating gold fan unfolds (scale 0.72→1, rotate -16°→0°) behind it. Built from
 * a repeating-conic-gradient clipped to a semicircle — no images, no animation
 * library. Reduced motion → rendered already-open, no transition (guarded in CSS).
 */
function Fan({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -14% 0px' });
  const open = reduced || inView;
  return (
    <div ref={ref} className={cx('dc-fan-wrap', className)}>
      <span className={cx('dc-fan', open && 'is-open')} aria-hidden="true" />
      {children}
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="dc-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill={i < n ? 'var(--dc-emerald)' : 'none'} color={i < n ? 'var(--dc-emerald)' : 'var(--dc-gold)'} />
      ))}
    </span>
  );
}

// ── The floor dial (SIGNATURE 1/2) ──────────────────────────────────────────

const DIAL_TICKS = [-90, -60, -30, 0, 30, 60, 90];

function dialFloors(s: DecoStrings) {
  return [
    { id: SECTION_IDS.hero, label: s.dialHero },
    { id: SECTION_IDS.stats, label: s.dialStats },
    { id: SECTION_IDS.packages, label: s.dialPackages },
    { id: SECTION_IDS.about, label: s.dialAbout },
    { id: SECTION_IDS.areas, label: s.dialAreas },
    { id: SECTION_IDS.reviews, label: s.dialReviews },
    { id: SECTION_IDS.faq, label: s.dialFaq },
    { id: SECTION_IDS.book, label: s.dialBook },
    { id: SECTION_IDS.contact, label: s.dialContact },
  ];
}

/**
 * Writes a 0→1 scroll-progress fraction straight to the hand's own CSS var
 * every frame (no React re-render). Detects the nearest genuinely-scrolling
 * ancestor of the template root exactly like `EnterTilt` in shared.tsx (a
 * container that merely declares `overflow-y:auto` but lets the window scroll
 * must be skipped), falling back to window/document scroll. A capture-phase
 * window listener hears scroll from the window AND any inner scroll container
 * (builder preview / Customize), whichever actually moves. Reduced motion →
 * the var is set once to a static resting value (needle parked center) and no
 * listeners are attached.
 */
function useDialProgress(handRef: RefObject<SVGLineElement>) {
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    const setVar = (v: number) => handRef.current?.style.setProperty('--dc-progress', String(v));
    if (reduced) { setVar(0.5); return; }
    const findScroller = (start: HTMLElement): HTMLElement | null => {
      let sp: HTMLElement | null = start.parentElement;
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
      const root = handRef.current?.closest('.tmpl-deco') as HTMLElement | null;
      if (!root) return;
      const sp = findScroller(root);
      let progress: number;
      if (sp) {
        progress = sp.scrollTop / Math.max(1, sp.scrollHeight - sp.clientHeight);
      } else {
        const doc = document.documentElement;
        progress = window.scrollY / Math.max(1, doc.scrollHeight - window.innerHeight);
      }
      setVar(Math.max(0, Math.min(1, progress)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(compute); };
    compute();
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

/**
 * `.dc-dial-anchor` is `position: sticky; height: 0`, placed as the FIRST
 * child of <main> (which spans the whole page) so its stick-range covers the
 * entire scroll — the visible case is absolutely positioned inside it. This
 * is the ONLY way the dial stays pinned in a corner without ever using
 * `position: fixed` (which would escape the builder's in-page preview frame).
 */
function DcDial({ data, active }: { data: TemplateData; active: string }) {
  const s = decoStrings(data.locale);
  const handRef = useRef<SVGLineElement>(null);
  useDialProgress(handRef);
  const floors = dialFloors(s).filter(
    (f) => (f.id !== SECTION_IDS.packages || data.packages.length > 0) && (f.id !== SECTION_IDS.reviews || data.reviews.length > 0)
  );
  const idx = Math.max(0, floors.findIndex((f) => f.id === active));
  const current = floors[idx] ?? floors[0];

  return (
    <div className="dc-dial-anchor" aria-hidden="true">
      <div className="dc-dial">
        <svg viewBox="0 0 160 92" className="dc-dial-face">
          <path d="M10,88 A70,70 0 0 1 150,88" className="dc-dial-arc" />
          {DIAL_TICKS.map((t, i) => (
            <line
              key={i}
              x1="80" y1="30" x2="80" y2="20"
              className={cx('dc-dial-tick', (i === 0 || i === DIAL_TICKS.length - 1) && 'is-major')}
              transform={`rotate(${t} 80 88)`}
            />
          ))}
          <line ref={handRef} x1="80" y1="88" x2="80" y2="38" className="dc-dial-hand" style={{ transformOrigin: '80px 88px' }} />
          <circle cx="80" cy="88" r="5" className="dc-dial-pivot" />
        </svg>
        <div className="dc-dial-readout">
          <span className="dc-dial-floor">{fmt(s.dialFloorLabel, { n: idx + 1 })}</span>
          <span className="dc-dial-label">{current?.label}</span>
        </div>
      </div>
    </div>
  );
}

// ── Nav (the theatre marquee) ────────────────────────────────────────────────

const navLinks = (s: DecoStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about, label: s.navAbout },
  { id: SECTION_IDS.areas, label: s.navAreas },
  { id: SECTION_IDS.reviews, label: s.navReviews },
  { id: SECTION_IDS.faq, label: s.navFaq },
];

function DcNav({ data, active }: { data: TemplateData; active: string }) {
  const s = decoStrings(data.locale);
  const [open, setOpen] = useState(false);
  const links = navLinks(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  return (
    <nav className="dc-nav" aria-label={s.mainNavAria}>
      <div className="dc-nav-inner">
        <button className="dc-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label={s.goToTopAria}>
          <span className="dc-logo-ring" data-edit="business.logoSrc" data-edit-type="image">
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={32} bg="var(--dc-ivory)" fg="var(--dc-emerald)" radius="50%" />
          </span>
          <span className="dc-logo-word" data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <div className="dc-nav-links">
          {links.map(({ id, label }) => (
            <button
              key={id}
              className={cx('dc-nav-link', active === id && 'is-active')}
              onClick={() => scrollToSection(id)}
              data-edit={`copy.nav_${id}`}
              data-edit-type="text"
            >
              {data.copy?.[`nav_${id}`] ?? label}
            </button>
          ))}
        </div>
        <div className="dc-nav-end">
          {data.accountUrl && (
            <a href={data.accountUrl} className="dc-btn dc-btn-ghost dc-btn-sm">{data.copy?.nav_account ?? s.navAccount}</a>
          )}
          <button className="dc-btn dc-btn-primary dc-btn-sm" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{bookLabel}</button>
          <button className="dc-menu" onClick={() => setOpen(!open)} aria-label={open ? s.menuCloseAria : s.menuOpenAria} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && (
        <div className="dc-nav-mobile">
          {links.map(({ id, label }) => <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{data.copy?.[`nav_${id}`] ?? label}</button>)}
          {data.accountUrl && <a href={data.accountUrl} className="dc-nav-mobile-link">{data.copy?.nav_account ?? s.navAccount}</a>}
        </div>
      )}
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function DcHero({ data }: { data: TemplateData }) {
  const s = decoStrings(data.locale);
  const { hero } = data;
  return (
    <section id={SECTION_IDS.hero} className="dc-hero">
      <div className="dc-wrap dc-hero-grid">
        <div className="dc-hero-copy">
          <Plate n={1} />
          <Reveal><p className="dc-eyebrow"><span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span></p></Reveal>
          <Fan><h1 className="dc-h1" data-edit="hero.headline" data-edit-type="text">{hero.headline}</h1></Fan>
          <div className="dc-hero-motto">
            <span className="dc-chevron-rule" aria-hidden="true" style={{ width: 44, margin: 0 }} />
            <span className="dc-hero-motto-text">{s.heroMotto}</span>
          </div>
          <Reveal as="p" className="dc-hero-sub" delay={0.12}><span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span></Reveal>
          <Reveal className="dc-hero-ctas" delay={0.18}>
            <button className="dc-btn dc-btn-primary" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{hero.ctaPrimary} <ArrowRight size={15} aria-hidden="true" /></button>
            <button className="dc-btn dc-btn-ghost" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>{hero.ctaSecondary}</button>
          </Reveal>
        </div>
        <div className="dc-hero-media">
          <EnterMount tilt={8} perspective={1500}>
            <figure className="dc-figure">
              <div className="dc-plate-frame">
                <img src={hero.image} alt={s.heroImageAlt} className="dc-plate-img" data-edit="hero.image" data-edit-type="image" />
              </div>
              <figcaption className="dc-caption">{s.heroCaption}</figcaption>
            </figure>
          </EnterMount>
        </div>
      </div>
    </section>
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value) ? Math.round(n).toLocaleString('en-US') : n.toFixed(1);
  return (
    <div ref={ref} className="dc-stat" data-edit-item={`stats.${index}`}>
      <span className="dc-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{formatted}{stat.suffix}</span>
      <span className="dc-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function DcStats({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.stats} className="dc-stats">
      <div className="dc-wrap dc-stats-row">{data.stats.map((st, i) => <StatItem key={i} stat={st} index={i} />)}</div>
    </section>
  );
}

// ── Why (the motoring life) ────────────────────────────────────────────────────

const features = (s: DecoStrings) => [
  { icon: 'Compass', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function DcWhy({ data }: { data: TemplateData }) {
  const s = decoStrings(data.locale);
  return (
    <section className="dc-section dc-band">
      <div className="dc-wrap">
        <div className="dc-head">
          <Plate n={3} />
          <Reveal><p className="dc-eyebrow"><span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? s.whyEyebrowDc}</span></p></Reveal>
          <Fan><h2 className="dc-h2" data-edit="copy.whyHeading" data-edit-type="text">{data.copy?.whyHeading ?? s.whyHeadingDc}</h2></Fan>
        </div>
        <span className="dc-chevron-rule is-center" aria-hidden="true" />
        <div className="dc-why-grid">
          {features(s).map((f, i) => (
            <Reveal key={i} delay={i * 0.06} className="dc-why">
              <span className="dc-why-icon"><DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={20} strokeWidth={1.5} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" /></span>
              <h3 className="dc-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">{data.copy?.[f.titleKey] ?? f.title}</h3>
              <p className="dc-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">{data.copy?.[f.bodyKey] ?? f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages (stepped Deco plaques; popular gets an emerald rim) ──────────────

function PkgCard({ data, pkg, index }: { data: TemplateData; pkg: TemplateData['packages'][number]; index: number }) {
  const s = decoStrings(data.locale);
  const { labels } = data;
  const coarse = usePointerCoarse();
  const { ref, rotateX, rotateY, onMouseMove, onMouseLeave } = useMouseTilt(5);
  const tilt = coarse ? {} : { ref, onMouseMove, onMouseLeave, style: { rotateX, rotateY, transformPerspective: 1000 } };
  return (
    <Reveal delay={index * 0.06} data-edit-item={`packages.${index}`}>
      <motion.div {...tilt} className={cx('dc-pkg', pkg.popular && 'is-popular')}>
        {pkg.popular && <span className="dc-pkg-badge" data-edit={`packages.${index}.badge`} data-edit-type="text">{pkg.badge ?? s.badgePopular}</span>}
        <p className="dc-pkg-name" data-edit={`packages.${index}.name`} data-edit-type="text">{pkg.name}</p>
        <p className="dc-pkg-price">
          <span className="dc-pkg-amount" data-edit={`packages.${index}.price`} data-edit-type="text">₪{pkg.price}</span>
          {pkg.unit && <span className="dc-pkg-unit" data-edit={`packages.${index}.unit`} data-edit-type="text">{pkg.unit}</span>}
        </p>
        <ul className="dc-pkg-features">
          {pkg.features.map((f, fi) => (
            <li key={fi}><Check size={14} className="dc-check" aria-hidden="true" /><span data-edit={`packages.${index}.features.${fi}`} data-edit-type="text">{f}</span></li>
          ))}
        </ul>
        <button className={cx('dc-btn', pkg.popular ? 'dc-btn-primary' : 'dc-btn-ghost', 'dc-btn-block')} data-edit="labels.packageCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
          {pkg.popular ? (labels?.packageCtaPopular ?? labels?.packageCta ?? s.bookThisPlan) : (labels?.packageCta ?? s.packageCta)}
        </button>
      </motion.div>
    </Reveal>
  );
}

function DcPackages({ data }: { data: TemplateData }) {
  const s = decoStrings(data.locale);
  return (
    <section id={SECTION_IDS.packages} className="dc-section">
      <div className="dc-wrap">
        <div className="dc-head">
          <Plate n={4} />
          <Reveal><p className="dc-eyebrow"><span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? s.packagesEyebrow}</span></p></Reveal>
          <Fan><h2 className="dc-h2" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingDc}</h2></Fan>
          <Reveal as="p" className="dc-lead" delay={0.12}><span data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubDc}</span></Reveal>
        </div>
        <div className="dc-pkg-grid">
          {data.packages.map((pkg, i) => <PkgCard key={pkg.id} data={data} pkg={pkg} index={i} />)}
        </div>
      </div>
    </section>
  );
}

// ── About ─────────────────────────────────────────────────────────────────────

function DcAbout({ data }: { data: TemplateData }) {
  const s = decoStrings(data.locale);
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="dc-section dc-band">
      <div className="dc-wrap dc-about">
        <div className="dc-about-media">
          <Reveal y={26}>
            <figure className="dc-figure">
              <div className="dc-plate-frame">
                <img src={about.image} alt={s.aboutImageAlt} className="dc-plate-img dc-about-img" data-edit="about.image" data-edit-type="image" />
              </div>
            </figure>
          </Reveal>
          <Reveal delay={0.1} className="dc-instructor">
            <img src={instructor.photo} alt={instructor.name} className="dc-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div className="dc-instructor-id">
              <p className="dc-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p>
              <p className="dc-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
            </div>
          </Reveal>
        </div>
        <div className="dc-about-copy">
          <Plate n={5} />
          <Reveal><p className="dc-eyebrow"><span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? s.aboutEyebrow}</span></p></Reveal>
          <Fan><h2 className="dc-h2 dc-h2-tight" data-edit="about.heading" data-edit-type="text">{about.heading}</h2></Fan>
          {about.body.map((p, i) => (
            <Reveal key={i} as="p" className="dc-body" delay={0.1 + i * 0.06}><span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span></Reveal>
          ))}
          <Reveal delay={0.22}>
            <ul className="dc-checklist">
              {about.checklist.map((item, i) => (
                <li key={i} data-edit-item={`about.checklist.${i}`}>
                  <Check size={15} strokeWidth={2} className="dc-check" aria-hidden="true" />
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          {instructor.bio && <Reveal as="p" className="dc-body" delay={0.26}><span data-edit="instructor.bio" data-edit-type="text">{instructor.bio}</span></Reveal>}
          {instructor.credentials.length > 0 && (
            <Reveal delay={0.3}>
              <div className="dc-creds">
                {instructor.credentials.map((c, i) => (
                  <span key={i} className="dc-cred" data-edit-item={`instructor.credentials.${i}`}>
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

// ── Areas (a two-column ruled index with gold dotted leaders) ─────────────────

function DcAreas({ data }: { data: TemplateData }) {
  const s = decoStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="dc-section">
      <div className="dc-wrap">
        <div className="dc-head">
          <Plate n={6} />
          <Reveal><p className="dc-eyebrow"><span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? s.areasEyebrowDc}</span></p></Reveal>
          <Fan><h2 className="dc-h2" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingDc}</h2></Fan>
        </div>
        <ul className="dc-areas">
          {data.areas.map((area, i) => (
            <Reveal key={i} as="li" delay={(i % 4) * 0.04} className="dc-area" data-edit-item={`areas.${i}`}>
              <span className="dc-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              <span className="dc-leader" aria-hidden="true" />
              {area.note && <span className="dc-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Reviews ───────────────────────────────────────────────────────────────────

function DcReviews({ data }: { data: TemplateData }) {
  const s = decoStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="dc-section dc-band">
      <div className="dc-wrap">
        <div className="dc-head">
          <Plate n={7} />
          <Reveal><p className="dc-eyebrow"><span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? s.reviewsEyebrow}</span></p></Reveal>
          <Fan><h2 className="dc-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingDc}</h2></Fan>
        </div>
        <div className="dc-reviews">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06} className="dc-review" data-edit-item={`reviews.${i}`}>
              <span className="dc-quote-mark" aria-hidden="true">“</span>
              <Stars n={r.rating} />
              <blockquote className="dc-review-text"><span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span></blockquote>
              {r.reply && (
                <p className="dc-review-reply">
                  <span className="dc-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                </p>
              )}
              <div className="dc-review-meta">
                {r.avatar && <img src={r.avatar} alt={r.name} className="dc-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                <div>
                  <p className="dc-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                  {r.meta && <p className="dc-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
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

function DcGallery({ data }: { data: TemplateData }) {
  const s = decoStrings(data.locale);
  return (
    <section className="dc-section">
      <div className="dc-wrap">
        <div className="dc-head">
          <Plate n={8} />
          <Reveal><p className="dc-eyebrow"><span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? s.galleryEyebrow}</span></p></Reveal>
          <Fan><h2 className="dc-h2" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingDc}</h2></Fan>
        </div>
        <div className="dc-gallery">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06} className="dc-gallery-cell" data-edit-item={`gallery.${i}`}>
              <img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ (ruled rows) ────────────────────────────────────────────────────────────

function DcFaq({ data }: { data: TemplateData }) {
  const s = decoStrings(data.locale);
  const [open, setOpen] = useState<number | null>(0);
  const editing = useIsEditing();
  return (
    <section id={SECTION_IDS.faq} className="dc-section dc-band">
      <div className="dc-wrap dc-faq-wrap">
        <div className="dc-head">
          <Plate n={9} />
          <Reveal><p className="dc-eyebrow"><span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? s.faqEyebrow}</span></p></Reveal>
          <Fan><h2 className="dc-h2" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingDc}</h2></Fan>
        </div>
        <div className="dc-faq-list">
          {data.faqs.map((faq, i) => {
            const isOpen = editing || open === i;
            return (
              <div key={i} className="dc-faq-item" data-edit-item={`faqs.${i}`}>
                <button className="dc-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span data-edit={`faqs.${i}.q`} data-edit-type="text">{faq.q}</span>
                  <span className="dc-faq-ic" aria-hidden="true">{isOpen ? <Minus size={15} /> : <Plus size={15} />}</span>
                </button>
                <div className={cx('dc-faq-panel', isOpen && 'is-open')}>
                  <div className="dc-faq-panel-in"><p data-edit={`faqs.${i}.a`} data-edit-type="text">{faq.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Book (the formal invitation) ────────────────────────────────────────────────

function DcBook({ data }: { data: TemplateData }) {
  const s = decoStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="dc-section">
      <div className="dc-wrap">
        <Reveal className="dc-book">
          <Plate n={10} />
          <Fan><h2 className="dc-h2" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingDc}</h2></Fan>
          <p className="dc-lead" data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodyDc}</p>
          <div className="dc-book-ctas">
            {data.bookingUrl ? (
              <a href={data.bookingUrl} className="dc-btn dc-btn-primary" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></a>
            ) : (
              <button type="button" className="dc-btn dc-btn-primary" title={s.publishNote} disabled aria-disabled="true" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></button>
            )}
            {data.enrollUrl && <a href={data.enrollUrl} className="dc-btn dc-btn-ghost"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span></a>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer ─────────────────────────────────────────────────────────────

function DcContact({ data }: { data: TemplateData }) {
  const s = decoStrings(data.locale);
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="dc-footer">
      <div className="dc-wrap dc-footer-grid">
        <div>
          <p className="dc-eyebrow"><span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeading}</span></p>
          <div className="dc-contact-info">
            <a href={`tel:${contact.phone}`} className="dc-contact-link"><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span></a>
            <a href={`mailto:${contact.email}`} className="dc-contact-link"><DynamicIcon name={data.icons?.email ?? 'Mail'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span></a>
            <span className="dc-contact-link"><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span></span>
          </div>
          <div className="dc-socials">
            {socials.map((so, i) => (
              <a key={i} href={so.url} className="dc-social" target="_blank" rel="noreferrer" aria-label={so.platform} data-edit-item={`contact.socials.${i}`}>
                <SocialIcon platform={so.platform} size={16} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="dc-eyebrow"><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabel}</span></p>
          <table className="dc-hours">
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
      <div className="dc-wrap dc-footer-bottom">
        <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
        <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCredit}</span>
      </div>
    </footer>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function Deco({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts(['https://fonts.googleapis.com/css2?family=Poiret+One&family=Jost:wght@400;500;600;700&display=swap']);
  const active = useScrollSpy(Object.values(SECTION_IDS));
  return (
    <div className="tmpl-deco" dir={data.dir} style={data.theme as CSSProperties} data-edit="theme.bg" data-edit-type="background">
      <DcNav data={data} active={active} />
      <main>
        <DcDial data={data} active={active} />
        <DcHero data={data} />
        <DcStats data={data} />
        <DcWhy data={data} />
        {data.packages.length > 0 && <DcPackages data={data} />}
        <DcAbout data={data} />
        <DcAreas data={data} />
        {data.reviews.length > 0 && <DcReviews data={data} />}
        {data.gallery.length > 0 && <DcGallery data={data} />}
        <DcFaq data={data} />
        <DcBook data={data} />
        <DcContact data={data} />
      </main>
    </div>
  );
}

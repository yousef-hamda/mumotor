/**
 * Transit — a metro wayfinding system. The learner's journey is a LINE and every
 * section is a STOP: clean signage off-white, a strong grid, one bold coloured
 * line, TfL-style roundel nodes, and Highway-Gothic signage type (Overpass). In
 * the spirit of the London Underground / NYC MTA / Berlin U-Bahn — iconic,
 * systematic, confident, trustworthy. NOT glassy, NOT gradient.
 *
 * SIGNATURE (the one bold thing): a bold coloured transit LINE threads down the
 * inline-start margin with roundel STOP nodes, and a "you are here" SERVICE marker
 * TRAVELS along it as you scroll — CSS Motion Path (`offset-path` + `offset-distance:
 * var(--tr-prog)`), with progress written from `useScroll` in one coalesced rAF
 * (like circuit's car). Each stop node "arrives" (fills with the line colour) as the
 * service passes it. Under reduced motion the service is parked at the first stop,
 * all nodes shown, and no scroll listener is registered. The line is
 * `pointer-events:none`, low z-index (behind content), and gated to wide viewports
 * so it never overlaps the content column or adds page width.
 *
 * Overpass (a Highway-Gothic-derived signage face) for display / body / labels /
 * nav, with tabular-nums for numbers. Palette via CSS vars on `.tmpl-transit`:
 * --tr-bg / --tr-ink / --tr-line (the ONE accent — the route colour) / --tr-line2
 * (a second route colour, graphic accents) / --tr-band. Tints derive via color-mix,
 * so Customize recolouring never breaks.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { motion, useInView, useScroll, type MotionValue } from 'framer-motion';
import { Plus, Minus, Star, Menu, X, ArrowRight, Check } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { trStrings, type TrStrings } from './strings';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, useCountUp, useIsEditing, reviewReplyLabel,
  usePrefersReducedMotion,
} from '../shared';
import './transit.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

/**
 * A one-shot entrance that plays ON MOUNT (page load) — so the hero "station
 * poster" actually animates as it appears, rather than a scroll-scrub which is
 * pre-settled for a top-of-page hero and only reads once you scroll past it.
 */
function EnterMount({ children, className, delay = 0.12 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <div className={className} style={{ perspective: 1400 }}>
      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay }}
        style={{ willChange: 'transform' }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * SIGNATURE — the line diagram. A vertical metro LINE (viewBox 0 0 170 640, drawn
 * 1:1 so the service's Motion Path aligns pixel-for-pixel) with roundel STOP nodes,
 * and a "you are here" service marker riding it via CSS Motion Path. Progress is
 * written to --tr-prog on the root in one rAF; nodes fill as the service passes.
 * ⚠️ LINE_D MUST stay byte-identical to `.tr-service { offset-path: path(...) }`
 * in transit.css. Decorative (aria-hidden).
 */
const LINE_D = 'M 30 24 L 30 150 L 64 184 L 64 300 L 30 334 L 30 470 L 64 504 L 64 616';
/** [x, y, arrive-threshold(0..1), labelKey] — nodes sit on the line's straights. */
const STOP_NODES: [number, number, number][] = [
  [30, 44, 0.04],
  [30, 120, 0.15],
  [64, 244, 0.37],
  [30, 402, 0.64],
  [64, 540, 0.88],
  [64, 604, 0.98],
];

function TransitLine({ progress, rootRef, s }: { progress: MotionValue<number>; rootRef: RefObject<HTMLDivElement>; s: TrStrings }) {
  const reduced = usePrefersReducedMotion();
  const nodeRefs = useRef<(SVGGElement | null)[]>([]);
  const labels = [s.stopStart, s.navPackages, s.navAbout, s.navAreas, s.navReviews, s.stopDestination];

  useEffect(() => {
    const paint = (p: number) => {
      // The service reads the inherited var: offset-distance: var(--tr-prog).
      rootRef.current?.style.setProperty('--tr-prog', `${(p * 100).toFixed(2)}%`);
      STOP_NODES.forEach(([, , t], i) => {
        nodeRefs.current[i]?.classList.toggle('is-arrived', p >= t - 0.001);
      });
    };
    if (reduced) { paint(0.04); return; } // parked at the first stop; nodes handled below
    let raf = 0;
    let pending = progress.get();
    const flush = () => { raf = 0; paint(pending); };
    const onChange = (v: number) => { pending = v; if (!raf) raf = requestAnimationFrame(flush); };
    const unsub = progress.on('change', onChange);
    paint(pending);
    return () => { unsub(); if (raf) cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  return (
    <div className="tr-line-plane" aria-hidden="true">
      <div className="tr-line-tag">
        <span className="tr-line-badge">01</span>
        <span className="tr-line-name">{s.lineName}</span>
      </div>
      <div className="tr-line-wrap">
        <svg className="tr-line-svg" viewBox="0 0 170 640" aria-hidden="true" focusable="false">
          <path d={LINE_D} className="tr-line-stroke" fill="none" />
          {STOP_NODES.map(([x, y], i) => (
            <g key={i} className={cx('tr-node', reduced && 'is-arrived')} ref={(el) => { nodeRefs.current[i] = el; }}>
              <circle cx={x} cy={y} r="7.5" className="tr-node-ring" />
              <circle cx={x} cy={y} r="3" className="tr-node-core" />
              <text x={x + 15} y={y + 3.5} className="tr-node-label">{labels[i]}</text>
            </g>
          ))}
        </svg>
        <div className="tr-service" />
      </div>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="tr-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill={i < n ? 'var(--tr-line)' : 'none'} color={i < n ? 'var(--tr-line)' : 'var(--tr-hair)'} />
      ))}
    </span>
  );
}

// ── Nav — the transit service bar ─────────────────────────────────────────────

const navLinks = (s: TrStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about, label: s.navAbout },
  { id: SECTION_IDS.areas, label: s.navAreas },
  { id: SECTION_IDS.reviews, label: s.navReviews },
  { id: SECTION_IDS.faq, label: s.navFaq },
];

function TrNav({ data, active }: { data: TemplateData; active: string }) {
  const s = trStrings(data.locale);
  const [open, setOpen] = useState(false);
  const links = navLinks(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  return (
    <nav className="tr-nav" aria-label={s.mainNavAria}>
      <div className="tr-nav-inner">
        <button className="tr-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label={s.goToTopAria}>
          <span className="tr-roundel">
            <span className="tr-roundel-bar" aria-hidden="true" />
            <span className="tr-roundel-mark" data-edit="business.logoSrc" data-edit-type="image">
              <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={30} bg="var(--tr-line)" fg="#ffffff" radius="50%" ring={false} />
            </span>
          </span>
          <span className="tr-logo-word" data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <div className="tr-nav-links">
          {links.map(({ id, label }) => (
            <button
              key={id}
              className={cx('tr-nav-link', active === id && 'is-active')}
              onClick={() => scrollToSection(id)}
              data-edit={`copy.nav_${id}`}
              data-edit-type="text"
            >
              <span className="tr-nav-node" aria-hidden="true" />
              {data.copy?.[`nav_${id}`] ?? label}
            </button>
          ))}
        </div>
        <div className="tr-nav-end">
          {data.accountUrl && (
            <a href={data.accountUrl} className="tr-btn tr-btn-ghost tr-btn-sm">{data.copy?.nav_account ?? s.navAccount}</a>
          )}
          <button className="tr-btn tr-btn-primary tr-btn-sm tr-ticket" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{bookLabel}</button>
          <button className="tr-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      <span className="tr-nav-line" aria-hidden="true" />
      {open && (
        <div className="tr-nav-mobile">
          {links.map(({ id, label }) => (
            <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>
              <span className="tr-nav-node" aria-hidden="true" />{label}
            </button>
          ))}
          {data.accountUrl && <a href={data.accountUrl} className="tr-nav-mobile-link"><span className="tr-nav-node" aria-hidden="true" />{data.copy?.nav_account ?? s.navAccount}</a>}
        </div>
      )}
    </nav>
  );
}

// ── Hero — signage headline | station-poster plate ────────────────────────────

function TrHero({ data }: { data: TemplateData }) {
  const s = trStrings(data.locale);
  const { hero } = data;
  return (
    <section id={SECTION_IDS.hero} className="tr-section tr-hero">
      <div className="tr-wrap tr-hero-grid">
        <div className="tr-hero-copy">
          <Reveal><p className="tr-eyebrow tr-eyebrow-strip"><span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h1 className="tr-h1" data-edit="hero.headline" data-edit-type="text">{hero.headline}</h1></Reveal>
          <Reveal as="p" className="tr-hero-sub" delay={0.12}><span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span></Reveal>
          <Reveal className="tr-route-chip" delay={0.16}>
            <span className="tr-route-end">{s.heroRouteFrom}</span>
            <span className="tr-route-track" aria-hidden="true"><span className="tr-route-dot tr-route-dot-a" /><span className="tr-route-dot tr-route-dot-b" /></span>
            <span className="tr-route-end tr-route-end-to">{s.heroRouteTo}</span>
          </Reveal>
          <Reveal className="tr-hero-ctas" delay={0.2}>
            <button className="tr-btn tr-btn-primary tr-ticket" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{hero.ctaPrimary} <ArrowRight size={15} aria-hidden="true" /></button>
            <button className="tr-btn tr-btn-ghost" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>{hero.ctaSecondary}</button>
          </Reveal>
        </div>
        <div className="tr-hero-media">
          <EnterMount>
            <figure className="tr-figure">
              <div className="tr-poster">
                <img src={hero.image} alt={s.heroImageAlt} className="tr-poster-img" data-edit="hero.image" data-edit-type="image" />
                <span className="tr-poster-tag" aria-hidden="true"><span className="tr-poster-node" />{s.serviceLabel}</span>
              </div>
              <figcaption className="tr-caption">{s.heroCaption}</figcaption>
            </figure>
          </EnterMount>
        </div>
      </div>
    </section>
  );
}

// ── Stats — roundel readouts ──────────────────────────────────────────────────

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value) ? Math.round(n).toLocaleString('en-US') : n.toFixed(1);
  return (
    <div ref={ref} className="tr-stat" data-edit-item={`stats.${index}`}>
      <span className="tr-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{formatted}{stat.suffix}</span>
      <span className="tr-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function TrStats({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.stats} className="tr-stats">
      <div className="tr-wrap tr-stats-row">{data.stats.map((st, i) => <StatItem key={i} stat={st} index={i} />)}</div>
    </section>
  );
}

// ── Why — "on this service" ───────────────────────────────────────────────────

const features = (s: TrStrings) => [
  { icon: 'Route', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function TrWhy({ data }: { data: TemplateData }) {
  const s = trStrings(data.locale);
  return (
    <section className="tr-section">
      <div className="tr-wrap">
        <Reveal><p className="tr-eyebrow"><span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? s.whyEyebrowTr}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="tr-h2" data-edit="copy.whyHeading" data-edit-type="text">{data.copy?.whyHeading ?? s.whyHeadingTr}</h2></Reveal>
        <div className="tr-why-grid">
          {features(s).map((f, i) => (
            <Reveal key={i} delay={i * 0.06} className="tr-why">
              <span className="tr-why-icon"><DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={22} strokeWidth={2} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" /></span>
              <h3 className="tr-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">{data.copy?.[f.titleKey] ?? f.title}</h3>
              <p className="tr-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">{data.copy?.[f.bodyKey] ?? f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages — fare / ticket cards ────────────────────────────────────────────

function TrPackages({ data }: { data: TemplateData }) {
  const s = trStrings(data.locale);
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="tr-section tr-band">
      <div className="tr-wrap">
        <Reveal><p className="tr-eyebrow"><span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? s.packagesEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="tr-h2" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingTr}</h2></Reveal>
        <Reveal as="p" className="tr-lead" delay={0.12}><span data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubTr}</span></Reveal>
        <div className="tr-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.06} data-edit-item={`packages.${i}`}>
              <div className={cx('tr-pkg', pkg.popular && 'is-popular')}>
                {pkg.popular && <span className="tr-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge ?? s.badgePopular}</span>}
                <p className="tr-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                <p className="tr-pkg-price">
                  <span className="tr-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">₪{pkg.price}</span>
                  {pkg.unit && <span className="tr-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                </p>
                <span className="tr-pkg-rule" aria-hidden="true" />
                <ul className="tr-pkg-features">
                  {pkg.features.map((f, fi) => (
                    <li key={fi}><Check size={15} className="tr-check" aria-hidden="true" /><span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span></li>
                  ))}
                </ul>
                <button className={cx('tr-btn', pkg.popular ? 'tr-btn-primary' : 'tr-btn-ghost', 'tr-btn-block')} data-edit="labels.packageCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
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

function TrAbout({ data }: { data: TemplateData }) {
  const s = trStrings(data.locale);
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="tr-section">
      <div className="tr-wrap tr-about">
        <div className="tr-about-media">
          <Reveal y={26}>
            <figure className="tr-figure">
              <div className="tr-poster">
                <img src={about.image} alt={s.aboutImageAlt} className="tr-poster-img tr-about-img" data-edit="about.image" data-edit-type="image" />
              </div>
            </figure>
          </Reveal>
          <Reveal delay={0.1} className="tr-instructor">
            <img src={instructor.photo} alt={instructor.name} className="tr-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div className="tr-instructor-id">
              <p className="tr-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p>
              <p className="tr-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
            </div>
          </Reveal>
        </div>
        <div className="tr-about-copy">
          <Reveal><p className="tr-eyebrow"><span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? s.aboutEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="tr-h2 tr-h2-tight" data-edit="about.heading" data-edit-type="text">{about.heading}</h2></Reveal>
          {about.body.map((p, i) => (
            <Reveal key={i} as="p" className="tr-body" delay={0.1 + i * 0.06}><span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span></Reveal>
          ))}
          <Reveal delay={0.22}>
            <ul className="tr-checklist">
              {about.checklist.map((item, i) => (
                <li key={i} data-edit-item={`about.checklist.${i}`}>
                  <span className="tr-check-node" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          {instructor.bio && <Reveal as="p" className="tr-body" delay={0.26}><span data-edit="instructor.bio" data-edit-type="text">{instructor.bio}</span></Reveal>}
          {instructor.credentials.length > 0 && (
            <Reveal delay={0.3}>
              <div className="tr-creds">
                {instructor.credentials.map((c, i) => (
                  <span key={i} className="tr-cred" data-edit-item={`instructor.credentials.${i}`}>
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

// ── Areas — stops served ──────────────────────────────────────────────────────

function TrAreas({ data }: { data: TemplateData }) {
  const s = trStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="tr-section tr-band">
      <div className="tr-wrap">
        <Reveal><p className="tr-eyebrow"><span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? s.areasEyebrowTr}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="tr-h2" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingTr}</h2></Reveal>
        <ul className="tr-areas">
          {data.areas.map((area, i) => (
            <Reveal key={i} as="li" delay={(i % 4) * 0.04} className="tr-area" data-edit-item={`areas.${i}`}>
              <span className="tr-area-node" aria-hidden="true" />
              <span className="tr-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              {area.note && <span className="tr-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Reviews — passenger cards ─────────────────────────────────────────────────

function TrReviews({ data }: { data: TemplateData }) {
  const s = trStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="tr-section">
      <div className="tr-wrap">
        <Reveal><p className="tr-eyebrow"><span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? s.reviewsEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="tr-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingTr}</h2></Reveal>
        <div className="tr-reviews">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06} className="tr-review" data-edit-item={`reviews.${i}`}>
              <Stars n={r.rating} />
              <blockquote className="tr-review-text">“<span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span>”</blockquote>
              {r.reply && (
                <p className="tr-review-reply">
                  <span className="tr-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                </p>
              )}
              <div className="tr-review-meta">
                {r.avatar && <img src={r.avatar} alt={r.name} className="tr-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                <div>
                  <p className="tr-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                  {r.meta && <p className="tr-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
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

function TrGallery({ data }: { data: TemplateData }) {
  const s = trStrings(data.locale);
  return (
    <section className="tr-section">
      <div className="tr-wrap">
        <Reveal><p className="tr-eyebrow"><span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? s.galleryEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="tr-h2" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingTr}</h2></Reveal>
        <div className="tr-gallery">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06} className="tr-gallery-cell" data-edit-item={`gallery.${i}`}>
              <img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ — passenger information ───────────────────────────────────────────────

function TrFaq({ data }: { data: TemplateData }) {
  const s = trStrings(data.locale);
  const [open, setOpen] = useState<number | null>(0);
  const editing = useIsEditing();
  return (
    <section id={SECTION_IDS.faq} className="tr-section tr-band">
      <div className="tr-wrap tr-faq-wrap">
        <Reveal><p className="tr-eyebrow"><span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? s.faqEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="tr-h2" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingTr}</h2></Reveal>
        <div className="tr-faq-list">
          {data.faqs.map((faq, i) => {
            const isOpen = editing || open === i;
            return (
              <div key={i} className="tr-faq-item" data-edit-item={`faqs.${i}`}>
                <button className="tr-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span data-edit={`faqs.${i}.q`} data-edit-type="text">{faq.q}</span>
                  <span className="tr-faq-ic" aria-hidden="true">{isOpen ? <Minus size={16} /> : <Plus size={16} />}</span>
                </button>
                <div className={cx('tr-faq-panel', isOpen && 'is-open')}>
                  <div className="tr-faq-panel-in"><p data-edit={`faqs.${i}.a`} data-edit-type="text">{faq.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Book — the destination panel ──────────────────────────────────────────────

function TrBook({ data }: { data: TemplateData }) {
  const s = trStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="tr-book-section">
      <div className="tr-wrap">
        <Reveal className="tr-book">
          <span className="tr-book-node" aria-hidden="true"><span /></span>
          <h2 className="tr-h2 tr-book-h" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingTr}</h2>
          <p className="tr-book-body" data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodyTr}</p>
          <div className="tr-book-ctas">
            {data.bookingUrl ? (
              <a href={data.bookingUrl} className="tr-btn tr-btn-onsolid tr-ticket" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></a>
            ) : (
              <button type="button" className="tr-btn tr-btn-onsolid tr-ticket" title={s.publishNote} disabled aria-disabled="true" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></button>
            )}
            {data.enrollUrl && <a href={data.enrollUrl} className="tr-btn tr-btn-onsolid-ghost"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span></a>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer — the service board ──────────────────────────────────────

function TrContact({ data }: { data: TemplateData }) {
  const s = trStrings(data.locale);
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="tr-footer">
      <span className="tr-footer-line" aria-hidden="true" />
      <div className="tr-wrap tr-footer-grid">
        <div>
          <p className="tr-eyebrow"><span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeading}</span></p>
          <div className="tr-contact-info">
            <a href={`tel:${contact.phone}`} className="tr-contact-link"><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={16} strokeWidth={2} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span></a>
            <a href={`mailto:${contact.email}`} className="tr-contact-link"><DynamicIcon name={data.icons?.email ?? 'Mail'} size={16} strokeWidth={2} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span></a>
            <span className="tr-contact-link"><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={16} strokeWidth={2} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span></span>
          </div>
          <div className="tr-socials">
            {socials.map((so, i) => (
              <a key={i} href={so.url} className="tr-social" target="_blank" rel="noreferrer" aria-label={so.platform} data-edit-item={`contact.socials.${i}`}>
                <SocialIcon platform={so.platform} size={16} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="tr-eyebrow"><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabel}</span></p>
          <table className="tr-hours">
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
      <div className="tr-wrap tr-footer-bottom">
        <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
        <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCredit}</span>
      </div>
    </footer>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function Transit({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts(['https://fonts.googleapis.com/css2?family=Overpass:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap']);
  const active = useScrollSpy(Object.values(SECTION_IDS));
  const s = trStrings(data.locale);
  const rootRef = useRef<HTMLDivElement>(null);
  // Service progress: works in the window AND in the builder's inner scroll container.
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ['start start', 'end end'] });

  return (
    <div ref={rootRef} className="tmpl-transit" dir={data.dir} style={data.theme as CSSProperties} data-edit="theme.bg" data-edit-type="background">
      {/* SIGNATURE — the line diagram (fixed, behind content, scroll-driven service) */}
      <TransitLine progress={scrollYProgress} rootRef={rootRef} s={s} />
      <div className="tr-content">
        <TrNav data={data} active={active} />
        <main>
          <TrHero data={data} />
          <TrStats data={data} />
          <TrWhy data={data} />
          {data.packages.length > 0 && <TrPackages data={data} />}
          <TrAbout data={data} />
          <TrAreas data={data} />
          {data.reviews.length > 0 && <TrReviews data={data} />}
          {data.gallery.length > 0 && <TrGallery data={data} />}
          <TrFaq data={data} />
          <TrBook data={data} />
          <TrContact data={data} />
        </main>
      </div>
    </div>
  );
}

/**
 * Circuit — motorsport pit-wall telemetry. A driving lesson framed as a race
 * weekend: carbon-fibre dark, racing red, one live timing-green. Broadcast
 * graphics, not a video game — precise, data-rich, exciting, but elegant.
 *
 * SIGNATURE (the one bold thing): a car drives a stylised circuit as you scroll,
 * with a live timing tower. A fixed pit-wall panel (≥1180px) holds a hand-authored
 * closed-loop track; a red chevron rides it via CSS Motion Path, its
 * `offset-distance` bound to `--ci-prog` which we write from scroll progress
 * (coalesced in one rAF). A timing tower counts up a plausible lap time and turns
 * three sector splits green as the car passes each third of the lap. Under
 * reduced-motion the car sits at start/finish, the tower shows final values, and
 * no scroll listener is registered.
 *
 * Saira (technical grotesque) for headings/numerals · Chivo Mono (tabular
 * telemetry) for data/eyebrows/nav/timing · Public Sans for body.
 *
 * Palette via CSS vars on `.tmpl-circuit`: --ci-carbon (page) / --ci-panel
 * (cards) / --ci-ink (text) / --ci-red (the ONE accent) / --ci-green (live/status
 * only). Every tint derives via color-mix from those, so Customize recolouring
 * never breaks.
 */
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { useInView, useScroll, type MotionValue } from 'framer-motion';
import { Plus, Minus, Star, Menu, X, ArrowRight, Check } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { ciStrings, type CiStrings } from './strings';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, EnterMount, useCountUp, useIsEditing, reviewReplyLabel,
  usePrefersReducedMotion,
} from '../shared';
import './circuit.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

/**
 * Hand-authored closed-loop circuit: two straights, four rounded corners and a
 * chicane on the right. viewBox is 150×620 at 1:1 scale (no stretch) so the car's
 * CSS Motion Path aligns pixel-for-pixel with the drawn ribbon.
 * ⚠️ This string MUST stay byte-identical to `.ci-car { offset-path: path(...) }`
 * in circuit.css — the car rides the visible track only while they match.
 */
const TRACK_D = 'M 60 24 L 90 24 C 114 24 126 36 126 60 L 126 246 C 126 272 100 282 100 310 C 100 338 126 348 126 374 L 126 560 C 126 584 114 596 90 596 L 60 596 C 36 596 24 584 24 560 L 24 60 C 24 36 36 24 60 24 Z';

/** Decorative static sparklines for the stat readouts (viewBox 0 0 60 20). */
const SPARKS = [
  '0,18 12,12 24,14 36,7 48,9 60,3',
  '0,16 12,17 24,10 36,12 48,5 60,6',
  '0,19 12,11 24,13 36,8 48,9 60,4',
  '0,15 12,16 24,8 36,10 48,6 60,2',
];

/** Map scroll progress → a plausible lap time mm:ss.mmm (a ~1:32.5 lap). */
function fmtLap(p: number): string {
  const ms = Math.max(0, Math.min(1, p)) * 92500;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mmm = Math.floor(ms % 1000);
  return `${m}:${String(s).padStart(2, '0')}.${String(mmm).padStart(3, '0')}`;
}

function Stars({ n }: { n: number }) {
  return (
    <span className="ci-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill={i < n ? 'var(--ci-red)' : 'none'} color={i < n ? 'var(--ci-red)' : 'var(--ci-line-strong)'} />
      ))}
    </span>
  );
}

// ── SIGNATURE: the fixed pit-wall — timing tower + circuit + car ──────────────
// Entirely decorative (aria-hidden): the numbers are not real business data.

function CircuitTelemetry({ progress, rootRef, s }: { progress: MotionValue<number>; rootRef: RefObject<HTMLDivElement>; s: CiStrings }) {
  const reduced = usePrefersReducedMotion();
  const lapRef = useRef<HTMLSpanElement>(null);
  const s1Ref = useRef<HTMLDivElement>(null);
  const s2Ref = useRef<HTMLDivElement>(null);
  const s3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clear = (el: HTMLElement | null, on: boolean) => el?.classList.toggle('is-clear', on);
    const paint = (p: number) => {
      // The car reads the inherited var: offset-distance: var(--ci-prog).
      rootRef.current?.style.setProperty('--ci-prog', `${(p * 100).toFixed(2)}%`);
      if (lapRef.current) lapRef.current.textContent = fmtLap(p);
      clear(s1Ref.current, p >= 0.33);
      clear(s2Ref.current, p >= 0.66);
      clear(s3Ref.current, p >= 0.985);
    };
    if (reduced) { paint(1); return; }
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
    <div className="ci-plane" aria-hidden="true">
      <div className="ci-tower">
        <div className="ci-tower-head">
          <span className="ci-livedot" /> <span>{s.liveLabel}</span>
        </div>
        <span className="ci-tower-label">{s.lapLabel}</span>
        <span className="ci-lap" ref={lapRef}>{reduced ? fmtLap(1) : '0:00.000'}</span>
        <div className="ci-sectors">
          {[{ r: s1Ref, l: s.sector1, t: '30.142' }, { r: s2Ref, l: s.sector2, t: '31.088' }, { r: s3Ref, l: s.sector3, t: '31.270' }].map((sec, i) => (
            <div key={i} className={cx('ci-sector', reduced && 'is-clear')} ref={sec.r}>
              <span className="ci-sector-l">{sec.l}</span>
              <span className="ci-sector-t">{sec.t}</span>
              <span className="ci-sector-check"><Check size={11} strokeWidth={3} /></span>
            </div>
          ))}
        </div>
      </div>
      {/* track + car share one positioned box so the car's Motion Path origin
          lines up pixel-for-pixel with the drawn SVG (regardless of the tower above). */}
      <div className="ci-track-wrap">
        <svg className="ci-track" viewBox="0 0 150 620" aria-hidden="true" focusable="false">
          <path d={TRACK_D} className="ci-track-ribbon" fill="none" />
          <path d={TRACK_D} className="ci-track-line" fill="none" />
          {/* start / finish */}
          <line x1="75" y1="15" x2="75" y2="33" className="ci-track-sf" />
        </svg>
        <div className="ci-car" />
      </div>
    </div>
  );
}

// ── Nav (the pit-wall header) ─────────────────────────────────────────────────

const navLinks = (s: CiStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about, label: s.navAbout },
  { id: SECTION_IDS.areas, label: s.navAreas },
  { id: SECTION_IDS.reviews, label: s.navReviews },
  { id: SECTION_IDS.faq, label: s.navFaq },
];

function CiNav({ data, active }: { data: TemplateData; active: string }) {
  const s = ciStrings(data.locale);
  const [open, setOpen] = useState(false);
  const links = navLinks(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  return (
    <nav className="ci-nav" aria-label={s.mainNavAria}>
      <div className="ci-nav-inner">
        <button className="ci-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label={s.goToTopAria}>
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={28} bg="var(--ci-red)" fg="var(--ci-carbon)" radius={4} />
          </span>
          <span data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <div className="ci-nav-links">
          {links.map(({ id, label }) => (
            <button
              key={id}
              className={cx('ci-nav-link', active === id && 'is-active')}
              onClick={() => scrollToSection(id)}
              data-edit={`copy.nav_${id}`}
              data-edit-type="text"
            >
              {data.copy?.[`nav_${id}`] ?? label}
            </button>
          ))}
        </div>
        <div className="ci-nav-end">
          <span className="ci-nav-live" aria-hidden="true"><span className="ci-livedot" />{s.liveLabel}</span>
          {data.accountUrl && (
            <a href={data.accountUrl} className="ci-btn ci-btn-ghost ci-btn-sm">{data.copy?.nav_account ?? s.navAccount}</a>
          )}
          <button className="ci-btn ci-btn-primary ci-btn-sm" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{bookLabel}</button>
          <button className="ci-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && (
        <div className="ci-nav-mobile">
          {links.map(({ id, label }) => <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{label}</button>)}
          {data.accountUrl && <a href={data.accountUrl} className="ci-nav-mobile-link">{data.copy?.nav_account ?? s.navAccount}</a>}
        </div>
      )}
    </nav>
  );
}

// ── Hero (broadcast title | framed telemetry panel) ───────────────────────────

function CiHero({ data }: { data: TemplateData }) {
  const s = ciStrings(data.locale);
  const { hero } = data;
  return (
    <section id={SECTION_IDS.hero} className="ci-section ci-hero">
      <div className="ci-wrap ci-hero-grid">
        <div className="ci-hero-copy">
          <Reveal><p className="ci-eyebrow"><span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h1 className="ci-h1" data-edit="hero.headline" data-edit-type="text">{hero.headline}</h1></Reveal>
          <Reveal as="p" className="ci-hero-sub" delay={0.12}><span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span></Reveal>
          <Reveal className="ci-hero-ctas" delay={0.18}>
            <button className="ci-btn ci-btn-primary" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{hero.ctaPrimary} <ArrowRight size={15} aria-hidden="true" /></button>
            <button className="ci-btn ci-btn-ghost" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>{hero.ctaSecondary}</button>
          </Reveal>
          <p className="ci-hero-tele" aria-hidden="true">
            <span className="ci-tele-flag" /> {s.heroCaption} <span className="ci-tele-sep">/</span> {s.lapLabel} <b>1:32.500</b>
          </p>
        </div>
        <div className="ci-hero-media">
          <EnterMount tilt={8} perspective={1400}>
            <figure className="ci-figure">
              <div className="ci-panel ci-hero-frame">
                <img src={hero.image} alt={s.heroImageAlt} className="ci-hero-img" data-edit="hero.image" data-edit-type="image" />
                <span className="ci-hero-tag" aria-hidden="true"><span className="ci-livedot" />{s.liveLabel}</span>
              </div>
              <figcaption className="ci-figcap">{s.heroCaption}</figcaption>
            </figure>
          </EnterMount>
        </div>
      </div>
    </section>
  );
}

// ── Stats (telemetry readouts) ────────────────────────────────────────────────

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value) ? Math.round(n).toLocaleString('en-US') : n.toFixed(1);
  return (
    <div ref={ref} className="ci-stat" data-edit-item={`stats.${index}`}>
      <span className="ci-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{formatted}{stat.suffix}</span>
      <svg className="ci-spark" viewBox="0 0 60 20" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <polyline points={SPARKS[index % SPARKS.length]} fill="none" stroke="var(--ci-red)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="ci-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function CiStats({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.stats} className="ci-stats">
      <div className="ci-wrap ci-stats-row">{data.stats.map((st, i) => <StatItem key={i} stat={st} index={i} />)}</div>
    </section>
  );
}

// ── Why (the pit wall) ────────────────────────────────────────────────────────

const features = (s: CiStrings) => [
  { icon: 'Gauge', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function CiWhy({ data }: { data: TemplateData }) {
  const s = ciStrings(data.locale);
  return (
    <section className="ci-section">
      <div className="ci-wrap">
        <Reveal><p className="ci-eyebrow"><span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? s.whyEyebrowCi}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="ci-h2" data-edit="copy.whyHeading" data-edit-type="text">{data.copy?.whyHeading ?? s.whyHeadingCi}</h2></Reveal>
        <div className="ci-why-grid">
          {features(s).map((f, i) => (
            <Reveal key={i} delay={i * 0.06} className="ci-why">
              <span className="ci-why-icon"><DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={20} strokeWidth={1.75} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" /></span>
              <h3 className="ci-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">{data.copy?.[f.titleKey] ?? f.title}</h3>
              <p className="ci-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">{data.copy?.[f.bodyKey] ?? f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages (pit-strategy tiers) ─────────────────────────────────────────────

function CiPackages({ data }: { data: TemplateData }) {
  const s = ciStrings(data.locale);
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="ci-section">
      <div className="ci-wrap">
        <Reveal><p className="ci-eyebrow"><span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? s.packagesEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="ci-h2" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingCi}</h2></Reveal>
        <Reveal as="p" className="ci-lead" delay={0.12}><span data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubCi}</span></Reveal>
        <div className="ci-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.06} data-edit-item={`packages.${i}`}>
              <div className={cx('ci-pkg', pkg.popular && 'is-popular')}>
                {pkg.popular && <span className="ci-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge ?? s.badgePopular}</span>}
                <p className="ci-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                <p className="ci-pkg-price">
                  <span className="ci-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">₪{pkg.price}</span>
                  {pkg.unit && <span className="ci-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                </p>
                <ul className="ci-pkg-features">
                  {pkg.features.map((f, fi) => (
                    <li key={fi}><Check size={14} className="ci-check" aria-hidden="true" /><span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span></li>
                  ))}
                </ul>
                <button className={cx('ci-btn', pkg.popular ? 'ci-btn-primary' : 'ci-btn-ghost', 'ci-btn-block')} data-edit="labels.packageCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
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

function CiAbout({ data }: { data: TemplateData }) {
  const s = ciStrings(data.locale);
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="ci-section">
      <div className="ci-wrap ci-about">
        <div className="ci-about-media">
          <Reveal y={26}>
            <figure className="ci-figure">
              <div className="ci-panel ci-hero-frame">
                <img src={about.image} alt={s.aboutImageAlt} className="ci-hero-img ci-about-img" data-edit="about.image" data-edit-type="image" />
              </div>
            </figure>
          </Reveal>
          <Reveal delay={0.1} className="ci-instructor">
            <img src={instructor.photo} alt={instructor.name} className="ci-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div className="ci-instructor-id">
              <p className="ci-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p>
              <p className="ci-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
            </div>
          </Reveal>
        </div>
        <div className="ci-about-copy">
          <Reveal><p className="ci-eyebrow"><span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? s.aboutEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="ci-h2 ci-h2-tight" data-edit="about.heading" data-edit-type="text">{about.heading}</h2></Reveal>
          {about.body.map((p, i) => (
            <Reveal key={i} as="p" className="ci-body" delay={0.1 + i * 0.06}><span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span></Reveal>
          ))}
          <Reveal delay={0.22}>
            <ul className="ci-checklist">
              {about.checklist.map((item, i) => (
                <li key={i} data-edit-item={`about.checklist.${i}`}>
                  <Check size={15} strokeWidth={2.5} className="ci-check" aria-hidden="true" />
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          {instructor.bio && <Reveal as="p" className="ci-body" delay={0.26}><span data-edit="instructor.bio" data-edit-type="text">{instructor.bio}</span></Reveal>}
          {instructor.credentials.length > 0 && (
            <Reveal delay={0.3}>
              <div className="ci-creds">
                {instructor.credentials.map((c, i) => (
                  <span key={i} className="ci-cred" data-edit-item={`instructor.credentials.${i}`}>
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

// ── Areas (sectors covered) ───────────────────────────────────────────────────

function CiAreas({ data }: { data: TemplateData }) {
  const s = ciStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="ci-section">
      <div className="ci-wrap">
        <Reveal><p className="ci-eyebrow"><span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? s.areasEyebrowCi}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="ci-h2" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingCi}</h2></Reveal>
        <ul className="ci-areas">
          {data.areas.map((area, i) => (
            <Reveal key={i} as="li" delay={(i % 4) * 0.04} className="ci-area" data-edit-item={`areas.${i}`}>
              <span className="ci-area-dot" aria-hidden="true" />
              <span className="ci-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              {area.note && <span className="ci-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Reviews ───────────────────────────────────────────────────────────────────

function CiReviews({ data }: { data: TemplateData }) {
  const s = ciStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="ci-section">
      <div className="ci-wrap">
        <Reveal><p className="ci-eyebrow"><span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? s.reviewsEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="ci-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingCi}</h2></Reveal>
        <div className="ci-reviews">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06} className="ci-review" data-edit-item={`reviews.${i}`}>
              <Stars n={r.rating} />
              <blockquote className="ci-review-text">“<span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span>”</blockquote>
              {r.reply && (
                <p className="ci-review-reply">
                  <span className="ci-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                </p>
              )}
              <div className="ci-review-meta">
                {r.avatar && <img src={r.avatar} alt={r.name} className="ci-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                <div>
                  <p className="ci-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                  {r.meta && <p className="ci-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
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

function CiGallery({ data }: { data: TemplateData }) {
  const s = ciStrings(data.locale);
  return (
    <section className="ci-section">
      <div className="ci-wrap">
        <Reveal><p className="ci-eyebrow"><span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? s.galleryEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="ci-h2" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingCi}</h2></Reveal>
        <div className="ci-gallery">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06} className="ci-gallery-cell" data-edit-item={`gallery.${i}`}>
              <img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ (race control) ────────────────────────────────────────────────────────

function CiFaq({ data }: { data: TemplateData }) {
  const s = ciStrings(data.locale);
  const [open, setOpen] = useState<number | null>(0);
  const editing = useIsEditing();
  return (
    <section id={SECTION_IDS.faq} className="ci-section">
      <div className="ci-wrap ci-faq-wrap">
        <Reveal><p className="ci-eyebrow"><span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? s.faqEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="ci-h2" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingCi}</h2></Reveal>
        <div className="ci-faq-list">
          {data.faqs.map((faq, i) => {
            const isOpen = editing || open === i;
            return (
              <div key={i} className="ci-faq-item" data-edit-item={`faqs.${i}`}>
                <button className="ci-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span data-edit={`faqs.${i}.q`} data-edit-type="text">{faq.q}</span>
                  <span className="ci-faq-ic" aria-hidden="true">{isOpen ? <Minus size={14} /> : <Plus size={14} />}</span>
                </button>
                <div className={cx('ci-faq-panel', isOpen && 'is-open')}>
                  <div className="ci-faq-panel-in"><p data-edit={`faqs.${i}.a`} data-edit-type="text">{faq.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Book (lights out / grid) ──────────────────────────────────────────────────

function CiBook({ data }: { data: TemplateData }) {
  const s = ciStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="ci-section">
      <div className="ci-wrap">
        <Reveal className="ci-book">
          <div className="ci-grid-lights" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <span key={i} />)}</div>
          <p className="ci-eyebrow ci-eyebrow-center">{s.gridLabel}</p>
          <h2 className="ci-h2" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingCi}</h2>
          <p className="ci-lead" data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodyCi}</p>
          <div className="ci-book-ctas">
            {data.bookingUrl ? (
              <a href={data.bookingUrl} className="ci-btn ci-btn-primary" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></a>
            ) : (
              <button type="button" className="ci-btn ci-btn-primary" title={s.publishNote} disabled aria-disabled="true" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></button>
            )}
            {data.enrollUrl && <a href={data.enrollUrl} className="ci-btn ci-btn-ghost"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span></a>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer ──────────────────────────────────────────────────────────

function CiContact({ data }: { data: TemplateData }) {
  const s = ciStrings(data.locale);
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="ci-footer">
      <div className="ci-wrap ci-footer-grid">
        <div>
          <p className="ci-eyebrow"><span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeading}</span></p>
          <div className="ci-contact-info">
            <a href={`tel:${contact.phone}`} className="ci-contact-link"><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={15} strokeWidth={1.75} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span></a>
            <a href={`mailto:${contact.email}`} className="ci-contact-link"><DynamicIcon name={data.icons?.email ?? 'Mail'} size={15} strokeWidth={1.75} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span></a>
            <span className="ci-contact-link"><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={15} strokeWidth={1.75} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span></span>
          </div>
          <div className="ci-socials">
            {socials.map((so, i) => (
              <a key={i} href={so.url} className="ci-social" target="_blank" rel="noreferrer" aria-label={so.platform} data-edit-item={`contact.socials.${i}`}>
                <SocialIcon platform={so.platform} size={16} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="ci-eyebrow"><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabel}</span></p>
          <table className="ci-hours">
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
      <div className="ci-wrap ci-footer-bottom">
        <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
        <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCredit}</span>
      </div>
    </footer>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function Circuit({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts(['https://fonts.googleapis.com/css2?family=Saira:wght@500;600;700;800&family=Chivo+Mono:wght@400;500;600&family=Public+Sans:wght@400;500;600;700&display=swap']);
  const active = useScrollSpy(Object.values(SECTION_IDS));
  const s = ciStrings(data.locale);
  const rootRef = useRef<HTMLDivElement>(null);
  // Lap progress: works in the window AND in the builder's inner scroll container.
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ['start start', 'end end'] });

  return (
    <div ref={rootRef} className="tmpl-circuit" dir={data.dir} style={data.theme as CSSProperties} data-edit="theme.bg" data-edit-type="background">
      {/* SIGNATURE — the fixed pit-wall (scroll-driven lap + live timing tower) */}
      <CircuitTelemetry progress={scrollYProgress} rootRef={rootRef} s={s} />
      <CiNav data={data} active={active} />
      <main>
        <CiHero data={data} />
        <CiStats data={data} />
        <CiWhy data={data} />
        {data.packages.length > 0 && <CiPackages data={data} />}
        <CiAbout data={data} />
        <CiAreas data={data} />
        {data.reviews.length > 0 && <CiReviews data={data} />}
        {data.gallery.length > 0 && <CiGallery data={data} />}
        <CiFaq data={data} />
        <CiBook data={data} />
        <CiContact data={data} />
      </main>
    </div>
  );
}

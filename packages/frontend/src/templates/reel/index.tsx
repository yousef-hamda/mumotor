/**
 * Reel — 35mm cinema. Learning to drive told as a film: a letterboxed hero, a
 * sprocket-holed FILMSTRIP that scroll-scrubs sideways frame-by-frame (with a
 * mono timecode/frame counter), an academy-leader "3·2·1" countdown, and a
 * projector-warm near-black palette with one technicolor vermilion accent.
 * Photography-forward — it shows the real driving-lesson photos as film frames.
 *
 * SIGNATURE — the filmstrip advances via a scroll-bound transform (transform-only,
 * buttery), the counter ticks with the same scroll progress; under reduced motion
 * the strip is static and the counter shows a fixed value. The academy leader is a
 * pure CSS/SVG accent (aria-hidden) that renders static at "3" under reduced motion.
 *
 * Bebas Neue (film-poster display) · Overpass Mono (timecode / eyebrows / nav /
 * prices) · DM Sans (body). Palette via CSS vars on `.tmpl-reel`: --rl-bg /
 * --rl-panel / --rl-ink / --rl-accent (vermilion, the ONE accent) / --rl-gold
 * (sprockets & frame lines, secondary). Every tint derives via color-mix, so
 * Customize recolouring never breaks.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion, useInView, useScroll, useTransform, useMotionValueEvent, type MotionValue } from 'framer-motion';
import { Plus, Minus, Star, Menu, X, ArrowRight, Check } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { rlStrings, type RlStrings } from './strings';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, EnterMount, useCountUp, useIsEditing, reviewReplyLabel,
  usePrefersReducedMotion,
} from '../shared';
import './reel.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

// ── Cinema furniture ──────────────────────────────────────────────────────────

/** Academy-leader "3·2·1" countdown — a rotating sweep hand over cycling numerals.
 *  Pure CSS/SVG, decorative. Renders static at "3" under reduced motion (CSS). */
function AcademyLeader({ className }: { className?: string }) {
  return (
    <span className={cx('rl-leader', className)} aria-hidden="true">
      <span className="rl-leader-cross" />
      <span className="rl-leader-sweep" />
      <span className="rl-leader-num"><span>3</span><span>2</span><span>1</span></span>
    </span>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="rl-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill={i < n ? 'var(--rl-accent)' : 'none'} color={i < n ? 'var(--rl-accent)' : 'var(--rl-gold)'} />
      ))}
    </span>
  );
}

// ── SIGNATURE — the scroll-scrubbed filmstrip + timecode counter ───────────────

/** Mono timecode / frame readout. Isolated so a per-frame scroll update never
 *  re-renders the (image-heavy) filmstrip track. Static under reduced motion. */
function RlStripCounter({ progress, reduced, s }: { progress: MotionValue<number>; reduced: boolean; s: RlStrings }) {
  const TOTAL_SEC = 42, TOTAL_FRAMES = 288;
  const [tc, setTc] = useState({ frame: 1, sec: 0 });
  useMotionValueEvent(progress, 'change', (p) => {
    if (reduced) return;
    setTc({ frame: Math.max(1, Math.round(p * TOTAL_FRAMES)), sec: p * TOTAL_SEC });
  });
  const mmss = (t: number) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  return (
    <div className="rl-strip-counter" aria-hidden="true">
      <span className="rl-strip-tc">{mmss(reduced ? 0 : tc.sec)} / {mmss(TOTAL_SEC)}</span>
      <span className="rl-strip-sep">·</span>
      <span className="rl-strip-fr">{s.frameLabel} {String(reduced ? 1 : tc.frame).padStart(3, '0')}</span>
    </div>
  );
}

/** A full-bleed strip of sprocket-holed film frames that travels sideways as it
 *  crosses the viewport (scroll-bound translateX, transform-only). Decorative —
 *  the real Gallery section carries the accessible/editable images. */
function RlFilmstrip({ data }: { data: TemplateData }) {
  const s = rlStrings(data.locale);
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] as any });
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-25%']);
  const frames = [data.hero.image, ...data.gallery].filter(Boolean);
  if (frames.length === 0) return null;
  // Duplicate so the track is far wider than the viewport → no blank edges as it travels.
  const strip = [...frames, ...frames, ...frames, ...frames];
  return (
    <div className="rl-strip rl-band" ref={ref} aria-hidden="true">
      <RlStripCounter progress={scrollYProgress} reduced={reduced} s={s} />
      <div className="rl-strip-clip">
        <motion.div className="rl-strip-track" style={reduced ? undefined : { x }}>
          {strip.map((src, i) => (
            <div className="rl-strip-frame" key={i}>
              <img src={src} alt="" loading="lazy" />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// ── Nav ─────────────────────────────────────────────────────────────────────

/** A live REC dot + a small running timecode (mm:ss, counts up while mounted).
 *  Purely decorative (aria-hidden) — frozen at 00:00 under reduced motion, and no
 *  interval is registered in that case. */
function RlNavRec() {
  const reduced = usePrefersReducedMotion();
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setSec((v) => (v + 1) % 3600), 1000);
    return () => window.clearInterval(id);
  }, [reduced]);
  const mmss = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  return (
    <span className="rl-nav-rec" aria-hidden="true">
      <span className="rl-rec-dot" />
      <span className="rl-nav-rec-label">REC</span>
      <span className="rl-nav-rec-tc">{reduced ? '00:00' : mmss}</span>
    </span>
  );
}

const navLinks = (s: RlStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about, label: s.navAbout },
  { id: SECTION_IDS.areas, label: s.navAreas },
  { id: SECTION_IDS.reviews, label: s.navReviews },
  { id: SECTION_IDS.faq, label: s.navFaq },
];

function RlNav({ data, active }: { data: TemplateData; active: string }) {
  const s = rlStrings(data.locale);
  const [open, setOpen] = useState(false);
  const links = navLinks(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  return (
    <nav className="rl-nav" aria-label={s.mainNavAria}>
      <div className="rl-nav-inner">
        <button className="rl-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label={s.goToTopAria}>
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={30} bg="var(--rl-accent)" fg="var(--rl-bg)" radius={3} ring={false} />
          </span>
          <span data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <div className="rl-nav-links rl-nav-strip">
          {links.map(({ id, label }) => (
            <button
              key={id}
              className={cx('rl-nav-link', active === id && 'is-active')}
              onClick={() => scrollToSection(id)}
            >
              <span data-edit={`copy.nav_${id}`} data-edit-type="text">{data.copy?.[`nav_${id}`] ?? label}</span>
            </button>
          ))}
        </div>
        <div className="rl-nav-end">
          <RlNavRec />
          {data.accountUrl && (
            <a href={data.accountUrl} className="rl-btn rl-btn-ghost rl-btn-sm">{data.copy?.nav_account ?? s.navAccount}</a>
          )}
          <button className="rl-btn rl-btn-primary rl-btn-sm" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{bookLabel}</button>
          <button className="rl-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && (
        <div className="rl-nav-mobile">
          {links.map(({ id, label }) => <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{label}</button>)}
          {data.accountUrl && <a href={data.accountUrl} className="rl-nav-mobile-link">{data.copy?.nav_account ?? s.navAccount}</a>}
        </div>
      )}
    </nav>
  );
}

// ── Hero — letterboxed, full-bleed, 2-column (title | large film-frame media) ──

function RlHero({ data }: { data: TemplateData }) {
  const s = rlStrings(data.locale);
  const { hero } = data;
  return (
    <section id={SECTION_IDS.hero} className="rl-hero rl-band">
      <span className="rl-bar rl-bar-top" aria-hidden="true" />
      <span className="rl-bar rl-bar-bottom" aria-hidden="true" />
      <div className="rl-wrap rl-wrap-wide rl-hero-inner">
        <div className="rl-hero-copy">
          <Reveal><p className="rl-eyebrow"><span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h1 className="rl-h1" data-edit="hero.headline" data-edit-type="text">{hero.headline}</h1></Reveal>
          <Reveal as="p" className="rl-hero-sub" delay={0.12}><span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span></Reveal>
          <Reveal className="rl-hero-ctas" delay={0.18}>
            <button className="rl-btn rl-btn-primary" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{hero.ctaPrimary} <ArrowRight size={15} aria-hidden="true" /></button>
            <button className="rl-btn rl-btn-ghost" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>{hero.ctaSecondary}</button>
          </Reveal>
          <Reveal className="rl-hero-run" delay={0.24}>
            <span className="rl-rec"><span className="rl-rec-dot" />REC</span>
            <span>{s.reelLabel} 01 · {s.runtimeLabel} 00:42 · 35MM</span>
          </Reveal>
        </div>
        <div className="rl-hero-media">
          <EnterMount tilt={7} perspective={1500}>
            <figure className="rl-figure">
              <div className="rl-frame-lg rl-sprockets">
                <img src={hero.image} alt={s.heroImageAlt} className="rl-frame-img" data-edit="hero.image" data-edit-type="image" />
                <span className="rl-nowshowing"><span className="rl-live-dot" />{s.nowShowing}</span>
                <AcademyLeader className="rl-leader-hero" />
              </div>
              <figcaption className="rl-caption">{s.heroCaption}</figcaption>
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
    <div ref={ref} className="rl-stat" data-edit-item={`stats.${index}`}>
      <span className="rl-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{formatted}{stat.suffix}</span>
      <span className="rl-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function RlStats({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.stats} className="rl-stats rl-band">
      <div className="rl-wrap rl-stats-row">{data.stats.map((st, i) => <StatItem key={i} stat={st} index={i} />)}</div>
    </section>
  );
}

// ── Why (the programme) ────────────────────────────────────────────────────────

const features = (s: RlStrings) => [
  { icon: 'Clapperboard', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function RlWhy({ data }: { data: TemplateData }) {
  const s = rlStrings(data.locale);
  return (
    <section className="rl-section">
      <div className="rl-wrap">
        <Reveal><p className="rl-eyebrow"><span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? s.whyEyebrowRl}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="rl-h2" data-edit="copy.whyHeading" data-edit-type="text">{data.copy?.whyHeading ?? s.whyHeadingRl}</h2></Reveal>
        <div className="rl-why-grid">
          {features(s).map((f, i) => (
            <Reveal key={i} delay={i * 0.06} className="rl-why">
              <span className="rl-why-icon"><DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={22} strokeWidth={1.6} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" /></span>
              <h3 className="rl-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">{data.copy?.[f.titleKey] ?? f.title}</h3>
              <p className="rl-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">{data.copy?.[f.bodyKey] ?? f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages (film-frame panels) ───────────────────────────────────────────────

function RlPackages({ data }: { data: TemplateData }) {
  const s = rlStrings(data.locale);
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="rl-section">
      <div className="rl-wrap">
        <Reveal><p className="rl-eyebrow"><span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? s.packagesEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="rl-h2" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingRl}</h2></Reveal>
        <Reveal as="p" className="rl-lead" delay={0.12}><span data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubRl}</span></Reveal>
        <div className="rl-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.06} data-edit-item={`packages.${i}`}>
              <div className={cx('rl-pkg', 'rl-sprockets', pkg.popular && 'is-popular')}>
                {pkg.popular && <span className="rl-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge ?? s.nowShowing}</span>}
                <p className="rl-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                <p className="rl-pkg-price">
                  <span className="rl-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">₪{pkg.price}</span>
                  {pkg.unit && <span className="rl-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                </p>
                <ul className="rl-pkg-features">
                  {pkg.features.map((f, fi) => (
                    <li key={fi}><Check size={14} className="rl-check" aria-hidden="true" /><span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span></li>
                  ))}
                </ul>
                <button className={cx('rl-btn', pkg.popular ? 'rl-btn-primary' : 'rl-btn-ghost', 'rl-btn-block')} data-edit="labels.packageCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
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

// ── About ───────────────────────────────────────────────────────────────────────

function RlAbout({ data }: { data: TemplateData }) {
  const s = rlStrings(data.locale);
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="rl-section rl-band">
      <div className="rl-wrap rl-about">
        <div className="rl-about-media">
          <Reveal y={26}>
            <figure className="rl-figure">
              <div className="rl-frame-lg rl-sprockets">
                <img src={about.image} alt={s.aboutImageAlt} className="rl-frame-img rl-about-img" data-edit="about.image" data-edit-type="image" />
              </div>
            </figure>
          </Reveal>
          <Reveal delay={0.1} className="rl-instructor">
            <img src={instructor.photo} alt={instructor.name} className="rl-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div className="rl-instructor-id">
              <p className="rl-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p>
              <p className="rl-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
            </div>
          </Reveal>
        </div>
        <div className="rl-about-copy">
          <Reveal><p className="rl-eyebrow"><span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? s.aboutEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="rl-h2 rl-h2-tight" data-edit="about.heading" data-edit-type="text">{about.heading}</h2></Reveal>
          {about.body.map((p, i) => (
            <Reveal key={i} as="p" className="rl-body" delay={0.1 + i * 0.06}><span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span></Reveal>
          ))}
          <Reveal delay={0.22}>
            <ul className="rl-checklist">
              {about.checklist.map((item, i) => (
                <li key={i} data-edit-item={`about.checklist.${i}`}>
                  <Check size={15} strokeWidth={2} className="rl-check" aria-hidden="true" />
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          {instructor.bio && <Reveal as="p" className="rl-body" delay={0.26}><span data-edit="instructor.bio" data-edit-type="text">{instructor.bio}</span></Reveal>}
          {instructor.credentials.length > 0 && (
            <Reveal delay={0.3}>
              <div className="rl-creds">
                {instructor.credentials.map((c, i) => (
                  <span key={i} className="rl-cred" data-edit-item={`instructor.credentials.${i}`}>
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

// ── Areas (a locations / scenes list) ──────────────────────────────────────────

function RlAreas({ data }: { data: TemplateData }) {
  const s = rlStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="rl-section">
      <div className="rl-wrap">
        <Reveal><p className="rl-eyebrow"><span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? s.areasEyebrowRl}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="rl-h2" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingRl}</h2></Reveal>
        <ul className="rl-areas">
          {data.areas.map((area, i) => (
            <Reveal key={i} as="li" delay={(i % 4) * 0.04} className="rl-area" data-edit-item={`areas.${i}`}>
              <span className="rl-area-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <span className="rl-area-marker" aria-hidden="true" />
              <span className="rl-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              {area.note && <span className="rl-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Reviews ─────────────────────────────────────────────────────────────────────

function RlReviews({ data }: { data: TemplateData }) {
  const s = rlStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="rl-section rl-band">
      <div className="rl-wrap">
        <Reveal><p className="rl-eyebrow"><span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? s.reviewsEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="rl-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingRl}</h2></Reveal>
        <div className="rl-reviews">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06} className="rl-review" data-edit-item={`reviews.${i}`}>
              <span className="rl-quote-mark" aria-hidden="true">“</span>
              <Stars n={r.rating} />
              <blockquote className="rl-review-text"><span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span></blockquote>
              {r.reply && (
                <p className="rl-review-reply">
                  <span className="rl-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                </p>
              )}
              <div className="rl-review-meta">
                {r.avatar && <img src={r.avatar} alt={r.name} className="rl-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                <div>
                  <p className="rl-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                  {r.meta && <p className="rl-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery (wide film frames) ──────────────────────────────────────────────────

function RlGallery({ data }: { data: TemplateData }) {
  const s = rlStrings(data.locale);
  return (
    <section className="rl-section">
      <div className="rl-wrap rl-wrap-wide">
        <Reveal><p className="rl-eyebrow"><span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? s.galleryEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="rl-h2" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingRl}</h2></Reveal>
        <div className="rl-gallery">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 4) * 0.06} className="rl-gallery-cell" data-edit-item={`gallery.${i}`}>
              <img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ─────────────────────────────────────────────────────────────────────────

function RlFaq({ data }: { data: TemplateData }) {
  const s = rlStrings(data.locale);
  const [open, setOpen] = useState<number | null>(0);
  const editing = useIsEditing();
  return (
    <section id={SECTION_IDS.faq} className="rl-section">
      <div className="rl-wrap rl-faq-wrap">
        <Reveal><p className="rl-eyebrow"><span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? s.faqEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="rl-h2" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingRl}</h2></Reveal>
        <div className="rl-faq-list">
          {data.faqs.map((faq, i) => {
            const isOpen = editing || open === i;
            return (
              <div key={i} className="rl-faq-item" data-edit-item={`faqs.${i}`}>
                <button className="rl-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span data-edit={`faqs.${i}.q`} data-edit-type="text">{faq.q}</span>
                  <span className="rl-faq-ic" aria-hidden="true">{isOpen ? <Minus size={16} /> : <Plus size={16} />}</span>
                </button>
                <div className={cx('rl-faq-panel', isOpen && 'is-open')}>
                  <div className="rl-faq-panel-in"><p data-edit={`faqs.${i}.a`} data-edit-type="text">{faq.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Book (a premiere panel over a dimmed hero still) ───────────────────────────

function RlBook({ data }: { data: TemplateData }) {
  const s = rlStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="rl-book rl-band">
      <img className="rl-book-bg" src={data.hero.image} alt="" aria-hidden="true" />
      <div className="rl-book-scrim" aria-hidden="true" />
      <div className="rl-wrap rl-book-inner">
        <Reveal>
          <p className="rl-eyebrow rl-eyebrow-accent">{s.premiere}</p>
          <h2 className="rl-h2" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingRl}</h2>
          <p className="rl-lead" data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodyRl}</p>
          <div className="rl-book-ctas">
            {data.bookingUrl ? (
              <a href={data.bookingUrl} className="rl-btn rl-btn-primary" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></a>
            ) : (
              <button type="button" className="rl-btn rl-btn-primary" title={s.publishNote} disabled aria-disabled="true" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></button>
            )}
            {data.enrollUrl && <a href={data.enrollUrl} className="rl-btn rl-btn-ghost"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span></a>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer ────────────────────────────────────────────────────────────

function RlContact({ data }: { data: TemplateData }) {
  const s = rlStrings(data.locale);
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="rl-footer rl-band">
      <div className="rl-wrap rl-footer-grid">
        <div>
          <p className="rl-eyebrow"><span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeading}</span></p>
          <div className="rl-contact-info">
            <a href={`tel:${contact.phone}`} className="rl-contact-link"><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={15} strokeWidth={1.6} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span></a>
            <a href={`mailto:${contact.email}`} className="rl-contact-link"><DynamicIcon name={data.icons?.email ?? 'Mail'} size={15} strokeWidth={1.6} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span></a>
            <span className="rl-contact-link"><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={15} strokeWidth={1.6} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span></span>
          </div>
          <div className="rl-socials">
            {socials.map((so, i) => (
              <a key={i} href={so.url} className="rl-social" target="_blank" rel="noreferrer" aria-label={so.platform} data-edit-item={`contact.socials.${i}`}>
                <SocialIcon platform={so.platform} size={16} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="rl-eyebrow"><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabel}</span></p>
          <table className="rl-hours">
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
      <div className="rl-wrap rl-footer-bottom">
        <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
        <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCredit}</span>
      </div>
    </footer>
  );
}

// ── Root ────────────────────────────────────────────────────────────────────────

export default function Reel({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts(['https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Overpass+Mono:wght@400;500;600&display=swap']);
  const active = useScrollSpy(Object.values(SECTION_IDS));
  return (
    <div className="tmpl-reel" dir={data.dir} style={data.theme as CSSProperties} data-edit="theme.bg" data-edit-type="background">
      <div className="rl-grain" aria-hidden="true" />
      <RlNav data={data} active={active} />
      <main>
        <RlHero data={data} />
        <RlFilmstrip data={data} />
        <RlStats data={data} />
        <RlWhy data={data} />
        {data.packages.length > 0 && <RlPackages data={data} />}
        <RlAbout data={data} />
        <RlAreas data={data} />
        {data.reviews.length > 0 && <RlReviews data={data} />}
        {data.gallery.length > 0 && <RlGallery data={data} />}
        <RlFaq data={data} />
        <RlBook data={data} />
        <RlContact data={data} />
      </main>
    </div>
  );
}

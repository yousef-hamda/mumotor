/**
 * Ledger — premium fintech clarity. "Clarity and trust, from your first lesson
 * to your licence." The look of a modern neobank / money app (Wise, Mercury,
 * Monzo, Ramp): a clean warm-white page, tabular Roboto-Mono numerics, crisp
 * cards, one confident trust-emerald accent, and honest pricing presented like a
 * clear statement. Precise and credible — never glassy, gradient or playful.
 *
 * SIGNATURE — THE STATEMENT + LIVE FIGURES: the hero mounts a crisp fintech
 * "account card / statement" (tabular figures, a positive-emerald delta, a mini
 * area-chart sparkline, and rows that read like a bank statement — all built from
 * the site's REAL stats, never fabricated). It animates in ON MOUNT (framer
 * initial→animate) and the sparkline draws itself. Stat figures count up and
 * their meters fill on view (shared Reveal + useCountUp). Reduced-motion → static.
 *
 * Manrope (display / big numerals) · Inter (body) · Roboto Mono (money-grade
 * tabular figures). Palette via CSS vars on `.tmpl-ledger`:
 * --le-bg / --le-ink / --le-accent (trust emerald, the ONE accent) / --le-band /
 * --le-muted / --le-card / --le-line. Tints derive with color-mix(), so Customize
 * recolouring never breaks.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, useInView, useScroll, useMotionValueEvent } from 'framer-motion';
import { Plus, Minus, Star, Menu, X, ArrowRight, Check, BadgeCheck } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { leStrings, type LeStrings } from './strings';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, useCountUp, useIsEditing, reviewReplyLabel, usePrefersReducedMotion,
} from '../shared';
import './ledger.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

/** Format a stat exactly like the other templates (thousands-grouped ints, 1dp floats). */
function formatStat(value: number, n: number): string {
  return Number.isInteger(value) ? Math.round(n).toLocaleString('en-US') : n.toFixed(1);
}

/**
 * A sensible full-scale for a stat so its meter reads TRUE, not pegged: 100 for a
 * percentage, 5 for a rating, else the next 1/2/5 × power-of-ten at/above the value.
 * (Same idea as bezel's gauge cluster.)
 */
function fullScale(stat: TemplateData['stats'][number]): number {
  if (stat.suffix?.includes('%')) return 100;
  if (!Number.isInteger(stat.value) && stat.value <= 5) return 5;
  const v = Math.max(stat.value, 1);
  const mag = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 5]) if (v <= m * mag) return m * mag;
  return 10 * mag;
}

/** A one-shot mount reveal (fade + rise) for the hero cards — plays as they appear,
 *  not on scroll. Static under reduced motion. */
function MountCard({ children, className, delay = 0.12 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay }}
      style={{ willChange: 'transform' }}
    >
      {children}
    </motion.div>
  );
}

/** A mini area-chart sparkline that draws itself on mount (decorative, aria-hidden). */
const SPARK_LINE = 'M2 30 L20 27 L38 28 L56 19 L74 21 L92 11 L118 6';
const SPARK_AREA = `${SPARK_LINE} L118 40 L2 40 Z`;
function Sparkline() {
  const reduced = usePrefersReducedMotion();
  return (
    <svg className="le-spark" viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path className="le-spark-area" d={SPARK_AREA} />
      <motion.path
        className="le-spark-line"
        d={SPARK_LINE}
        fill="none"
        initial={reduced ? false : { pathLength: 0 }}
        animate={reduced ? undefined : { pathLength: 1 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
      />
    </svg>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="le-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill={i < n ? 'var(--le-accent)' : 'none'} color={i < n ? 'var(--le-accent)' : 'var(--le-line)'} />
      ))}
    </span>
  );
}

// ── Nav (the fintech app-bar) ──────────────────────────────────────────────────

const navLinks = (s: LeStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about, label: s.navAbout },
  { id: SECTION_IDS.areas, label: s.navAreas },
  { id: SECTION_IDS.reviews, label: s.navReviews },
  { id: SECTION_IDS.faq, label: s.navFaq },
];

function LeNav({ data, active }: { data: TemplateData; active: string }) {
  const s = leStrings(data.locale);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Subtle blur/solidify once the page moves — one motion-value listener, one rAF.
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 6));
  const links = navLinks(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  const topStat = data.stats[0];
  return (
    <nav className={cx('le-nav', scrolled && 'is-scrolled')} aria-label={s.mainNavAria}>
      <div className="le-nav-inner">
        <button className="le-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label={s.goToTopAria}>
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={30} bg="var(--le-accent)" fg="#ffffff" radius={9} />
          </span>
          <span className="le-logo-word" data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <div className="le-nav-links">
          {links.map(({ id, label }) => (
            <button
              key={id}
              className={cx('le-nav-link', active === id && 'is-active')}
              onClick={() => scrollToSection(id)}
              data-edit={`copy.nav_${id}`}
              data-edit-type="text"
            >
              {data.copy?.[`nav_${id}`] ?? label}
            </button>
          ))}
        </div>
        <div className="le-nav-end">
          {topStat && (
            <span className="le-nav-chip" aria-hidden="true">
              <span className="le-nav-dot" />
              <span className="le-nav-chip-fig">{topStat.prefix}{Math.round(topStat.value).toLocaleString('en-US')}{topStat.suffix}</span>
            </span>
          )}
          {data.accountUrl && (
            <a href={data.accountUrl} className="le-btn le-btn-ghost le-btn-sm">{data.copy?.nav_account ?? s.navAccount}</a>
          )}
          <button className="le-btn le-btn-primary le-btn-sm" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{bookLabel}</button>
          <button className="le-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && (
        <div className="le-nav-mobile">
          {links.map(({ id, label }) => <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{label}</button>)}
          {data.accountUrl && <a href={data.accountUrl} className="le-nav-mobile-link">{data.copy?.nav_account ?? s.navAccount}</a>}
        </div>
      )}
    </nav>
  );
}

// ── Hero (copy | photo + the floating statement card) ──────────────────────────

/** The hero statement figure — counts up on mount (mirrors the site's stats). */
function StatementFigure({ stat }: { stat: TemplateData['stats'][number] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const n = useCountUp(stat.value, mounted);
  return <span className="le-stmt-fig">{stat.prefix}{formatStat(stat.value, n)}{stat.suffix}</span>;
}

function Statement({ data }: { data: TemplateData }) {
  const s = leStrings(data.locale);
  const stats = data.stats;
  const hero = stats[0];
  const rows = stats.slice(1);
  return (
    <div className="le-statement" role="group" aria-label={s.balanceLabel}>
      <div className="le-stmt-head">
        <span className="le-stmt-label">{s.balanceLabel}</span>
        <span className="le-stmt-status"><span className="le-stmt-dot" aria-hidden="true" />{s.statusLabel}</span>
      </div>
      {hero && (
        <div className="le-stmt-hero">
          <StatementFigure stat={hero} />
          <span className="le-stmt-delta" aria-hidden="true">▲</span>
        </div>
      )}
      {hero && <p className="le-stmt-caption">{hero.label}</p>}
      <div className="le-stmt-spark">
        <Sparkline />
        <span className="le-stmt-spark-tag" aria-hidden="true">{s.statementLabel}</span>
      </div>
      {rows.length > 0 && (
        <ul className="le-stmt-rows">
          {rows.map((st, i) => (
            <li key={i} className="le-stmt-row">
              <span className="le-stmt-row-label">{st.label}</span>
              <span className="le-stmt-row-val">{st.prefix}{Math.round(st.value).toLocaleString('en-US')}{st.suffix}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="le-stmt-foot">{s.heroCaption}</p>
    </div>
  );
}

function LeHero({ data }: { data: TemplateData }) {
  const s = leStrings(data.locale);
  const { hero } = data;
  return (
    <section id={SECTION_IDS.hero} className="le-section le-hero">
      <div className="le-wrap le-hero-grid">
        <div className="le-hero-copy">
          <Reveal><p className="le-eyebrow"><span className="le-eyebrow-dot" aria-hidden="true" /><span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h1 className="le-h1" data-edit="hero.headline" data-edit-type="text">{hero.headline}</h1></Reveal>
          <Reveal as="p" className="le-hero-sub" delay={0.12}><span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span></Reveal>
          <Reveal className="le-hero-ctas" delay={0.18}>
            <button className="le-btn le-btn-primary le-btn-lg" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{hero.ctaPrimary} <ArrowRight size={16} aria-hidden="true" /></button>
            <button className="le-btn le-btn-ghost le-btn-lg" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>{hero.ctaSecondary}</button>
          </Reveal>
        </div>
        <div className="le-hero-media">
          <MountCard className="le-photo-card" delay={0.08}>
            <img src={hero.image} alt={s.heroImageAlt} className="le-photo-img" data-edit="hero.image" data-edit-type="image" />
          </MountCard>
          <MountCard className="le-statement-wrap" delay={0.22}>
            <Statement data={data} />
          </MountCard>
        </div>
      </div>
    </section>
  );
}

// ── Stats (live figure cards — count up + meter fills on view) ─────────────────

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = formatStat(stat.value, n);
  const ratio = Math.max(0.04, Math.min(1, n / fullScale(stat)));
  return (
    <div ref={ref} className="le-stat" data-edit-item={`stats.${index}`}>
      <div className="le-stat-top">
        <span className="le-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{formatted}{stat.suffix}</span>
        <span className="le-stat-delta" aria-hidden="true">▲</span>
      </div>
      <span className="le-meter" aria-hidden="true"><span className="le-meter-fill" style={{ inlineSize: `${ratio * 100}%` }} /></span>
      <span className="le-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function LeStats({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.stats} className="le-stats">
      <div className="le-wrap le-stats-row">{data.stats.map((st, i) => <StatItem key={i} stat={st} index={i} />)}</div>
    </section>
  );
}

// ── Why (the ledger of trust) ──────────────────────────────────────────────────

const features = (s: LeStrings) => [
  { icon: 'ReceiptText', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function LeWhy({ data }: { data: TemplateData }) {
  const s = leStrings(data.locale);
  return (
    <section className="le-section le-band">
      <div className="le-wrap">
        <Reveal><p className="le-eyebrow"><span className="le-eyebrow-dot" aria-hidden="true" /><span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? s.whyEyebrowLe}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="le-h2" data-edit="copy.whyHeading" data-edit-type="text">{data.copy?.whyHeading ?? s.whyHeadingLe}</h2></Reveal>
        <div className="le-why-grid">
          {features(s).map((f, i) => (
            <Reveal key={i} delay={i * 0.06} className="le-why">
              <span className="le-why-icon"><DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={22} strokeWidth={1.75} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" /></span>
              <h3 className="le-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">{data.copy?.[f.titleKey] ?? f.title}</h3>
              <p className="le-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">{data.copy?.[f.bodyKey] ?? f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages (itemised statement / pricing cards) ──────────────────────────────

function LePackages({ data }: { data: TemplateData }) {
  const s = leStrings(data.locale);
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="le-section">
      <div className="le-wrap">
        <Reveal><p className="le-eyebrow"><span className="le-eyebrow-dot" aria-hidden="true" /><span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? s.packagesEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="le-h2" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingLe}</h2></Reveal>
        <Reveal as="p" className="le-lead" delay={0.12}><span data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubLe}</span></Reveal>
        <div className="le-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.06} data-edit-item={`packages.${i}`}>
              <div className={cx('le-pkg', pkg.popular && 'is-popular')}>
                {pkg.popular && <span className="le-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge ?? s.badgePopular}</span>}
                <p className="le-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                <p className="le-pkg-price">
                  <span className="le-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">₪{pkg.price}</span>
                  {pkg.unit && <span className="le-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                </p>
                <ul className="le-pkg-features">
                  {pkg.features.map((f, fi) => (
                    <li key={fi}><span className="le-pkg-tick" aria-hidden="true"><Check size={12} strokeWidth={3} /></span><span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span></li>
                  ))}
                </ul>
                <button className={cx('le-btn', pkg.popular ? 'le-btn-primary' : 'le-btn-ghost', 'le-btn-block')} data-edit="labels.packageCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
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

// ── About ──────────────────────────────────────────────────────────────────────

function LeAbout({ data }: { data: TemplateData }) {
  const s = leStrings(data.locale);
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="le-section le-band">
      <div className="le-wrap le-about">
        <div className="le-about-media">
          <Reveal y={26}>
            <div className="le-about-photo">
              <img src={about.image} alt={s.aboutImageAlt} className="le-about-img" data-edit="about.image" data-edit-type="image" />
            </div>
          </Reveal>
          <Reveal delay={0.1} className="le-instructor">
            <img src={instructor.photo} alt={instructor.name} className="le-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div className="le-instructor-id">
              <p className="le-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p>
              <p className="le-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
            </div>
          </Reveal>
        </div>
        <div className="le-about-copy">
          <Reveal><p className="le-eyebrow"><span className="le-eyebrow-dot" aria-hidden="true" /><span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? s.aboutEyebrow}</span></p></Reveal>
          <Reveal delay={0.06}><h2 className="le-h2 le-h2-tight" data-edit="about.heading" data-edit-type="text">{about.heading}</h2></Reveal>
          {about.body.map((p, i) => (
            <Reveal key={i} as="p" className="le-body" delay={0.1 + i * 0.06}><span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span></Reveal>
          ))}
          <Reveal delay={0.22}>
            <ul className="le-checklist">
              {about.checklist.map((item, i) => (
                <li key={i} data-edit-item={`about.checklist.${i}`}>
                  <span className="le-tick" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          {instructor.bio && <Reveal as="p" className="le-body" delay={0.26}><span data-edit="instructor.bio" data-edit-type="text">{instructor.bio}</span></Reveal>}
          {instructor.credentials.length > 0 && (
            <Reveal delay={0.3}>
              <div className="le-creds">
                {instructor.credentials.map((c, i) => (
                  <span key={i} className="le-cred" data-edit-item={`instructor.credentials.${i}`}>
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

// ── Areas (a clean coverage list with emerald ticks) ───────────────────────────

function LeAreas({ data }: { data: TemplateData }) {
  const s = leStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="le-section">
      <div className="le-wrap">
        <Reveal><p className="le-eyebrow"><span className="le-eyebrow-dot" aria-hidden="true" /><span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? s.areasEyebrowLe}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="le-h2" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingLe}</h2></Reveal>
        <ul className="le-areas">
          {data.areas.map((area, i) => (
            <Reveal key={i} as="li" delay={(i % 4) * 0.04} className="le-area" data-edit-item={`areas.${i}`}>
              <span className="le-tick" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>
              <span className="le-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              {area.note && <span className="le-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Reviews (trust cards with a verified tick) ─────────────────────────────────

function LeReviews({ data }: { data: TemplateData }) {
  const s = leStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="le-section le-band">
      <div className="le-wrap">
        <Reveal><p className="le-eyebrow"><span className="le-eyebrow-dot" aria-hidden="true" /><span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? s.reviewsEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="le-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingLe}</h2></Reveal>
        <div className="le-reviews">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06} className="le-review" data-edit-item={`reviews.${i}`}>
              <div className="le-review-top">
                <Stars n={r.rating} />
                <span className="le-verified"><BadgeCheck size={14} aria-hidden="true" />{s.verifiedLabel}</span>
              </div>
              <blockquote className="le-review-text">“<span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span>”</blockquote>
              {r.reply && (
                <p className="le-review-reply">
                  <span className="le-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                </p>
              )}
              <div className="le-review-meta">
                {r.avatar && <img src={r.avatar} alt={r.name} className="le-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                <div>
                  <p className="le-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                  {r.meta && <p className="le-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery ─────────────────────────────────────────────────────────────────────

function LeGallery({ data }: { data: TemplateData }) {
  const s = leStrings(data.locale);
  return (
    <section className="le-section">
      <div className="le-wrap">
        <Reveal><p className="le-eyebrow"><span className="le-eyebrow-dot" aria-hidden="true" /><span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? s.galleryEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="le-h2" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingLe}</h2></Reveal>
        <div className="le-gallery">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06} className="le-gallery-cell" data-edit-item={`gallery.${i}`}>
              <img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ (clean disclosure rows) ────────────────────────────────────────────────

function LeFaq({ data }: { data: TemplateData }) {
  const s = leStrings(data.locale);
  const [open, setOpen] = useState<number | null>(0);
  const editing = useIsEditing();
  return (
    <section id={SECTION_IDS.faq} className="le-section le-band">
      <div className="le-wrap le-faq-wrap">
        <Reveal><p className="le-eyebrow"><span className="le-eyebrow-dot" aria-hidden="true" /><span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? s.faqEyebrow}</span></p></Reveal>
        <Reveal delay={0.06}><h2 className="le-h2" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingLe}</h2></Reveal>
        <div className="le-faq-list">
          {data.faqs.map((faq, i) => {
            const isOpen = editing || open === i;
            return (
              <div key={i} className="le-faq-item" data-edit-item={`faqs.${i}`}>
                <button className="le-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span data-edit={`faqs.${i}.q`} data-edit-type="text">{faq.q}</span>
                  <span className="le-faq-ic" aria-hidden="true">{isOpen ? <Minus size={16} /> : <Plus size={16} />}</span>
                </button>
                <div className={cx('le-faq-panel', isOpen && 'is-open')}>
                  <div className="le-faq-panel-in"><p data-edit={`faqs.${i}.a`} data-edit-type="text">{faq.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Book (the fintech "open your first lesson" panel) ──────────────────────────

function LeBook({ data }: { data: TemplateData }) {
  const s = leStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="le-section le-book-section">
      <div className="le-wrap">
        <Reveal className="le-book">
          <div className="le-book-copy">
            <h2 className="le-book-h" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingLe}</h2>
            <p className="le-book-body" data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodyLe}</p>
            <div className="le-book-ctas">
              {data.bookingUrl ? (
                <a href={data.bookingUrl} className="le-btn le-btn-onaccent le-btn-lg" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={16} aria-hidden="true" /></a>
              ) : (
                <button type="button" className="le-btn le-btn-onaccent le-btn-lg" title={s.publishNote} disabled aria-disabled="true" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={16} aria-hidden="true" /></button>
              )}
              {data.enrollUrl && <a href={data.enrollUrl} className="le-btn le-btn-onaccent-ghost le-btn-lg"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span></a>}
            </div>
          </div>
          {data.packages[0] && (
            <div className="le-book-badge" aria-hidden="true">
              <span className="le-book-badge-dot" />
              <span className="le-book-badge-fig">₪{data.packages[0].price}</span>
              <span className="le-book-badge-label">{data.packages[0].unit ?? s.statPerLesson}</span>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer ────────────────────────────────────────────────────────────

function LeContact({ data }: { data: TemplateData }) {
  const s = leStrings(data.locale);
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="le-footer">
      <div className="le-wrap le-footer-grid">
        <div>
          <p className="le-eyebrow"><span className="le-eyebrow-dot" aria-hidden="true" /><span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeading}</span></p>
          <div className="le-contact-info">
            <a href={`tel:${contact.phone}`} className="le-contact-link"><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={16} strokeWidth={1.75} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span></a>
            <a href={`mailto:${contact.email}`} className="le-contact-link"><DynamicIcon name={data.icons?.email ?? 'Mail'} size={16} strokeWidth={1.75} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span></a>
            <span className="le-contact-link"><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={16} strokeWidth={1.75} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span></span>
          </div>
          <div className="le-socials">
            {socials.map((so, i) => (
              <a key={i} href={so.url} className="le-social" target="_blank" rel="noreferrer" aria-label={so.platform} data-edit-item={`contact.socials.${i}`}>
                <SocialIcon platform={so.platform} size={16} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="le-eyebrow"><span className="le-eyebrow-dot" aria-hidden="true" /><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabel}</span></p>
          <table className="le-hours">
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
      <div className="le-wrap le-footer-bottom">
        <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
        <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCredit}</span>
      </div>
    </footer>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function Ledger({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts(['https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600&family=Roboto+Mono:wght@400;500&display=swap']);
  const active = useScrollSpy(Object.values(SECTION_IDS));
  return (
    <div className="tmpl-ledger" dir={data.dir} style={data.theme as CSSProperties} data-edit="theme.bg" data-edit-type="background">
      <LeNav data={data} active={active} />
      <main>
        <LeHero data={data} />
        <LeStats data={data} />
        <LeWhy data={data} />
        {data.packages.length > 0 && <LePackages data={data} />}
        <LeAbout data={data} />
        <LeAreas data={data} />
        {data.reviews.length > 0 && <LeReviews data={data} />}
        {data.gallery.length > 0 && <LeGallery data={data} />}
        <LeFaq data={data} />
        <LeBook data={data} />
        <LeContact data={data} />
      </main>
    </div>
  );
}

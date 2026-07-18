/**
 * Solari — the split-flap departure board. A driving lesson is a DEPARTURE, so
 * the whole site is a mechanical Solari di Udine board: a warm-black board, a
 * brushed-brass frame with corner rivets, departure-amber characters, and one
 * bold kinetic idea — words that ASSEMBLE by flap animation as they scroll into
 * view. Industrial, tactile, precise. Not digital, not neon, not glass.
 *
 * Oswald (condensed signage) for board words / headings · DM Mono (the
 * mechanical readout voice) for flap characters / data / eyebrows / prices ·
 * Barlow (industrial humanist) for body copy.
 *
 * Palette via CSS vars on `.tmpl-solari`: --sl-board (page) / --sl-flap (panel)
 * / --sl-text (chalk) / --sl-amber (the ONE accent) / --sl-brass (frame &
 * secondary). Every tint derives via color-mix from those, so Customize
 * recolouring never breaks.
 *
 * The split-flap keeps text EDITABLE + ACCESSIBLE: each tile renders its final
 * character as real selectable text carrying the section's `data-edit`; the
 * flap that flips over it is a decorative aria-hidden overlay. In Customize
 * (editing) mode and under `prefers-reduced-motion` the tiling is skipped
 * entirely, so the headline is plain editable text and the board is a static,
 * readable board. Arabic/Hebrew (RTL) is never split into per-character tiles
 * (which would break Arabic letter-joining) — it renders as plain board text.
 */
import { Fragment, useRef, useState, type CSSProperties } from 'react';
import { useInView } from 'framer-motion';
import { Plus, Minus, Star, Menu, X, ArrowRight, Check } from 'lucide-react';
import type { TemplateData, Dir } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { slStrings, type SlStrings } from './strings';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, EnterMount, useCountUp, useIsEditing, reviewReplyLabel,
  usePrefersReducedMotion,
} from '../shared';
import './solari.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

// ── SIGNATURE — the split-flap flip ─────────────────────────────────────────
/**
 * Renders `text` as a row of split-flap character tiles. Each tile shows its
 * FINAL character as real text (the source of truth for selection, screen
 * readers and Customize `data-edit`); on scroll-into-view a decorative,
 * aria-hidden `.sl-cover` flips over it — a handful of cheap transform/opacity
 * flaps, staggered left→right, that settle to reveal the char.
 *
 * RTL (Arabic/Hebrew) and editing mode render PLAIN text — never per-character
 * tiles — so Arabic letter-joining stays intact and the headline edits cleanly.
 */
function Flap({ text, dir, className, big }: { text: string; dir: Dir; className?: string; big?: boolean }) {
  const editing = useIsEditing();
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -12% 0px' });
  if (dir === 'rtl' || editing) return <span className={cx('sl-flaps', big && 'sl-flaps-big', 'sl-flaps-plain', className)}>{text}</span>;
  const flip = inView && !reduced;
  const words = text.split(' ');
  let k = -1;
  return (
    <span ref={ref} className={cx('sl-flaps', big && 'sl-flaps-big', className)}>
      {words.map((word, wi) => (
        <Fragment key={wi}>
          {wi > 0 && <span className="sl-gap"> </span>}
          <span className="sl-word">
            {Array.from(word).map((ch, ci) => {
              k += 1;
              return (
                <span key={ci} className={cx('sl-tile', flip && 'is-flip')}>
                  <span className="sl-char">{ch}</span>
                  <span className="sl-cover" aria-hidden="true" style={flip ? { animationDelay: `${Math.min(k, 26) * 34}ms` } : undefined} />
                </span>
              );
            })}
          </span>
        </Fragment>
      ))}
    </span>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="sl-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill={i < n ? 'var(--sl-amber)' : 'none'} color={i < n ? 'var(--sl-amber)' : 'var(--sl-brass)'} />
      ))}
    </span>
  );
}

// ── Nav (a sticky board header) ──────────────────────────────────────────────

const navLinks = (s: SlStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about, label: s.navAbout },
  { id: SECTION_IDS.areas, label: s.navAreas },
  { id: SECTION_IDS.reviews, label: s.navReviews },
  { id: SECTION_IDS.faq, label: s.navFaq },
];

function SlNav({ data, active }: { data: TemplateData; active: string }) {
  const s = slStrings(data.locale);
  const [open, setOpen] = useState(false);
  const links = navLinks(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  return (
    <nav className="sl-nav" aria-label={s.mainNavAria}>
      <div className="sl-nav-inner">
        <button className="sl-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label={s.goToTopAria}>
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={30} bg="var(--sl-amber)" fg="var(--sl-board)" radius={3} />
          </span>
          <span data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <div className="sl-nav-links">
          {links.map(({ id, label }) => (
            <button
              key={id}
              className={cx('sl-nav-link', active === id && 'is-active')}
              onClick={() => scrollToSection(id)}
              data-edit={`copy.nav_${id}`}
              data-edit-type="text"
            >
              {data.copy?.[`nav_${id}`] ?? label}
            </button>
          ))}
        </div>
        <div className="sl-nav-end">
          {data.accountUrl && (
            <a href={data.accountUrl} className="sl-btn sl-btn-ghost sl-btn-sm">{data.copy?.nav_account ?? s.navAccount}</a>
          )}
          <button className="sl-btn sl-btn-primary sl-btn-sm" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{bookLabel}</button>
          <button className="sl-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && (
        <div className="sl-nav-mobile">
          {links.map(({ id, label }) => <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{label}</button>)}
          {data.accountUrl && <a href={data.accountUrl} className="sl-nav-mobile-link">{data.copy?.nav_account ?? s.navAccount}</a>}
        </div>
      )}
    </nav>
  );
}

// ── The departures board (driving-specific board moment, from real data) ─────

function SlDepartures({ data }: { data: TemplateData }) {
  const s = slStrings(data.locale);
  const openDays = data.hours.filter((h) => !h.closed && h.open);
  const rows = openDays.length
    ? openDays.slice(0, 6).map((h) => ({ time: h.open, dest: h.day }))
    : data.areas.slice(0, 6).map((a) => ({ time: '—', dest: a.name }));
  if (rows.length === 0) return null;
  return (
    <Reveal className="sl-board" y={26}>
      <div className="sl-board-head">
        <span className="sl-board-title">{s.departuresLabel}</span>
        <span className="sl-board-live"><span className="sl-live-dot" aria-hidden="true" />{s.boardStatus}</span>
      </div>
      <div className="sl-board-cols" aria-hidden="true">
        <span>{s.boardTimeCol}</span>
        <span>{s.boardDestCol}</span>
        <span>{s.boardStatusCol}</span>
      </div>
      <ul className="sl-board-rows">
        {rows.map((r, i) => (
          <li key={i} className="sl-board-row">
            <span className="sl-board-time"><Flap text={r.time} dir={data.dir} /></span>
            <span className="sl-board-dest">{r.dest}</span>
            <span className="sl-board-stat"><span className="sl-stat-dot" aria-hidden="true" />{s.bookingOpen}</span>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

// ── Hero (board headline | framed media panel) + departures board ────────────

function SlHero({ data }: { data: TemplateData }) {
  const s = slStrings(data.locale);
  const { hero } = data;
  return (
    <section id={SECTION_IDS.hero} className="sl-section sl-hero">
      <div className="sl-wrap sl-hero-grid">
        <div className="sl-hero-copy">
          <Reveal><p className="sl-eyebrow"><span data-edit="hero.eyebrow" data-edit-type="text"><Flap text={hero.eyebrow} dir={data.dir} /></span></p></Reveal>
          <Reveal delay={0.06}><h1 className="sl-h1" data-edit="hero.headline" data-edit-type="text"><Flap text={hero.headline} dir={data.dir} big /></h1></Reveal>
          <Reveal as="p" className="sl-hero-sub" delay={0.12}><span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span></Reveal>
          <Reveal className="sl-hero-ctas" delay={0.18}>
            <button className="sl-btn sl-btn-primary" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{hero.ctaPrimary} <ArrowRight size={15} aria-hidden="true" /></button>
            <button className="sl-btn sl-btn-ghost" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>{hero.ctaSecondary}</button>
          </Reveal>
        </div>
        <div className="sl-hero-media">
          <EnterMount perspective={1400}>
            <figure className="sl-panel">
              <div className="sl-panel-crop">
                <img src={hero.image} alt={s.heroImageAlt} className="sl-panel-img" data-edit="hero.image" data-edit-type="image" />
                <span className="sl-panel-tag" aria-hidden="true"><span className="sl-live-dot" />{s.boardStatus}</span>
              </div>
              <figcaption className="sl-panel-cap">{s.boardStatus} · {data.areas.length} {s.destinationsLabel}</figcaption>
            </figure>
          </EnterMount>
        </div>
      </div>
      <div className="sl-wrap"><SlDepartures data={data} /></div>
    </section>
  );
}

// ── Stats (rolling flap readouts on board tiles) ─────────────────────────────

function fmtStat(stat: TemplateData['stats'][number], n: number): string {
  const num = Number.isInteger(stat.value) ? Math.round(n).toLocaleString('en-US') : n.toFixed(1);
  return `${stat.prefix ?? ''}${num}${stat.suffix ?? ''}`;
}

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const editing = useIsEditing();
  const n = useCountUp(stat.value, inView);
  const finalStr = fmtStat(stat, stat.value);
  const disp = fmtStat(stat, n).padStart(finalStr.length, ' ');
  return (
    <div ref={ref} className="sl-stat" data-edit-item={`stats.${index}`}>
      <span className="sl-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">
        {editing ? finalStr : (
          <span className="sl-flaps sl-flaps-num" aria-label={finalStr}>
            {Array.from(disp).map((ch, ci) => (ch === ' '
              ? <span key={ci} className="sl-gap" aria-hidden="true" />
              : <span key={ci} className="sl-tile sl-tile-static" aria-hidden="true"><span className="sl-char">{ch}</span></span>))}
          </span>
        )}
      </span>
      <span className="sl-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function SlStats({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.stats} className="sl-stats">
      <div className="sl-wrap sl-stats-row">{data.stats.map((st, i) => <StatItem key={i} stat={st} index={i} />)}</div>
    </section>
  );
}

// ── Why (the board's key services) ───────────────────────────────────────────

const features = (s: SlStrings) => [
  { icon: 'Clock', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function SlWhy({ data }: { data: TemplateData }) {
  const s = slStrings(data.locale);
  return (
    <section className="sl-section">
      <div className="sl-wrap">
        <Reveal><p className="sl-eyebrow"><span data-edit="copy.whyEyebrow" data-edit-type="text"><Flap text={data.copy?.whyEyebrow ?? s.whyEyebrowSl} dir={data.dir} /></span></p></Reveal>
        <Reveal delay={0.06}><h2 className="sl-h2" data-edit="copy.whyHeading" data-edit-type="text">{data.copy?.whyHeading ?? s.whyHeadingSl}</h2></Reveal>
        <div className="sl-why-grid">
          {features(s).map((f, i) => (
            <Reveal key={i} delay={i * 0.06} className="sl-why">
              <span className="sl-why-icon"><DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={20} strokeWidth={1.5} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" /></span>
              <h3 className="sl-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">{data.copy?.[f.titleKey] ?? f.title}</h3>
              <p className="sl-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">{data.copy?.[f.bodyKey] ?? f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages (board panels) ──────────────────────────────────────────────────

function SlPackages({ data }: { data: TemplateData }) {
  const s = slStrings(data.locale);
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="sl-section">
      <div className="sl-wrap">
        <Reveal><p className="sl-eyebrow"><span data-edit="copy.packagesEyebrow" data-edit-type="text"><Flap text={data.copy?.packagesEyebrow ?? s.packagesEyebrow} dir={data.dir} /></span></p></Reveal>
        <Reveal delay={0.06}><h2 className="sl-h2" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingSl}</h2></Reveal>
        <Reveal as="p" className="sl-lead" delay={0.12}><span data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubSl}</span></Reveal>
        <div className="sl-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.06} data-edit-item={`packages.${i}`}>
              <div className={cx('sl-pkg', pkg.popular && 'is-popular')}>
                {pkg.popular && <span className="sl-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge ?? s.bookingOpen}</span>}
                <p className="sl-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                <p className="sl-pkg-price">
                  <span className="sl-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">₪{pkg.price}</span>
                  {pkg.unit && <span className="sl-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                </p>
                <ul className="sl-pkg-features">
                  {pkg.features.map((f, fi) => (
                    <li key={fi}><Check size={14} className="sl-check" aria-hidden="true" /><span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span></li>
                  ))}
                </ul>
                <button className={cx('sl-btn', pkg.popular ? 'sl-btn-primary' : 'sl-btn-ghost', 'sl-btn-block')} data-edit="labels.packageCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
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

function SlAbout({ data }: { data: TemplateData }) {
  const s = slStrings(data.locale);
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="sl-section">
      <div className="sl-wrap sl-about">
        <div className="sl-about-media">
          <Reveal y={26}>
            <figure className="sl-panel">
              <div className="sl-panel-crop">
                <img src={about.image} alt={s.aboutImageAlt} className="sl-panel-img sl-about-img" data-edit="about.image" data-edit-type="image" />
              </div>
            </figure>
          </Reveal>
          <Reveal delay={0.1} className="sl-instructor">
            <img src={instructor.photo} alt={instructor.name} className="sl-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div className="sl-instructor-id">
              <p className="sl-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p>
              <p className="sl-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
            </div>
          </Reveal>
        </div>
        <div className="sl-about-copy">
          <Reveal><p className="sl-eyebrow"><span data-edit="copy.aboutEyebrow" data-edit-type="text"><Flap text={data.copy?.aboutEyebrow ?? s.aboutEyebrow} dir={data.dir} /></span></p></Reveal>
          <Reveal delay={0.06}><h2 className="sl-h2 sl-h2-tight" data-edit="about.heading" data-edit-type="text">{about.heading}</h2></Reveal>
          {about.body.map((p, i) => (
            <Reveal key={i} as="p" className="sl-body" delay={0.1 + i * 0.06}><span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span></Reveal>
          ))}
          <Reveal delay={0.22}>
            <ul className="sl-checklist">
              {about.checklist.map((item, i) => (
                <li key={i} data-edit-item={`about.checklist.${i}`}>
                  <Check size={15} strokeWidth={2} className="sl-check" aria-hidden="true" />
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          {instructor.bio && <Reveal as="p" className="sl-body" delay={0.26}><span data-edit="instructor.bio" data-edit-type="text">{instructor.bio}</span></Reveal>}
          {instructor.credentials.length > 0 && (
            <Reveal delay={0.3}>
              <div className="sl-creds">
                {instructor.credentials.map((c, i) => (
                  <span key={i} className="sl-cred" data-edit-item={`instructor.credentials.${i}`}>
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

// ── Areas (a departures-style list) ──────────────────────────────────────────

function SlAreas({ data }: { data: TemplateData }) {
  const s = slStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="sl-section">
      <div className="sl-wrap">
        <Reveal><p className="sl-eyebrow"><span data-edit="copy.areasEyebrow" data-edit-type="text"><Flap text={data.copy?.areasEyebrow ?? s.areasEyebrowSl} dir={data.dir} /></span></p></Reveal>
        <Reveal delay={0.06}><h2 className="sl-h2" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingSl}</h2></Reveal>
        <ul className="sl-areas">
          {data.areas.map((area, i) => (
            <Reveal key={i} as="li" delay={(i % 4) * 0.04} className="sl-area" data-edit-item={`areas.${i}`}>
              <span className="sl-area-dot" aria-hidden="true" />
              <span className="sl-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              {area.note && <span className="sl-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Reviews (flap-panel cards) ───────────────────────────────────────────────

function SlReviews({ data }: { data: TemplateData }) {
  const s = slStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="sl-section">
      <div className="sl-wrap">
        <Reveal><p className="sl-eyebrow"><span data-edit="copy.reviewsEyebrow" data-edit-type="text"><Flap text={data.copy?.reviewsEyebrow ?? s.reviewsEyebrow} dir={data.dir} /></span></p></Reveal>
        <Reveal delay={0.06}><h2 className="sl-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingSl}</h2></Reveal>
        <div className="sl-reviews">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06} className="sl-review" data-edit-item={`reviews.${i}`}>
              <Stars n={r.rating} />
              <blockquote className="sl-review-text">“<span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span>”</blockquote>
              {r.reply && (
                <p className="sl-review-reply">
                  <span className="sl-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                </p>
              )}
              <div className="sl-review-meta">
                {r.avatar && <img src={r.avatar} alt={r.name} className="sl-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                <div>
                  <p className="sl-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                  {r.meta && <p className="sl-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery (framed plates) ──────────────────────────────────────────────────

function SlGallery({ data }: { data: TemplateData }) {
  const s = slStrings(data.locale);
  return (
    <section className="sl-section">
      <div className="sl-wrap">
        <Reveal><p className="sl-eyebrow"><span data-edit="copy.galleryEyebrow" data-edit-type="text"><Flap text={data.copy?.galleryEyebrow ?? s.galleryEyebrow} dir={data.dir} /></span></p></Reveal>
        <Reveal delay={0.06}><h2 className="sl-h2" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingSl}</h2></Reveal>
        <div className="sl-gallery">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06} className="sl-gallery-cell" data-edit-item={`gallery.${i}`}>
              <img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ (hairline board rows) ────────────────────────────────────────────────

function SlFaq({ data }: { data: TemplateData }) {
  const s = slStrings(data.locale);
  const [open, setOpen] = useState<number | null>(0);
  const editing = useIsEditing();
  return (
    <section id={SECTION_IDS.faq} className="sl-section">
      <div className="sl-wrap sl-faq-wrap">
        <Reveal><p className="sl-eyebrow"><span data-edit="copy.faqEyebrow" data-edit-type="text"><Flap text={data.copy?.faqEyebrow ?? s.faqEyebrow} dir={data.dir} /></span></p></Reveal>
        <Reveal delay={0.06}><h2 className="sl-h2" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingSl}</h2></Reveal>
        <div className="sl-faq-list">
          {data.faqs.map((faq, i) => {
            const isOpen = editing || open === i;
            return (
              <div key={i} className="sl-faq-item" data-edit-item={`faqs.${i}`}>
                <button className="sl-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span data-edit={`faqs.${i}.q`} data-edit-type="text">{faq.q}</span>
                  <span className="sl-faq-ic" aria-hidden="true">{isOpen ? <Minus size={14} /> : <Plus size={14} />}</span>
                </button>
                <div className={cx('sl-faq-panel', isOpen && 'is-open')}>
                  <div className="sl-faq-panel-in"><p data-edit={`faqs.${i}.a`} data-edit-type="text">{faq.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Book (one large board panel — "NEXT DEPARTURE") ──────────────────────────

function SlBook({ data }: { data: TemplateData }) {
  const s = slStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="sl-section">
      <div className="sl-wrap">
        <Reveal className="sl-book">
          <p className="sl-eyebrow sl-eyebrow-center"><Flap text={s.nextDeparture} dir={data.dir} /></p>
          <h2 className="sl-h2" data-edit="copy.bookHeading" data-edit-type="text"><Flap text={data.copy?.bookHeading ?? s.bookHeadingSl} dir={data.dir} big /></h2>
          <p className="sl-lead" data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodySl}</p>
          <div className="sl-book-ctas">
            {data.bookingUrl ? (
              <a href={data.bookingUrl} className="sl-btn sl-btn-primary" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></a>
            ) : (
              <button type="button" className="sl-btn sl-btn-primary" title={s.publishNote} disabled aria-disabled="true" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={15} aria-hidden="true" /></button>
            )}
            {data.enrollUrl && <a href={data.enrollUrl} className="sl-btn sl-btn-ghost"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span></a>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer ─────────────────────────────────────────────────────────

function SlContact({ data }: { data: TemplateData }) {
  const s = slStrings(data.locale);
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="sl-footer">
      <div className="sl-wrap sl-footer-grid">
        <div>
          <p className="sl-eyebrow"><span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeading}</span></p>
          <div className="sl-contact-info">
            <a href={`tel:${contact.phone}`} className="sl-contact-link"><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span></a>
            <a href={`mailto:${contact.email}`} className="sl-contact-link"><DynamicIcon name={data.icons?.email ?? 'Mail'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span></a>
            <span className="sl-contact-link"><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={15} strokeWidth={1.5} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span></span>
          </div>
          <div className="sl-socials">
            {socials.map((so, i) => (
              <a key={i} href={so.url} className="sl-social" target="_blank" rel="noreferrer" aria-label={so.platform} data-edit-item={`contact.socials.${i}`}>
                <SocialIcon platform={so.platform} size={16} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="sl-eyebrow"><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabel}</span></p>
          <table className="sl-hours">
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
      <div className="sl-wrap sl-footer-bottom">
        <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
        <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCredit}</span>
      </div>
    </footer>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function Solari({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts(['https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Barlow:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap']);
  const active = useScrollSpy(Object.values(SECTION_IDS));
  return (
    <div className="tmpl-solari" dir={data.dir} style={data.theme as CSSProperties} data-edit="theme.bg" data-edit-type="background">
      {/* Brushed-brass frame with corner rivets — fixed, decorative, below the nav */}
      <div className="sl-frame" aria-hidden="true" />
      <SlNav data={data} active={active} />
      <main>
        <SlHero data={data} />
        <SlStats data={data} />
        <SlWhy data={data} />
        {data.packages.length > 0 && <SlPackages data={data} />}
        <SlAbout data={data} />
        <SlAreas data={data} />
        {data.reviews.length > 0 && <SlReviews data={data} />}
        {data.gallery.length > 0 && <SlGallery data={data} />}
        <SlFaq data={data} />
        <SlBook data={data} />
        <SlContact data={data} />
      </main>
    </div>
  );
}

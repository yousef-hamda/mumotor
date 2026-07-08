import { useState, useRef } from 'react';
import type { CSSProperties } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Star, ChevronDown, Check, Clock,
} from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import {
  SECTION_IDS, scrollToSection, useScrollSpy,
  useTemplateFonts, Reveal, useCountUp, usePrefersReducedMotion, useIsEditing, reviewReplyLabel,
} from '../shared';
import { fmt } from '../strings';
import { ftStrings } from './strings';
import './full-throttle.css';

// Framer whileTap "press depth" — translates to shadow offset then snaps back
const TAP = { x: 6, y: 6 };
const TAP_T = { duration: 0.08 };

// ── NAV ───────────────────────────────────────────────────────────────────────
function Nav({ data, active }: { data: TemplateData; active: string }) {
  const s = ftStrings(data.locale);
  const [open, setOpen] = useState(false);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  const links = [
    { label: s.navPackages, id: SECTION_IDS.packages },
    { label: s.navAbout,    id: SECTION_IDS.about    },
    { label: s.navAreas,    id: SECTION_IDS.areas    },
    ...(data.reviews.length > 0 ? [{ label: s.navReviews, id: SECTION_IDS.reviews }] : []),
    { label: s.navFaq,      id: SECTION_IDS.faq      },
  ];
  const go = (id: string) => { scrollToSection(id); setOpen(false); };
  return (
    <nav className="ft-nav" role="navigation" aria-label="Main navigation">
      <div className="ft-nav-inner">
        <motion.button
          className="ft-logo"
          onClick={() => go(SECTION_IDS.hero)}
          aria-label={s.backToTop}
          whileTap={TAP} transition={TAP_T}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}
        >
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={32} bg="#FFE600" fg="#000000" square ring={false} style={{ border: '2px solid #000' }} />
          </span>
          <span data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </motion.button>

        <ul className="ft-nav-links" role="list">
          {links.map(({ label, id }) => (
            <li key={id}>
              <button
                className={`ft-nav-link${active === id ? ' ft-nav-link--active' : ''}`}
                onClick={() => scrollToSection(id)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>

        {data.accountUrl && (
          <a href={data.accountUrl} className="ft-btn ft-btn--black">{data.copy?.nav_account ?? s.navAccount}</a>
        )}

        <motion.button
          className="ft-nav-book"
          onClick={() => scrollToSection(SECTION_IDS.book)}
          whileTap={TAP} transition={TAP_T}
          data-edit="labels.bookCta" data-edit-type="text"
        >
          {bookLabel}
        </motion.button>

        <button
          className="ft-hamburger"
          aria-label={open ? s.closeMenu : s.openMenu}
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >
          <span /><span /><span />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="ft-nav-mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeInOut' }}
          >
            {links.map(({ label, id }) => (
              <button key={id} className="ft-nav-mobile-link" onClick={() => go(id)}>
                {label}
              </button>
            ))}
            {data.accountUrl && (
              <a href={data.accountUrl} className="ft-nav-mobile-link">{data.copy?.nav_account ?? s.navAccount}</a>
            )}
            <motion.button
              className="ft-btn ft-btn--black"
              style={{ marginTop: '0.75rem' }}
              onClick={() => go(SECTION_IDS.book)}
              whileTap={TAP} transition={TAP_T}
            >
              {bookLabel}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ── HERO ──────────────────────────────────────────────────────────────────────
function Hero({ data }: { data: TemplateData }) {
  const s = ftStrings(data.locale);
  return (
    <section id={SECTION_IDS.hero} className="ft-hero">
      <div className="ft-hero-inner">
        <div>
          <Reveal delay={0.05}>
            <span className="ft-hero-eyebrow" data-edit="hero.eyebrow" data-edit-type="text">{data.hero.eyebrow}</span>
          </Reveal>
          <Reveal delay={0.16} y={44}>
            <h1 className="ft-hero-title" data-edit="hero.headline" data-edit-type="text">{data.hero.headline}</h1>
          </Reveal>
          <Reveal delay={0.28}>
            <p className="ft-hero-sub" data-edit="hero.sub" data-edit-type="text">{data.hero.sub}</p>
          </Reveal>
          <Reveal delay={0.4}>
            <div className="ft-hero-ctas">
              <motion.button
                className="ft-btn ft-btn--primary ft-btn--lg"
                onClick={() => scrollToSection(SECTION_IDS.book)}
                whileTap={TAP} transition={TAP_T}
                data-edit="hero.ctaPrimary" data-edit-type="text"
              >
                {data.hero.ctaPrimary}
              </motion.button>
              <motion.button
                className="ft-btn ft-btn--outline ft-btn--lg"
                onClick={() => scrollToSection(SECTION_IDS.packages)}
                whileTap={TAP} transition={TAP_T}
                data-edit="hero.ctaSecondary" data-edit-type="text"
              >
                {data.hero.ctaSecondary}
              </motion.button>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.24} x={36} y={0}>
          <div className="ft-hero-img-wrap">
            <img
              src={data.hero.image}
              alt={s.heroImageAlt}
              className="ft-hero-img"
              data-edit="hero.image" data-edit-type="image"
            />
            <span className="ft-hero-tag" data-edit="copy.heroTag" data-edit-type="text">{data.copy?.heroTag ?? s.heroTag}</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── STATS ─────────────────────────────────────────────────────────────────────
function StatCard({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const raw = useCountUp(stat.value, inView, 1200);
  const isDecimal = !Number.isInteger(stat.value);
  const display = isDecimal ? raw.toFixed(1) : Math.round(raw).toString();
  return (
    <div ref={ref} className="ft-stat-card" data-edit-item={`stats.${index}`}>
      <span className="ft-stat-number" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{display}{stat.suffix}</span>
      <span className="ft-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function Stats({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.stats} className="ft-stats">
      <div className="ft-stats-grid">
        {data.stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.1}>
            <StatCard stat={stat} index={i} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ── PACKAGES ──────────────────────────────────────────────────────────────────
function Packages({
  data, selectedId, onSelect,
}: { data: TemplateData; selectedId: string | null; onSelect: (id: string) => void }) {
  const s = ftStrings(data.locale);
  const go = (id: string) => { onSelect(id); scrollToSection(SECTION_IDS.book); };
  return (
    <section id={SECTION_IDS.packages} className="ft-packages">
      <div className="ft-section-inner">
        <Reveal>
          <h2 className="ft-heading" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingFt}</h2>
          <p className="ft-sub" data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubFt}</p>
        </Reveal>
        <div className="ft-packages-grid">
          {data.packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.1}>
              <motion.div
                className={[
                  'ft-pkg-card',
                  pkg.popular        ? 'ft-pkg-card--popular'  : '',
                  selectedId===pkg.id ? 'ft-pkg-card--selected' : '',
                ].join(' ')}
                whileTap={TAP} transition={TAP_T}
                onClick={() => go(pkg.id)}
                role="button" tabIndex={0}
                aria-pressed={selectedId === pkg.id}
                onKeyDown={e => { if (e.key==='Enter'||e.key===' ') go(pkg.id); }}
                data-edit-item={`packages.${i}`}
              >
                {pkg.badge && <span className="ft-pkg-badge">{pkg.badge}</span>}
                <h3 className="ft-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</h3>
                <div className="ft-pkg-price-row">
                  <span className="ft-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">₪{pkg.price}</span>
                  {pkg.unit && <span className="ft-pkg-unit">{pkg.unit}</span>}
                </div>
                {pkg.duration && (
                  <p className="ft-pkg-detail">
                    <Clock size={11} aria-hidden="true" />
                    {pkg.lessons ? `${pkg.lessons} × ` : ''}{pkg.duration}{s.minSuffix}
                    {(pkg.lessons ?? 1) !== 1 ? s.lessonsPlural : s.lessonSingular}
                  </p>
                )}
                <ul className="ft-pkg-features">
                  {pkg.features.map((f, j) => (
                    <li key={f} className="ft-pkg-feature" data-edit={`packages.${i}.features.${j}`} data-edit-type="text">
                      <span className="ft-check" aria-hidden="true"><Check size={10} /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <motion.button
                  className="ft-btn ft-btn--black ft-btn--full"
                  style={{ marginTop: 'auto' }}
                  whileTap={TAP} transition={TAP_T}
                  aria-pressed={selectedId === pkg.id}
                  onClick={e => { e.stopPropagation(); go(pkg.id); }}
                  data-edit="labels.packageCta" data-edit-type="text"
                >
                  {selectedId === pkg.id
                    ? s.selectedLabel
                    : pkg.popular
                      ? (data.labels?.packageCtaPopular ?? data.labels?.packageCta ?? s.bookThisPackage)
                      : (data.labels?.packageCta ?? s.bookThisPackage)}
                </motion.button>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── ABOUT ─────────────────────────────────────────────────────────────────────
function About({ data }: { data: TemplateData }) {
  const s = ftStrings(data.locale);
  return (
    <section id={SECTION_IDS.about} className="ft-about">
      <div className="ft-about-grid">
        <Reveal x={-32} y={0}>
          <div>
            <img
              src={data.about.image}
              alt={s.aboutImageAlt}
              className="ft-about-img"
              data-edit="about.image" data-edit-type="image"
            />
            <div className="ft-instructor-strip">
              <img
                src={data.instructor.photo}
                alt={data.instructor.name}
                className="ft-instructor-photo"
                data-edit="instructor.photo" data-edit-type="image"
              />
              <div>
                <span className="ft-instructor-name" data-edit="instructor.name" data-edit-type="text">{data.instructor.name}</span>
                <span className="ft-instructor-title">{data.instructor.title}</span>
              </div>
            </div>
          </div>
        </Reveal>

        <div>
          <Reveal>
            <h2 className="ft-heading" data-edit="about.heading" data-edit-type="text">{data.about.heading}</h2>
          </Reveal>
          {data.about.body.map((para, i) => (
            <Reveal key={i} delay={i * 0.1 + 0.1}>
              <p
                className="ft-about-body"
                {...(i === 0 ? { 'data-edit': 'about.body.0', 'data-edit-type': 'text' } : {})}
              >
                {para}
              </p>
            </Reveal>
          ))}
          <Reveal delay={0.25}>
            <ul className="ft-checklist">
              {data.about.checklist.map((item, i) => (
                <li key={i} className="ft-checklist-item" data-edit-item={`about.checklist.${i}`}>
                  <span className="ft-checklist-icon" aria-hidden="true">
                    <Check size={11} />
                  </span>
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.35}>
            <div className="ft-credentials">
              {data.instructor.credentials.map((c, i) => (
                <span key={i} className="ft-credential" data-edit-item={`instructor.credentials.${i}`}><span data-edit={`instructor.credentials.${i}`} data-edit-type="text">{c}</span></span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── AREAS ─────────────────────────────────────────────────────────────────────
function Areas({ data }: { data: TemplateData }) {
  const s = ftStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="ft-areas">
      <div className="ft-areas-wrap">
        <Reveal>
          <h2 className="ft-heading" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingFt}</h2>
          <p className="ft-sub" data-edit="copy.areasSub" data-edit-type="text">
            {data.copy?.areasSub ?? s.areasSubFt}
          </p>
        </Reveal>
        <div className="ft-areas-grid">
          {data.areas.map((area, i) => (
            <Reveal key={area.name} delay={i * 0.06}>
              <div className="ft-area-pill" data-edit-item={`areas.${i}`}>
                <span data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
                {area.note && <span className="ft-area-note">{area.note}</span>}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── REVIEWS ───────────────────────────────────────────────────────────────────
function Reviews({ data }: { data: TemplateData }) {
  const s = ftStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="ft-reviews">
      <div className="ft-section-inner">
        <Reveal>
          <h2 className="ft-heading ft-heading--white" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingFt}</h2>
        </Reveal>
        <div className="ft-reviews-grid">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.1}>
              <div className="ft-review-card" data-edit-item={`reviews.${i}`}>
                <div className="ft-stars" aria-label={fmt(s.starsAria, { n: r.rating })}>
                  {Array.from({ length: 5 }, (_, j) => (
                    <Star
                      key={j} size={14}
                      className={j < r.rating ? 'ft-star-filled' : 'ft-star-empty'}
                    />
                  ))}
                </div>
                <p className="ft-review-text">"<span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span>"</p>
                {r.reply && (
                  <p className="ft-review-reply">
                    <span className="ft-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                  </p>
                )}
                <div className="ft-review-author">
                  {r.avatar && (
                    <img src={r.avatar} alt={r.name} className="ft-review-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />
                  )}
                  <div>
                    <span className="ft-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</span>
                    {r.meta && <span className="ft-review-meta" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</span>}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── GALLERY ───────────────────────────────────────────────────────────────────
function Gallery({ data }: { data: TemplateData }) {
  const s = ftStrings(data.locale);
  if (data.gallery.length === 0) return null;
  return (
    <section className="ft-gallery">
      <div className="ft-section-inner">
        <Reveal>
          <h2 className="ft-heading" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingFt}</h2>
          <p className="ft-sub" data-edit="copy.gallerySub" data-edit-type="text">{data.copy?.gallerySub ?? s.gallerySubFt}</p>
        </Reveal>
        <div className="ft-gallery-grid">
          {data.gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.08}>
              <div className="ft-gallery-item" data-edit-item={`gallery.${i}`}>
                <img src={src} alt="" loading="lazy" className="ft-gallery-img" data-edit={`gallery.${i}`} data-edit-type="image" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
function FaqItem({
  faq, open, toggle, index,
}: { faq: TemplateData['faqs'][number]; open: boolean; toggle: () => void; index: number }) {
  const reduced = usePrefersReducedMotion();
  return (
    <div className={`ft-faq-item${open ? ' ft-faq-item--open' : ''}`} data-edit-item={`faqs.${index}`}>
      <button className="ft-faq-q" onClick={toggle} aria-expanded={open}>
        <span data-edit={`faqs.${index}.q`} data-edit-type="text">{faq.q}</span>
        <motion.span
          animate={reduced ? undefined : { rotate: open ? 180 : 0 }}
          transition={{ duration: 0.24 }}
          style={{ display: 'inline-flex', flexShrink: 0 }}
        >
          <ChevronDown size={20} aria-hidden="true" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="ft-faq-a"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
          >
            <p data-edit={`faqs.${index}.a`} data-edit-type="text">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FAQ({ data }: { data: TemplateData }) {
  const s = ftStrings(data.locale);
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const editing = useIsEditing();
  return (
    <section id={SECTION_IDS.faq} className="ft-faq">
      <div className="ft-section-inner--narrow">
        <Reveal>
          <h2 className="ft-heading" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingFt}</h2>
        </Reveal>
        <div className="ft-faq-list">
          {data.faqs.map((faq, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <FaqItem
                faq={faq}
                index={i}
                open={editing || openIdx === i}
                toggle={() => setOpenIdx(openIdx === i ? null : i)}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── BOOK ──────────────────────────────────────────────────────────────────────
function Book({ data }: { data: TemplateData }) {
  const s = ftStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="ft-book">
      <div className="ft-book-inner ft-book-cta">
        <Reveal>
          <h2 className="ft-heading ft-heading--white" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingFt}</h2>
          <p className="ft-sub ft-sub--white" data-edit="copy.bookBody" data-edit-type="text">
            {data.copy?.bookBody ?? s.bookBodyFt}
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="ft-book-cta-actions">
            {data.bookingUrl ? (
              <a
                href={data.bookingUrl}
                className="ft-btn ft-btn--primary ft-btn--lg"
                data-edit="labels.bookCta" data-edit-type="text"
              >
                {bookLabel}
              </a>
            ) : (
              <button
                type="button"
                className="ft-btn ft-btn--primary ft-btn--lg"
                title="Available once your site is published"
                data-edit="labels.bookCta" data-edit-type="text"
              >
                {bookLabel}
              </button>
            )}
            {data.enrollUrl && (
              <a href={data.enrollUrl} className="ft-btn ft-btn--outline ft-btn--lg" data-edit="copy.enrollCta" data-edit-type="text">
                {data.copy?.enrollCta ?? s.enrollLabel}
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── CONTACT / FOOTER ──────────────────────────────────────────────────────────
function Contact({ data }: { data: TemplateData }) {
  const s = ftStrings(data.locale);
  return (
    <footer id={SECTION_IDS.contact} className="ft-contact">
      <div className="ft-contact-grid">
        <div>
          <Reveal>
            <h2 className="ft-contact-name">{data.business.name}</h2>
            <p className="ft-contact-tagline">{data.business.tagline}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="ft-contact-list">
              <a href={`tel:${data.contact.phone}`} className="ft-contact-item" aria-label={s.callCta}>
                <DynamicIcon name={data.icons?.phone ?? 'Phone'} size={14} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /> {data.contact.phone}
              </a>
              <a href={`mailto:${data.contact.email}`} className="ft-contact-item" aria-label={s.emailUs}>
                <DynamicIcon name={data.icons?.email ?? 'Mail'} size={14} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /> {data.contact.email}
              </a>
              <span className="ft-contact-item">
                <DynamicIcon name={data.icons?.address ?? 'MapPin'} size={14} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /> {data.contact.address}
              </span>
            </div>
          </Reveal>
          {(data.contact.socials ?? []).length > 0 && (
            <Reveal delay={0.2}>
              <div className="ft-social-row">
                {(data.contact.socials ?? []).map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="ft-social-btn"
                    aria-label={s.platform}
                    data-edit-item={`contact.socials.${i}`}
                  >
                    <SocialIcon platform={s.platform} size={18} />
                  </a>
                ))}
              </div>
            </Reveal>
          )}
        </div>

        <div>
          <Reveal delay={0.05}>
            <h3 className="ft-hours-heading" data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabelFt}</h3>
            <table className="ft-hours-table" aria-label={s.hoursLabel}>
              <tbody>
                {data.hours.map(h => (
                  <tr key={h.day} className={h.closed ? 'ft-hours-closed' : ''}>
                    <td>{h.day}</td>
                    <td>{h.closed ? s.closedLabel : `${h.open} – ${h.close}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>
      </div>

      <div className="ft-footer-bar">
        © {new Date().getFullYear()} {data.business.name}. <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerRights}</span>
      </div>
    </footer>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function FullThrottle({ data = sampleData }: { data?: TemplateData }) {
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const active = useScrollSpy(Object.values(SECTION_IDS));

  useTemplateFonts([
    'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Space+Mono:wght@400;700&display=swap',
  ]);

  return (
    <div
      className="tmpl-full-throttle"
      dir={data.dir}
      style={data.theme as CSSProperties}
      data-edit="theme.bg"
      data-edit-type="background"
    >
      <Nav data={data} active={active} />
      <Hero data={data} />
      <Stats data={data} />
      <Packages data={data} selectedId={selectedPkg} onSelect={setSelectedPkg} />
      <About data={data} />
      <Areas data={data} />
      {data.reviews.length > 0 && <Reviews data={data} />}
      <Gallery data={data} />
      <FAQ data={data} />
      <Book data={data} />
      <Contact data={data} />
    </div>
  );
}

import { useState, useRef, type CSSProperties } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Star, ChevronDown, Check,
  Clock, Award, Car,
} from 'lucide-react';
import type { TemplateData } from '../types';
import { fmt } from '../strings';
import { orStrings, type OrStrings } from './strings';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import {
  SECTION_IDS, scrollToSection, useScrollSpy,
  useTemplateFonts, Reveal, useCountUp, usePrefersReducedMotion, useIsEditing,
} from '../shared';
import './open-road.css';

// ── Road Divider ─────────────────────────────────────────────────────────────
function RoadDivider() {
  return (
    <div className="or-road-divider" aria-hidden="true">
      {[0,1,2].map(i => <span key={i} className="or-road-dash" />)}
      <Car size={18} className="or-road-car" />
      {[3,4,5].map(i => <span key={i} className="or-road-dash" />)}
    </div>
  );
}

// ── NAV ──────────────────────────────────────────────────────────────────────
function Nav({ data, active }: { data: TemplateData; active: string }) {
  const [open, setOpen] = useState(false);
  const s = orStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCtaNav;
  const links = [
    { label: s.navPackages, id: SECTION_IDS.packages },
    { label: s.navAbout,    id: SECTION_IDS.about    },
    { label: s.navAreas,    id: SECTION_IDS.areas    },
    ...(data.reviews.length > 0 ? [{ label: s.navReviews, id: SECTION_IDS.reviews }] : []),
    { label: s.navFaq,      id: SECTION_IDS.faq      },
  ];
  return (
    <nav className="or-nav" role="navigation" aria-label={s.mainNavAria}>
      <div className="or-nav-inner">
        <button className="or-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label={s.backToTop} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={34} bg="#D2691E" fg="#F4E9D8" radius="34%" />
          </span>
          <span data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <ul className="or-nav-links" role="list">
          {links.map(({ label, id }) => (
            <li key={id}>
              <button
                className={`or-nav-link${active === id ? ' or-nav-link--active' : ''}`}
                onClick={() => scrollToSection(id)}
                data-edit={`copy.nav_${id}`} data-edit-type="text"
              >{data.copy?.[`nav_${id}`] ?? label}</button>
            </li>
          ))}
        </ul>
        {data.accountUrl && (
          <a href={data.accountUrl} className="or-nav-link">{data.copy?.nav_account ?? s.navAccount}</a>
        )}
        <button className="or-btn or-btn-primary" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
          {bookLabel}
        </button>
        <button
          className="or-hamburger"
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
            className="or-nav-mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
          >
            {links.map(({ label, id }) => (
              <button key={id} className="or-nav-mobile-link"
                onClick={() => { scrollToSection(id); setOpen(false); }}>
                {data.copy?.[`nav_${id}`] ?? label}
              </button>
            ))}
            {data.accountUrl && (
              <a href={data.accountUrl} className="or-nav-mobile-link">{data.copy?.nav_account ?? s.navAccount}</a>
            )}
            <button className="or-btn or-btn-primary" style={{ marginTop: '0.75rem' }}
              onClick={() => { scrollToSection(SECTION_IDS.book); setOpen(false); }}>
              {bookLabel}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ── HERO ─────────────────────────────────────────────────────────────────────
function Hero({ data }: { data: TemplateData }) {
  const reduced = usePrefersReducedMotion();
  const s = orStrings(data.locale);
  return (
    <section id={SECTION_IDS.hero} className="or-hero">
      <motion.div
        className="or-sunburst"
        aria-hidden="true"
        initial={reduced ? false : { y: 90, scale: 0.65, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      />
      <div className="or-hero-inner">
        <div>
          <Reveal delay={0.05}>
            <span className="or-eyebrow" data-edit="hero.eyebrow" data-edit-type="text">{data.hero.eyebrow}</span>
          </Reveal>
          <Reveal delay={0.18} y={34}>
            <h1 className="or-hero-title" data-edit="hero.headline" data-edit-type="text">{data.hero.headline}</h1>
          </Reveal>
          <Reveal delay={0.32}>
            <p className="or-hero-sub" data-edit="hero.sub" data-edit-type="text">{data.hero.sub}</p>
          </Reveal>
          <Reveal delay={0.46}>
            <div className="flex flex-wrap gap-4" style={{ marginTop: '2rem' }}>
              <button className="or-btn or-btn-primary or-btn-lg"
                data-edit="hero.ctaPrimary" data-edit-type="text"
                onClick={() => scrollToSection(SECTION_IDS.book)}>
                {data.hero.ctaPrimary}
              </button>
              <button className="or-btn or-btn-ghost or-btn-lg"
                data-edit="hero.ctaSecondary" data-edit-type="text"
                onClick={() => scrollToSection(SECTION_IDS.packages)}>
                {data.hero.ctaSecondary}
              </button>
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.28} x={28} y={0}>
          <div className="or-hero-img-frame">
            <img src={data.hero.image} alt={s.heroImageAlt} className="or-hero-img" data-edit="hero.image" data-edit-type="image" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── STATS ─────────────────────────────────────────────────────────────────────
function StatBadge({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const raw = useCountUp(stat.value, inView, 1350);
  const isDecimal = !Number.isInteger(stat.value);
  const display = isDecimal ? raw.toFixed(1) : Math.round(raw).toString();
  return (
    <motion.div
      ref={ref}
      className="or-badge"
      data-edit-item={`stats.${index}`}
      whileHover={{ rotate: [0, -4, 4, -2, 0] }}
      transition={{ duration: 0.55 }}
    >
      <div className="or-badge-number" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{display}{stat.suffix}</div>
      <div className="or-badge-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</div>
    </motion.div>
  );
}

function Stats({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.stats} className="or-section-inner">
      <div className="or-stats-grid">
        {data.stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.1}>
            <StatBadge stat={stat} index={i} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ── PACKAGES ─────────────────────────────────────────────────────────────────
function Packages({
  data, selectedId, onSelect,
}: { data: TemplateData; selectedId: string | null; onSelect: (id: string) => void }) {
  const s = orStrings(data.locale);
  return (
    <section id={SECTION_IDS.packages} className="or-bg-orange">
      <div className="or-section-inner">
        <Reveal>
          <h2 className="or-section-title or-title-cream" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingOr}</h2>
          <p className="or-section-sub or-text-cream-muted" data-edit="copy.packagesSub" data-edit-type="text">
            {data.copy?.packagesSub ?? s.packagesSubOr}
          </p>
        </Reveal>
        <div className="or-packages-grid">
          {data.packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.1}>
              <motion.div
                className={`or-package-card${pkg.popular ? ' or-package-card--popular' : ''}${selectedId === pkg.id ? ' or-package-card--selected' : ''}`}
                data-edit-item={`packages.${i}`}
                whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(58,42,30,0.18)' }}
                transition={{ duration: 0.28 }}
              >
                {pkg.badge && <span className="or-package-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge}</span>}
                <h3 className="or-package-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</h3>
                <div className="or-package-price">
                  <span className="or-package-amount" data-edit={`packages.${i}.price`} data-edit-type="text">₪{pkg.price}</span>
                  {pkg.unit && <span className="or-package-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                </div>
                {pkg.duration && (
                  <p className="or-package-detail">
                    <Clock size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                    {pkg.lessons ? `${pkg.lessons} × ` : ''}{pkg.duration}{(pkg.lessons ?? 1) !== 1 ? s.minLessonMany : s.minLessonOne}
                  </p>
                )}
                <ul className="or-package-features">
                  {pkg.features.map((f, j) => (
                    <li key={f} className="or-package-feature" data-edit={`packages.${i}.features.${j}`} data-edit-type="text">
                      <Check size={13} className="or-check-icon" />{f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`or-btn or-btn-primary${selectedId === pkg.id ? ' or-btn-selected' : ''}`}
                  style={{ width: '100%', marginTop: 'auto' }}
                  data-edit="labels.packageCta" data-edit-type="text"
                  onClick={() => { onSelect(pkg.id); scrollToSection(SECTION_IDS.book); }}
                  aria-pressed={selectedId === pkg.id}
                >
                  {selectedId === pkg.id
                    ? s.selectedLabel
                    : pkg.popular
                      ? (data.labels?.packageCtaPopular ?? data.labels?.packageCta ?? s.packageCtaOr)
                      : (data.labels?.packageCta ?? s.packageCtaOr)}
                </button>
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
  const s = orStrings(data.locale);
  return (
    <section id={SECTION_IDS.about}>
      <div className="or-section-inner">
        <div className="or-about-grid">
          <Reveal x={-28} y={0}>
            <div className="or-about-img-col">
              <div className="or-about-img-frame">
                <img src={data.about.image} alt={s.aboutImageAlt} className="or-about-img" data-edit="about.image" data-edit-type="image" />
              </div>
              <div className="or-instructor-card">
                <img src={data.instructor.photo} alt={data.instructor.name} className="or-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
                <div className="or-instructor-info">
                  <strong data-edit="instructor.name" data-edit-type="text">{data.instructor.name}</strong>
                  <span data-edit="instructor.title" data-edit-type="text">{data.instructor.title}</span>
                </div>
              </div>
            </div>
          </Reveal>
          <div style={{ paddingTop: '0.5rem' }}>
            <Reveal>
              <h2 className="or-section-title" data-edit="about.heading" data-edit-type="text">{data.about.heading}</h2>
            </Reveal>
            {data.about.body.map((para, i) => (
              <Reveal key={i} delay={i * 0.1 + 0.1}>
                <p className="or-body-text" data-edit={`about.body.${i}`} data-edit-type="text">{para}</p>
              </Reveal>
            ))}
            <Reveal delay={0.25}>
              <ul className="or-checklist">
                {data.about.checklist.map((item, i) => (
                  <li key={i} className="or-checklist-item" data-edit-item={`about.checklist.${i}`}>
                    <Check size={15} className="or-check-icon" /><span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.35}>
              <div className="or-credentials">
                {data.instructor.credentials.map((c, i) => (
                  <span key={i} className="or-credential-chip" data-edit-item={`instructor.credentials.${i}`}>
                    <Award size={11} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} /><span data-edit={`instructor.credentials.${i}`} data-edit-type="text">{c}</span>
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── AREAS ─────────────────────────────────────────────────────────────────────
function Areas({ data }: { data: TemplateData }) {
  const s = orStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="or-bg-teal">
      <div className="or-section-inner">
        <Reveal>
          <h2 className="or-section-title or-title-cream" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingOr}</h2>
          <p className="or-section-sub or-text-cream-muted" data-edit="copy.areasSub" data-edit-type="text">
            {data.copy?.areasSub ?? s.areasSubOr}
          </p>
        </Reveal>
        <div className="or-areas-grid">
          {data.areas.map((area, i) => (
            <Reveal key={area.name} delay={i * 0.06}>
              <div className="or-plate" data-edit-item={`areas.${i}`}>
                <span data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
                {area.note && <span className="or-plate-note"> · <span data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span></span>}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── REVIEWS ───────────────────────────────────────────────────────────────────
function StarRow({ rating, s }: { rating: number; s: OrStrings }) {
  return (
    <div className="or-stars" aria-label={fmt(s.starsAria, { n: rating })}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={15} className={i < rating ? 'or-star-filled' : 'or-star-empty'} />
      ))}
    </div>
  );
}

function Reviews({ data }: { data: TemplateData }) {
  const s = orStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews}>
      <div className="or-section-inner">
        <Reveal>
          <h2 className="or-section-title" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingOr}</h2>
        </Reveal>
        <div className="or-reviews-grid">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.1}>
              <motion.div
                className="or-review-card"
                data-edit-item={`reviews.${i}`}
                style={{ rotate: i % 2 === 0 ? -1.5 : 1.2 }}
                whileHover={{ rotate: 0, scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <StarRow rating={r.rating} s={s} />
                <p className="or-review-text">"<span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span>"</p>
                <div className="or-review-author">
                  {r.avatar && (
                    <img src={r.avatar} alt={r.name} className="or-review-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />
                  )}
                  <div>
                    <strong className="or-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</strong>
                    {r.meta && <span className="or-review-meta" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</span>}
                  </div>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── GALLERY ───────────────────────────────────────────────────────────────────
function Gallery({ data }: { data: TemplateData }) {
  const s = orStrings(data.locale);
  return (
    <section id="gallery" className="or-section-inner">
      <Reveal>
        <h2 className="or-section-title" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingOr}</h2>
        <p className="or-section-sub" data-edit="copy.gallerySub" data-edit-type="text">{data.copy?.gallerySub ?? s.gallerySubOr}</p>
      </Reveal>
      <div className="or-gallery-grid">
        {data.gallery.map((src, i) => (
          <Reveal key={i} delay={i * 0.06}>
            <div className="or-gallery-frame" data-edit-item={`gallery.${i}`} style={{ rotate: i % 3 === 0 ? '-1.5deg' : i % 3 === 1 ? '1.2deg' : '-0.6deg' }}>
              <img src={src} alt="" className="or-gallery-img" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
function FaqItem({ faq, index, open, toggle }: { faq: TemplateData['faqs'][number]; index: number; open: boolean; toggle: () => void }) {
  return (
    <div className={`or-faq-item${open ? ' or-faq-item--open' : ''}`} data-edit-item={`faqs.${index}`}>
      <button className="or-faq-q" onClick={toggle} aria-expanded={open}>
        <span data-edit={`faqs.${index}.q`} data-edit-type="text">{faq.q}</span>
        <motion.span
          className="or-faq-chevron"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.28 }}
        >
          <ChevronDown size={20} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="or-faq-a"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: 'easeInOut' }}
          >
            <p data-edit={`faqs.${index}.a`} data-edit-type="text">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FAQ({ data }: { data: TemplateData }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const editing = useIsEditing();
  const s = orStrings(data.locale);
  return (
    <section id={SECTION_IDS.faq} className="or-bg-mustard">
      <div className="or-section-inner or-section-inner--narrow">
        <Reveal>
          <h2 className="or-section-title" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingOr}</h2>
        </Reveal>
        <div className="or-faq-list">
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
  const s = orStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="or-bg-teal">
      <div className="or-section-inner or-section-inner--narrow" style={{ textAlign: 'center' }}>
        <Reveal>
          <h2 className="or-section-title or-title-cream" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingOr}</h2>
          <p className="or-section-sub or-text-cream-muted" style={{ marginLeft: 'auto', marginRight: 'auto' }} data-edit="copy.bookBody" data-edit-type="text">
            {data.copy?.bookBody ?? s.bookBodyOr}
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="flex flex-wrap gap-4" style={{ justifyContent: 'center' }}>
            {data.bookingUrl ? (
              <a
                href={data.bookingUrl}
                className="or-btn or-btn-primary or-btn-lg"
                data-edit="labels.bookCta"
                data-edit-type="text"
              >
                {bookLabel}
              </a>
            ) : (
              <button
                type="button"
                className="or-btn or-btn-primary or-btn-lg"
                title={s.bookUnpublishedTitle}
                data-edit="labels.bookCta"
                data-edit-type="text"
              >
                {bookLabel}
              </button>
            )}
            {data.enrollUrl && (
              <a href={data.enrollUrl} className="or-btn or-btn-ghost-cream or-btn-lg" data-edit="copy.enrollCta" data-edit-type="text">
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
  const s = orStrings(data.locale);
  return (
    <footer id={SECTION_IDS.contact} className="or-bg-brown" style={{ paddingBottom: '7rem' }}>
      <div className="or-section-inner or-contact">
        <div className="or-contact-grid">
          <div>
            <Reveal>
              <h2 className="or-section-title" data-edit="business.name" data-edit-type="text">{data.business.name}</h2>
              <p className="or-body-text or-text-muted" style={{ color: 'rgba(244,233,216,0.55)', marginTop: '0.35rem' }} data-edit="business.tagline" data-edit-type="text">
                {data.business.tagline}
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="or-contact-list">
                <a href={`tel:${data.contact.phone}`} className="or-contact-item" aria-label={s.callCta}>
                  <DynamicIcon name={data.icons?.phone ?? 'Phone'} size={15} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /> <span data-edit="contact.phone" data-edit-type="text">{data.contact.phone}</span>
                </a>
                <a href={`mailto:${data.contact.email}`} className="or-contact-item" aria-label={s.emailUs}>
                  <DynamicIcon name={data.icons?.email ?? 'Mail'} size={15} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /> <span data-edit="contact.email" data-edit-type="text">{data.contact.email}</span>
                </a>
                <span className="or-contact-item">
                  <DynamicIcon name={data.icons?.address ?? 'MapPin'} size={15} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /> <span data-edit="contact.address" data-edit-type="text">{data.contact.address}</span>
                </span>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="or-social-row">
                {(data.contact.socials ?? []).map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    className="or-social-btn"
                    aria-label={s.platform}
                    target="_blank"
                    rel="noreferrer"
                    data-edit-item={`contact.socials.${i}`}
                  >
                    <SocialIcon platform={s.platform} size={17} />
                  </a>
                ))}
              </div>
            </Reveal>
          </div>
          <div>
            <Reveal>
              <h3 className="or-hours-heading" data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursHeadingOr}</h3>
            </Reveal>
            <Reveal delay={0.1}>
              <table className="or-hours-table" aria-label={s.hoursLabel}>
                <tbody>
                  {data.hours.map(h => (
                    <tr key={h.day} className={h.closed ? 'or-hours-closed' : ''}>
                      <td className="or-hours-day">{h.day}</td>
                      <td>{h.closed ? s.closedLabel : `${h.open} – ${h.close}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          </div>
        </div>
        <div className="or-footer-bar">
          © {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span>. <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.allRightsReserved}</span>
        </div>
      </div>
    </footer>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function OpenRoad({ data = sampleData }: { data?: TemplateData }) {
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const active = useScrollSpy(Object.values(SECTION_IDS));

  useTemplateFonts([
    'https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Merriweather:wght@300;400;700;900&display=swap',
  ]);

  return (
    <div
      className="tmpl-open-road"
      dir={data.dir}
      style={data.theme as CSSProperties | undefined}
      data-edit="theme.bg"
      data-edit-type="background"
    >
      <Nav data={data} active={active} />
      <Hero data={data} />
      <RoadDivider />
      <Stats data={data} />
      <RoadDivider />
      <Packages data={data} selectedId={selectedPkg} onSelect={setSelectedPkg} />
      <RoadDivider />
      <About data={data} />
      <RoadDivider />
      <Areas data={data} />
      {data.reviews.length > 0 && (
        <>
          <RoadDivider />
          <Reviews data={data} />
        </>
      )}
      {data.gallery.length > 0 && (
        <>
          <RoadDivider />
          <Gallery data={data} />
        </>
      )}
      <RoadDivider />
      <FAQ data={data} />
      <RoadDivider />
      <Book data={data} />
      <Contact data={data} />
    </div>
  );
}

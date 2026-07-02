/**
 * Grid & Ink — Swiss / International editorial template.
 * Archivo headlines · Inter body · JetBrains Mono labels/numbers.
 * Palette: --paper #FAFAF7 / --ink #111 / --red #E4002B (single accent) / --grey / --line.
 * No rounded cards. No drop-shadows. Hairline rules. Left-aligned grid.
 */

import { useState, useRef } from 'react';
import type { CSSProperties } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ChevronDown, Check, Star, Menu, X, ArrowRight,
} from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, useCountUp, usePrefersReducedMotion,
} from '../shared';
import './grid-ink.css';

// ── Primitives ───────────────────────────────────────────────────────────────

function Stars({ n }: { n: number }) {
  return (
    <span className="gi-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={13} fill={i < n ? 'var(--red)' : 'none'} color={i < n ? 'var(--red)' : 'var(--grey)'} />
      ))}
    </span>
  );
}

function SectionLabel({ n, label, editKey }: { n: string; label: string; editKey?: string }) {
  return (
    <p className="gi-section-label">
      <span className="gi-section-n">{n} —</span>{' '}
      {editKey ? (
        <span data-edit={`copy.${editKey}`} data-edit-type="text">{label}</span>
      ) : (
        label
      )}
    </p>
  );
}

/** Word-by-word clip mask reveal — signature editorial motion. */
function ClipReveal({ text, className }: { text: string; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const words = text.split(' ');
  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} className="gi-clip-word">
          {reduced ? (
            word
          ) : (
            <motion.span
              initial={{ y: '110%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.8, delay: i * 0.055, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'inline-block' }}
            >
              {word}
            </motion.span>
          )}
        </span>
      ))}
    </span>
  );
}

// ── Nav ──────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { id: SECTION_IDS.packages, label: 'Packages' },
  { id: SECTION_IDS.about, label: 'About' },
  { id: SECTION_IDS.areas, label: 'Areas' },
  { id: SECTION_IDS.reviews, label: 'Reviews' },
  { id: SECTION_IDS.faq, label: 'FAQ' },
];

function GINav({ data, activeSection }: { data: TemplateData; activeSection: string }) {
  const [open, setOpen] = useState(false);
  const navLinks = NAV_LINKS.filter(
    ({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0,
  );
  const bookLabel = data.labels?.bookCta ?? 'Book now';
  return (
    <nav className="gi-nav" role="navigation" aria-label="Main navigation">
      <div className="gi-nav-inner">
        <button className="gi-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label="Go to top" style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={30} bg="#111111" fg="#FAFAF7" radius={6} />
          </span>
          <span data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <div className="gi-nav-links" role="list">
          {navLinks.map(({ id, label }) => (
            <button
              key={id}
              role="listitem"
              className={`gi-nav-link${activeSection === id ? ' gi-nav-link--active' : ''}`}
              onClick={() => scrollToSection(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="gi-nav-end">
          <button className="gi-btn-primary" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
            {bookLabel}
          </button>
          <button
            className="gi-menu-btn"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            className="gi-nav-mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {navLinks.map(({ id, label }) => (
              <button
                key={id}
                className={`gi-nav-mobile-link${activeSection === id ? ' gi-nav-link--active' : ''}`}
                onClick={() => { scrollToSection(id); setOpen(false); }}
              >
                {label}
              </button>
            ))}
            <button
              className="gi-btn-primary gi-btn-block"
              data-edit="labels.bookCta" data-edit-type="text"
              onClick={() => { scrollToSection(SECTION_IDS.book); setOpen(false); }}
            >
              {bookLabel}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function GIHero({ data }: { data: TemplateData }) {
  const { hero } = data;
  return (
    <section id={SECTION_IDS.hero} className="gi-hero">
      <div className="gi-container gi-hero-grid">
        <div className="gi-hero-copy">
          <Reveal as="p" className="gi-eyebrow"><span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span></Reveal>
          <h1 className="gi-h1" data-edit="hero.headline" data-edit-type="text">
            <ClipReveal text={hero.headline} />
          </h1>
          <Reveal as="p" className="gi-hero-sub" delay={0.2}><span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span></Reveal>
          <Reveal className="gi-hero-ctas" delay={0.35}>
            <button className="gi-btn-primary gi-btn-lg" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
              {hero.ctaPrimary} <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button className="gi-btn-ghost" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>
              {hero.ctaSecondary}
            </button>
          </Reveal>
        </div>
        <div className="gi-hero-img-wrap">
          <img src={hero.image} alt="Driving lesson in progress" className="gi-hero-img" data-edit="hero.image" data-edit-type="image" />
        </div>
      </div>
    </section>
  );
}

// ── Stats ────────────────────────────────────────────────────────────────────

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value)
    ? Math.round(n).toLocaleString()
    : n.toFixed(1);
  return (
    <div ref={ref} className="gi-stat" data-edit-item={`stats.${index}`}>
      <span className="gi-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">
        {stat.prefix}{formatted}{stat.suffix}
      </span>
      <span className="gi-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function GIStats({ stats }: { stats: TemplateData['stats'] }) {
  return (
    <section id={SECTION_IDS.stats} className="gi-section gi-section--ruled">
      <div className="gi-container">
        <div className="gi-stats-grid">
          {stats.map((s, i) => <StatItem key={i} stat={s} index={i} />)}
        </div>
      </div>
    </section>
  );
}

// ── Packages ─────────────────────────────────────────────────────────────────

function GIPackages({
  packages, selectedPkg, onSelect, labels, copy,
}: {
  packages: TemplateData['packages'];
  selectedPkg: string | null;
  onSelect: (id: string) => void;
  labels?: TemplateData['labels'];
  copy?: TemplateData['copy'];
}) {
  return (
    <section id={SECTION_IDS.packages} className="gi-section">
      <div className="gi-container">
        <Reveal><SectionLabel n="01" label={copy?.packagesEyebrow ?? 'Packages'} editKey="packagesEyebrow" /></Reveal>
        <h2 className="gi-h2" data-edit="copy.packagesHeading" data-edit-type="text">{copy?.packagesHeading ?? 'Pick your lesson plan.'}</h2>
        <div className="gi-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.08}>
              <div
                className={`gi-pkg-card${pkg.popular ? ' gi-pkg-card--popular' : ''}${selectedPkg === pkg.id ? ' gi-pkg-card--selected' : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={selectedPkg === pkg.id}
                onClick={() => onSelect(pkg.id)}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(pkg.id)}
                data-edit-item={`packages.${i}`}
              >
                <div className="gi-pkg-header">
                  <div>
                    {pkg.badge && <span className="gi-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge}</span>}
                    <p className="gi-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                  </div>
                  <p className="gi-pkg-price">
                    <span className="gi-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">£{pkg.price}</span>
                    {pkg.unit && <span className="gi-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                  </p>
                </div>
                <ul className="gi-pkg-features" aria-label={`${pkg.name} features`}>
                  {pkg.features.map((f, fi) => (
                    <li key={fi} className="gi-pkg-feature">
                      <Check size={13} className="gi-check" aria-hidden="true" />
                      <span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`gi-pkg-cta${pkg.popular ? ' gi-pkg-cta--pop' : ''}`}
                  data-edit="labels.packageCta"
                  data-edit-type="text"
                  onClick={(e) => { e.stopPropagation(); onSelect(pkg.id); }}
                  tabIndex={-1}
                >
                  {pkg.popular
                    ? (labels?.packageCtaPopular ?? labels?.packageCta ?? 'Book this plan')
                    : (labels?.packageCta ?? 'Book this plan')}{' '}
                  <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── About ────────────────────────────────────────────────────────────────────

function GIAbout({ about, instructor, copy }: { about: TemplateData['about']; instructor: TemplateData['instructor']; copy?: TemplateData['copy'] }) {
  return (
    <section id={SECTION_IDS.about} className="gi-section gi-section--dark">
      <div className="gi-container gi-about-grid">
        <div className="gi-about-img-col">
          <Reveal>
            <img src={about.image} alt="Instructor with learner driver in car" className="gi-about-img" data-edit="about.image" data-edit-type="image" />
          </Reveal>
          <Reveal delay={0.12} className="gi-instructor-card">
            <img src={instructor.photo} alt={instructor.name} className="gi-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div>
              <p className="gi-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p>
              <p className="gi-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p>
              <ul className="gi-credentials" aria-label="Credentials">
                {instructor.credentials.map((c, i) => (
                  <li key={i} className="gi-credential" data-edit-item={`instructor.credentials.${i}`}>
                    <Check size={11} aria-hidden="true" /><span data-edit={`instructor.credentials.${i}`} data-edit-type="text">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
        <div className="gi-about-copy">
          <Reveal><SectionLabel n="02" label={copy?.aboutEyebrow ?? 'About'} editKey="aboutEyebrow" /></Reveal>
          <h2 className="gi-h2 gi-h2--light" data-edit="about.heading" data-edit-type="text">
            <ClipReveal text={about.heading} />
          </h2>
          {about.body.map((p, i) => (
            <Reveal key={i} delay={0.1 + i * 0.06} as="p" className="gi-body gi-body--light">
              <span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span>
            </Reveal>
          ))}
          <Reveal delay={0.22}>
            <ul className="gi-checklist" aria-label="Key benefits">
              {about.checklist.map((item, i) => (
                <li key={i} className="gi-checklist-item" data-edit-item={`about.checklist.${i}`}>
                  <Check size={14} aria-hidden="true" />
                  <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Areas ────────────────────────────────────────────────────────────────────

function GIAreas({ areas, copy }: { areas: TemplateData['areas']; copy?: TemplateData['copy'] }) {
  return (
    <section id={SECTION_IDS.areas} className="gi-section">
      <div className="gi-container">
        <Reveal><SectionLabel n="03" label={copy?.areasEyebrow ?? 'Areas covered'} editKey="areasEyebrow" /></Reveal>
        <h2 className="gi-h2" data-edit="copy.areasHeading" data-edit-type="text">{copy?.areasHeading ?? 'We come to you.'}</h2>
        <Reveal delay={0.1}>
          <ul className="gi-areas-grid" aria-label="Service areas">
            {areas.map((area, i) => (
              <li key={i} className="gi-area-item" data-edit-item={`areas.${i}`}>
                <span className="gi-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
                {area.note && <span className="gi-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

// ── Reviews ──────────────────────────────────────────────────────────────────

function GIReviews({ reviews, copy }: { reviews: TemplateData['reviews']; copy?: TemplateData['copy'] }) {
  return (
    <section id={SECTION_IDS.reviews} className="gi-section gi-section--ruled">
      <div className="gi-container">
        <Reveal><SectionLabel n="04" label={copy?.reviewsEyebrow ?? 'Reviews'} editKey="reviewsEyebrow" /></Reveal>
        <h2 className="gi-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{copy?.reviewsHeading ?? 'What learners say.'}</h2>
        <div className="gi-reviews-grid">
          {reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.1}>
              <article className="gi-review-card" data-edit-item={`reviews.${i}`}>
                <Stars n={r.rating} />
                <blockquote className="gi-review-text">"<span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span>"</blockquote>
                <div className="gi-review-meta">
                  {r.avatar && <img src={r.avatar} alt={r.name} className="gi-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                  <div>
                    <p className="gi-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                    {r.meta && <p className="gi-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery ──────────────────────────────────────────────────────────────────

function GIGallery({ gallery, copy }: { gallery: TemplateData['gallery']; copy?: TemplateData['copy'] }) {
  return (
    <section className="gi-section gi-gallery">
      <div className="gi-container">
        <Reveal><SectionLabel n="" label={copy?.galleryEyebrow ?? 'Gallery'} editKey="galleryEyebrow" /></Reveal>
        <h2 className="gi-h2" data-edit="copy.galleryHeading" data-edit-type="text">{copy?.galleryHeading ?? 'From the driving seat.'}</h2>
        <div className="gi-gallery-grid">
          {gallery.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06}>
              <div className="gi-gallery-cell" data-edit-item={`gallery.${i}`}>
                <img src={src} alt="" className="gi-gallery-img" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ──────────────────────────────────────────────────────────────────────

function FaqItem({ faq, index }: { faq: TemplateData['faqs'][number]; index: number }) {
  const [open, setOpen] = useState(false);
  const btnId = `gi-faq-q-${index}`;
  const panelId = `gi-faq-a-${index}`;
  return (
    <div className="gi-faq-item" data-edit-item={`faqs.${index}`}>
      <button
        className="gi-faq-q"
        id={btnId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        <span className="gi-mono gi-faq-n">{String(index + 1).padStart(2, '0')}</span>
        <span className="gi-faq-question" data-edit={`faqs.${index}.q`} data-edit-type="text">{faq.q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="gi-faq-chevron"
          aria-hidden="true"
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={btnId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p className="gi-faq-a" data-edit={`faqs.${index}.a`} data-edit-type="text">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GIFaq({ faqs, copy }: { faqs: TemplateData['faqs']; copy?: TemplateData['copy'] }) {
  return (
    <section id={SECTION_IDS.faq} className="gi-section">
      <div className="gi-container">
        <Reveal><SectionLabel n="05" label={copy?.faqEyebrow ?? 'FAQ'} editKey="faqEyebrow" /></Reveal>
        <h2 className="gi-h2" data-edit="copy.faqHeading" data-edit-type="text">{copy?.faqHeading ?? 'Common questions.'}</h2>
        <div className="gi-faq-list">
          {faqs.map((faq, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <FaqItem faq={faq} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Booking ──────────────────────────────────────────────────────────────────

function GIBook({ data }: { data: TemplateData }) {
  const bookLabel = data.labels?.bookCta ?? 'Book a lesson';
  return (
    <section id={SECTION_IDS.book} className="gi-section gi-section--book">
      <div className="gi-container">
        <Reveal><SectionLabel n="06" label={data.copy?.bookEyebrow ?? 'Book a lesson'} editKey="bookEyebrow" /></Reveal>
        <h2 className="gi-h2" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? 'Reserve your slot.'}</h2>
        <Reveal as="p" className="gi-body gi-book-line" delay={0.05}>
          <span data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? "Ready to get on the road? Pick a time that works for you and we'll take it from there."}</span>
        </Reveal>
        <Reveal className="gi-book-cta-row" delay={0.12}>
          {data.bookingUrl ? (
            <a
              href={data.bookingUrl}
              className="gi-btn-primary gi-btn-lg"
              data-edit="labels.bookCta"
              data-edit-type="text"
            >
              {bookLabel} <ArrowRight size={16} aria-hidden="true" />
            </a>
          ) : (
            <button
              type="button"
              className="gi-btn-primary gi-btn-lg"
              title="Available once your site is published"
              data-edit="labels.bookCta"
              data-edit-type="text"
            >
              {bookLabel} <ArrowRight size={16} aria-hidden="true" />
            </button>
          )}
          {data.enrollUrl && (
            <a href={data.enrollUrl} className="gi-btn-ghost" data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? 'Enroll'}</a>
          )}
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact / Footer ─────────────────────────────────────────────────────────

function GIContact({ data }: { data: TemplateData }) {
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="gi-footer">
      <div className="gi-container">
        <div className="gi-contact-grid">
          <div className="gi-contact-col">
            <Reveal><SectionLabel n="07" label={data.copy?.contactEyebrow ?? 'Contact'} editKey="contactEyebrow" /></Reveal>
            <Reveal delay={0.06} className="gi-contact-info">
              <a href={`tel:${contact.phone}`} className="gi-contact-link">
                <DynamicIcon name={data.icons?.phone ?? 'Phone'} size={15} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span>
              </a>
              <a href={`mailto:${contact.email}`} className="gi-contact-link">
                <DynamicIcon name={data.icons?.email ?? 'Mail'} size={15} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span>
              </a>
              <span className="gi-contact-link gi-contact-address">
                <DynamicIcon name={data.icons?.address ?? 'MapPin'} size={15} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span>
              </span>
            </Reveal>
            <Reveal delay={0.12} className="gi-socials">
              {socials.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  className="gi-social-btn"
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.platform}
                  data-edit-item={`contact.socials.${i}`}
                >
                  <SocialIcon platform={s.platform} size={17} />
                </a>
              ))}
            </Reveal>
          </div>

          <div className="gi-hours-col">
            <Reveal><p className="gi-section-label"><span className="gi-section-n">— </span><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? 'Opening hours'}</span></p></Reveal>
            <Reveal delay={0.06}>
              <table className="gi-hours-table">
                <tbody>
                  {hours.map((h) => (
                    <tr key={h.day} className={h.closed ? 'gi-hours-closed' : ''}>
                      <td className="gi-hours-day">{h.day}</td>
                      <td className="gi-hours-time">
                        {h.closed ? 'Closed' : `${h.open} – ${h.close}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          </div>
        </div>

        <Reveal className="gi-footer-bottom">
          <p className="gi-footer-copy gi-mono">© {new Date().getFullYear()} {/* Built with Mumotor */}</p>
          <p className="gi-footer-copy gi-mono" data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? 'Built with Mumotor'}</p>
        </Reveal>
      </div>
    </footer>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function GridInk({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts([
    'https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  ]);

  const ids = Object.values(SECTION_IDS);
  const activeSection = useScrollSpy(ids);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);

  const handleSelectPkg = (id: string) => {
    setSelectedPkg(id);
    scrollToSection(SECTION_IDS.book);
  };

  return (
    <div
      className="tmpl-grid-ink"
      dir={data.dir}
      style={data.theme as CSSProperties}
      data-edit="theme.bg"
      data-edit-type="background"
    >
      <GINav data={data} activeSection={activeSection} />
      <main>
        <GIHero data={data} />
        <GIStats stats={data.stats} />
        <GIPackages packages={data.packages} selectedPkg={selectedPkg} onSelect={handleSelectPkg} labels={data.labels} copy={data.copy} />
        <GIAbout about={data.about} instructor={data.instructor} copy={data.copy} />
        <GIAreas areas={data.areas} copy={data.copy} />
        {data.reviews.length > 0 && <GIReviews reviews={data.reviews} copy={data.copy} />}
        {data.gallery.length > 0 && <GIGallery gallery={data.gallery} copy={data.copy} />}
        <GIFaq faqs={data.faqs} copy={data.copy} />
        <GIBook data={data} />
        <GIContact data={data} />
      </main>
    </div>
  );
}

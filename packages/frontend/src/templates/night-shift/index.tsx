/**
 * Night Shift — dark cinematic neon template.
 * Palette: deep #0A0A0F bg, cyan #22D3EE + magenta #F0398B accents.
 * Glass panels, headlight beam parallax, glow-pulse CTA.
 */
import { useState, useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ChevronDown, ChevronUp, Star,
  Menu, X, Check, Clock, Car,
} from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import {
  SECTION_IDS, scrollToSection, useScrollSpy,
  useTemplateFonts, Reveal, useCountUp, usePrefersReducedMotion,
} from '../shared';
import { fmt } from '../strings';
import { nsStrings, type NsStrings } from './strings';
import './night-shift.css';

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ n, s }: { n: number; s: NsStrings }) {
  return (
    <span className="ns-stars" aria-label={fmt(s.ariaStars, { n })}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={13} fill={i < n ? 'currentColor' : 'none'} strokeWidth={1.5} />
      ))}
    </span>
  );
}

// ── Animated stat counter ─────────────────────────────────────────────────────
function StatCard({
  label, value, suffix, prefix, index,
}: { label: string; value: number; suffix?: string; prefix?: string; index: number }) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const count = useCountUp(value, inView, 1400);
  const display = Number.isInteger(value) ? Math.round(count).toLocaleString() : count.toFixed(1);
  return (
    <div ref={ref} className="ns-stat" data-edit-item={`stats.${index}`}>
      <div className="ns-stat-value tabular-nums" data-edit={`stats.${index}.value`} data-edit-type="text">
        {prefix}<span>{display}</span>{suffix}
      </div>
      <div className="ns-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{label}</div>
    </div>
  );
}

// ── FAQ accordion item ────────────────────────────────────────────────────────
function FaqItem({
  q, a, open, onToggle, index,
}: { q: string; a: string; open: boolean; onToggle: () => void; index: number }) {
  return (
    <div className={`ns-faq-item${open ? ' ns-open' : ''}`} data-edit-item={`faqs.${index}`}>
      <button className="ns-faq-q" onClick={onToggle} aria-expanded={open}>
        <span data-edit={`faqs.${index}.q`} data-edit-type="text">{q}</span>
        <span className="ns-faq-icon" aria-hidden="true">
          {open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        </span>
      </button>
      <div className="ns-faq-body" style={{ maxHeight: open ? '400px' : '0px' }}>
        <p className="ns-faq-a" data-edit={`faqs.${index}.a`} data-edit-type="text">{a}</p>
      </div>
    </div>
  );
}

// ── Main template ─────────────────────────────────────────────────────────────
export default function NightShift({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts([
    'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap',
  ]);

  const s = nsStrings(data.locale);
  const reduced = usePrefersReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<string | null>(null);

  // Parallax hero beams
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const beamY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const beamOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const activeSection = useScrollSpy(Object.values(SECTION_IDS));

  const hasReviews = data.reviews.length > 0;
  const hasGallery = data.gallery.length > 0;
  const socials = data.contact.socials ?? [];

  const bookCta = data.labels?.bookCta ?? s.bookCta;

  const navLinks = [
    { id: SECTION_IDS.packages, label: s.navPackages },
    { id: SECTION_IDS.about, label: s.navAbout },
    { id: SECTION_IDS.areas, label: s.navAreas },
    ...(hasReviews ? [{ id: SECTION_IDS.reviews, label: s.navReviews }] : []),
    { id: SECTION_IDS.faq, label: s.navFaq },
  ];

  return (
    <div
      className="tmpl-night-shift"
      dir={data.dir}
      style={data.theme as CSSProperties}
      data-edit="theme.bg"
      data-edit-type="background"
    >

      {/* ── NAV ── */}
      <nav className="ns-nav" aria-label={s.ariaSiteNav}>
        <div className="ns-nav-inner">
          <button
            className="ns-logo"
            onClick={() => scrollToSection(SECTION_IDS.hero)}
            aria-label={fmt(s.ariaBackToTop, { name: data.business.name })}
          >
            {data.business.logoSrc
              ? <img src={data.business.logoSrc} alt="" data-edit="business.logoSrc" data-edit-type="image" style={{ width: '2.1rem', height: '2.1rem', borderRadius: 9, objectFit: 'cover' }} />
              : <span className="ns-logo-mark" data-edit="business.logoSrc" data-edit-type="image">{data.business.logoText.charAt(0)}</span>}
            <span className="ns-logo-text" data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
          </button>
          <div className="ns-nav-links" role="list" aria-label={s.ariaPageSections}>
            {navLinks.map(({ id, label }) => (
              <button
                key={id}
                role="listitem"
                className={`ns-nav-link${activeSection === id ? ' ns-active' : ''}`}
                onClick={() => { scrollToSection(id); setMobileOpen(false); }}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            className="ns-nav-cta"
            data-edit="labels.bookCta"
            data-edit-type="text"
            onClick={() => { scrollToSection(SECTION_IDS.book); setMobileOpen(false); }}
          >
            {bookCta}
          </button>
          <button
            className="ns-burger"
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? s.ariaCloseMenu : s.ariaOpenMenu}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="ns-mobile-menu" role="menu">
            {navLinks.map(({ id, label }) => (
              <button
                key={id}
                role="menuitem"
                className="ns-mobile-link"
                onClick={() => { scrollToSection(id); setMobileOpen(false); }}
              >
                {label}
              </button>
            ))}
            <button
              className="ns-nav-cta ns-mobile-cta"
              data-edit="labels.bookCta"
              data-edit-type="text"
              onClick={() => { scrollToSection(SECTION_IDS.book); setMobileOpen(false); }}
            >
              {bookCta}
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section id={SECTION_IDS.hero} className="ns-hero" ref={heroRef}>
        {/* Parallax headlight beams */}
        {!reduced && (
          <motion.div
            className="ns-beams"
            style={{ y: beamY, opacity: beamOpacity }}
            aria-hidden="true"
          >
            <div className="ns-beam ns-beam-1" />
            <div className="ns-beam ns-beam-2" />
            <div className="ns-beam ns-beam-3" />
          </motion.div>
        )}
        {/* Background image with dark scrim */}
        <div className="ns-hero-img-wrap" aria-hidden="true">
          <img src={data.hero.image} alt="" className="ns-hero-img" data-edit="hero.image" data-edit-type="image" />
          <div className="ns-hero-scrim" />
        </div>
        {/* Text content */}
        <div className="ns-hero-content">
          <Reveal>
            <p className="ns-eyebrow" data-edit="hero.eyebrow" data-edit-type="text">{data.hero.eyebrow}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="ns-headline" data-edit="hero.headline" data-edit-type="text">{data.hero.headline}</h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="ns-sub" data-edit="hero.sub" data-edit-type="text">{data.hero.sub}</p>
          </Reveal>
          <Reveal delay={0.32}>
            <div className="ns-hero-ctas">
              <button
                className="ns-btn-primary ns-glow-pulse"
                data-edit="hero.ctaPrimary"
                data-edit-type="text"
                onClick={() => scrollToSection(SECTION_IDS.book)}
              >
                {data.hero.ctaPrimary}
              </button>
              <button
                className="ns-btn-ghost"
                data-edit="hero.ctaSecondary"
                data-edit-type="text"
                onClick={() => scrollToSection(SECTION_IDS.packages)}
              >
                {data.hero.ctaSecondary} &rarr;
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── STATS ── */}
      <section id={SECTION_IDS.stats} className="ns-stats-section">
        <div className="ns-container ns-stats-grid">
          {data.stats.map((s, i) => <StatCard key={s.label} index={i} {...s} />)}
        </div>
      </section>

      {/* ── PACKAGES ── */}
      <section id={SECTION_IDS.packages} className="ns-section">
        <div className="ns-container">
          <Reveal><h2 className="ns-section-title" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingNs}</h2></Reveal>
          <Reveal delay={0.1}>
            <p className="ns-section-sub" data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubNs}</p>
          </Reveal>
          <div className="ns-packages-grid">
            {data.packages.map((pkg, i) => (
              <Reveal key={pkg.id} delay={i * 0.12}>
                <div className={`ns-pkg-card${pkg.popular ? ' ns-popular' : ''}`} data-edit-item={`packages.${i}`}>
                  {pkg.badge && <span className="ns-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge}</span>}
                  <h3 className="ns-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</h3>
                  <div className="ns-pkg-price">
                    <span className="ns-pkg-amount tabular-nums" data-edit={`packages.${i}.price`} data-edit-type="text">£{pkg.price}</span>
                    {pkg.unit && <span className="ns-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                  </div>
                  {pkg.duration && (
                    <p className="ns-pkg-meta">
                      <Clock size={12} aria-hidden="true" />
                      {' '}<span data-edit={`packages.${i}.duration`} data-edit-type="text">{pkg.duration}</span><span data-edit="copy.lessonDurationSuffix" data-edit-type="text">{data.copy?.lessonDurationSuffix ?? s.lessonDurationSuffix}</span>
                    </p>
                  )}
                  <ul className="ns-pkg-features" aria-label={s.ariaFeatures}>
                    {pkg.features.map((f, j) => (
                      <li key={f} data-edit={`packages.${i}.features.${j}`} data-edit-type="text">
                        <Check size={12} className="ns-check-icon" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="ns-btn-select"
                    data-edit="labels.packageCta"
                    data-edit-type="text"
                    onClick={() => scrollToSection(SECTION_IDS.book)}
                  >
                    {pkg.popular
                      ? (data.labels?.packageCtaPopular ?? data.labels?.packageCta ?? s.packageCtaPopular)
                      : (data.labels?.packageCta ?? s.packageCtaNs)}
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id={SECTION_IDS.about} className="ns-section ns-about-section">
        <div className="ns-container ns-about-grid">
          <div className="ns-about-copy">
            <Reveal><h2 className="ns-section-title" data-edit="about.heading" data-edit-type="text">{data.about.heading}</h2></Reveal>
            {data.about.body.map((p, i) => (
              <Reveal key={i} delay={0.1 + i * 0.1}>
                <p className="ns-body-text" data-edit={`about.body.${i}`} data-edit-type="text">{p}</p>
              </Reveal>
            ))}
            <Reveal delay={0.28}>
              <ul className="ns-checklist">
                {data.about.checklist.map((item, i) => (
                  <li key={i} data-edit-item={`about.checklist.${i}`}>
                    <Check size={13} className="ns-check-icon" aria-hidden="true" />
                    <span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.42}>
              <div className="ns-instructor-panel">
                <img
                  src={data.instructor.photo}
                  alt={`${data.instructor.name}, ${data.instructor.title}`}
                  className="ns-instr-photo"
                  data-edit="instructor.photo"
                  data-edit-type="image"
                  width={72}
                  height={72}
                />
                <div className="ns-instr-info">
                  <p className="ns-instr-name" data-edit="instructor.name" data-edit-type="text">{data.instructor.name}</p>
                  <p className="ns-instr-title" data-edit="instructor.title" data-edit-type="text">{data.instructor.title}</p>
                  <p className="ns-instr-bio" data-edit="instructor.bio" data-edit-type="text">{data.instructor.bio}</p>
                  <div className="ns-creds">
                    {data.instructor.credentials.map((c, i) => (
                      <span key={i} className="ns-cred" data-edit-item={`instructor.credentials.${i}`}>
                        <span data-edit={`instructor.credentials.${i}`} data-edit-type="text">{c}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
          <Reveal className="ns-about-img-col" delay={0.18}>
            <div className="ns-about-img-wrap">
              <img src={data.about.image} alt={s.aboutImageAlt} className="ns-about-img" data-edit="about.image" data-edit-type="image" />
              <div className="ns-about-img-scrim" aria-hidden="true" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── AREAS ── */}
      <section id={SECTION_IDS.areas} className="ns-section">
        <div className="ns-container">
          <Reveal><h2 className="ns-section-title" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingNs}</h2></Reveal>
          <Reveal delay={0.1}>
            <p className="ns-section-sub" data-edit="copy.areasSub" data-edit-type="text">{data.copy?.areasSub ?? s.areasSubNs}</p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="ns-areas-grid">
              {data.areas.map((area, i) => (
                <div key={area.name} className="ns-area-chip" data-edit-item={`areas.${i}`}>
                  <Car size={12} aria-hidden="true" />
                  <span data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
                  {area.note && <span className="ns-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      {hasReviews && (
        <section id={SECTION_IDS.reviews} className="ns-section">
          <div className="ns-container">
            <Reveal><h2 className="ns-section-title" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingNs}</h2></Reveal>
            <Reveal delay={0.1}>
              <p className="ns-section-sub" data-edit="copy.reviewsSub" data-edit-type="text">{data.copy?.reviewsSub ?? s.reviewsSubNs}</p>
            </Reveal>
            <div className="ns-reviews-grid">
              {data.reviews.map((r, i) => (
                <Reveal key={r.id} delay={i * 0.1}>
                  <div className="ns-review-card" data-edit-item={`reviews.${i}`}>
                    <Stars n={r.rating} s={s} />
                    <p className="ns-review-text">&#8220;<span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span>&#8221;</p>
                    <div className="ns-reviewer">
                      {r.avatar
                        ? <img src={r.avatar} alt="" className="ns-avatar" width={38} height={38} data-edit={`reviews.${i}.avatar`} data-edit-type="image" />
                        : <div className="ns-avatar-init" aria-hidden="true">{r.name.charAt(0)}</div>
                      }
                      <div>
                        <p className="ns-reviewer-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                        {r.meta && <p className="ns-reviewer-meta" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── GALLERY ── */}
      {hasGallery && (
        <section className="ns-section ns-gallery-section">
          <div className="ns-container">
            <Reveal><h2 className="ns-section-title" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingNs}</h2></Reveal>
            <Reveal delay={0.1}>
              <p className="ns-section-sub" data-edit="copy.gallerySub" data-edit-type="text">{data.copy?.gallerySub ?? s.gallerySubNs}</p>
            </Reveal>
            <div className="ns-gallery-grid">
              {data.gallery.map((src, i) => (
                <Reveal key={i} delay={i * 0.06}>
                  <div className="ns-gallery-item" data-edit-item={`gallery.${i}`}>
                    <img src={src} alt="" className="ns-gallery-img" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      <section id={SECTION_IDS.faq} className="ns-section">
        <div className="ns-container ns-faq-container">
          <Reveal><h2 className="ns-section-title" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingNs}</h2></Reveal>
          <div className="ns-faq-list">
            {data.faqs.map((faq, i) => (
              <Reveal key={faq.q} delay={i * 0.06}>
                <FaqItem
                  index={i}
                  q={faq.q}
                  a={faq.a}
                  open={activeFaq === faq.q}
                  onToggle={() => setActiveFaq(v => v === faq.q ? null : faq.q)}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOOK ── */}
      <section id={SECTION_IDS.book} className="ns-section ns-book-section">
        <div className="ns-container ns-book-cta-band">
          <Reveal><h2 className="ns-section-title" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingNs}</h2></Reveal>
          <Reveal delay={0.1}>
            <p className="ns-section-sub" data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodyNs}</p>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="ns-hero-ctas ns-book-actions">
              {data.bookingUrl ? (
                <>
                  <a
                    href={data.bookingUrl}
                    className="ns-btn-primary ns-glow-pulse"
                    data-edit="labels.bookCta"
                    data-edit-type="text"
                  >
                    {data.labels?.bookCta ?? s.bookCta}
                  </a>
                  {data.enrollUrl && (
                    <a href={data.enrollUrl} className="ns-btn-ghost"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span> &rarr;</a>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  title={s.publishTooltip}
                  className="ns-btn-primary ns-glow-pulse"
                  data-edit="labels.bookCta"
                  data-edit-type="text"
                >
                  {data.labels?.bookCta ?? s.bookCta}
                </button>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CONTACT / FOOTER ── */}
      <footer id={SECTION_IDS.contact} className="ns-footer">
        <div className="ns-container ns-footer-grid">
          <div>
            <Reveal><h2 className="ns-section-title" data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeadingNs}</h2></Reveal>
            <Reveal delay={0.1}>
              <ul className="ns-contact-list">
                <li>
                  <DynamicIcon name={data.icons?.phone ?? 'Phone'} size={14} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" />
                  <a href={`tel:${data.contact.phone.replace(/\s/g, '')}`}><span data-edit="contact.phone" data-edit-type="text">{data.contact.phone}</span></a>
                </li>
                <li>
                  <DynamicIcon name={data.icons?.email ?? 'Mail'} size={14} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" />
                  <a href={`mailto:${data.contact.email}`}><span data-edit="contact.email" data-edit-type="text">{data.contact.email}</span></a>
                </li>
                <li>
                  <DynamicIcon name={data.icons?.address ?? 'MapPin'} size={14} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" />
                  <span data-edit="contact.address" data-edit-type="text">{data.contact.address}</span>
                </li>
              </ul>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="ns-social">
                {socials.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank" rel="noreferrer"
                    aria-label={s.platform}
                    className="ns-social-btn"
                    data-edit-item={`contact.socials.${i}`}
                  >
                    <SocialIcon platform={s.platform} size={16} />
                  </a>
                ))}
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <div className="ns-hours-panel">
              <h3 className="ns-hours-title" data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabelNs}</h3>
              <table className="ns-hours-table">
                <tbody>
                  {data.hours.map(h => (
                    <tr key={h.day} className={h.closed ? 'ns-closed' : ''}>
                      <td>{h.day}</td>
                      <td className="tabular-nums">
                        {h.closed
                          ? <span data-edit="copy.closedLabel" data-edit-type="text">{data.copy?.closedLabel ?? s.closedLabelNs}</span>
                          : `${h.open} – ${h.close}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
        <div className="ns-footer-bottom">
          <p>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span>. <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCreditNs}</span></p>
          <p className="ns-tagline-small" data-edit="business.tagline" data-edit-type="text">{data.business.tagline}</p>
        </div>
      </footer>

    </div>
  );
}

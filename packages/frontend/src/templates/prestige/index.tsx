/**
 * Prestige Drive — luxury editorial black + gold template.
 * Playfair Display headings, Inter body. Gold hairlines, B&W photography,
 * slow fade reveals, shimmer CTA, hero + about parallax.
 */
import { useState, useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ChevronDown, ChevronUp, Star,
  Menu, X, Check, Clock, Car, Award,
} from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import {
  SECTION_IDS, scrollToSection, useScrollSpy,
  useTemplateFonts, Reveal, useCountUp, usePrefersReducedMotion, useIsEditing, reviewReplyLabel,
} from '../shared';
import { pgStrings } from './strings';
import './prestige.css';

// ── Stars ──────────────────────────────────────────────────────────────────────
function Stars({ n }: { n: number }) {
  return (
    <span className="pd-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={13} fill={i < n ? 'currentColor' : 'none'} strokeWidth={1.5} />
      ))}
    </span>
  );
}

// ── Stat counter ───────────────────────────────────────────────────────────────
function StatCard({ label, value, suffix, prefix, editIndex }: {
  label: string; value: number; suffix?: string; prefix?: string; editIndex?: number;
}) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.4 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  const count = useCountUp(value, inView, 1600);
  const display = Number.isInteger(value) ? Math.round(count).toLocaleString('en-US') : count.toFixed(1);
  return (
    <div ref={ref} className="pd-stat">
      <div className="pd-stat-value tabular-nums"
        {...(editIndex != null ? { 'data-edit': `stats.${editIndex}.value`, 'data-edit-type': 'text' } : {})}>
        {prefix && <span className="pd-stat-affix">{prefix}</span>}
        <span>{display}</span>
        {suffix && <span className="pd-stat-affix">{suffix}</span>}
      </div>
      <div className="pd-stat-rule" aria-hidden="true" />
      <div className="pd-stat-label"
        {...(editIndex != null ? { 'data-edit': `stats.${editIndex}.label`, 'data-edit-type': 'text' } : {})}>{label}</div>
    </div>
  );
}

// ── FAQ accordion item ─────────────────────────────────────────────────────────
function FaqItem({ q, a, open, onToggle, editIndex }: {
  q: string; a: string; open: boolean; onToggle: () => void; editIndex?: number;
}) {
  return (
    <div className={`pd-faq-item${open ? ' pd-open' : ''}`}
      {...(editIndex != null ? { 'data-edit-item': `faqs.${editIndex}` } : {})}>
      <button className="pd-faq-q" onClick={onToggle} aria-expanded={open}>
        <span {...(editIndex != null ? { 'data-edit': `faqs.${editIndex}.q`, 'data-edit-type': 'text' } : {})}>{q}</span>
        <span className="pd-faq-icon" aria-hidden="true">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      <div className="pd-faq-body" style={{ maxHeight: open ? '400px' : '0' }}>
        <p className="pd-faq-a" {...(editIndex != null ? { 'data-edit': `faqs.${editIndex}.a`, 'data-edit-type': 'text' } : {})}>{a}</p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function PrestigeDrive({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts([
    'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Inter:wght@300;400;500;600&display=swap',
  ]);

  const reduced = usePrefersReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const editing = useIsEditing();

  // Parallax — hero
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroImgY = useTransform(heroProgress, [0, 1], ['0%', '22%']);

  // Parallax — about image
  const aboutImgRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: aboutProgress } = useScroll({ target: aboutImgRef, offset: ['start end', 'end start'] });
  const aboutImgY = useTransform(aboutProgress, [0, 1], ['-9%', '9%']);

  const activeSection = useScrollSpy(Object.values(SECTION_IDS));
  const s = pgStrings(data.locale);
  const hasReviews = data.reviews.length > 0;
  const hasGallery = data.gallery.length > 0;
  const bookCta = data.labels?.bookCta ?? s.bookCta;
  const navLinks = [
    { id: SECTION_IDS.packages, label: s.navPackages },
    { id: SECTION_IDS.about, label: s.navAbout },
    { id: SECTION_IDS.areas, label: s.navAreas },
    ...(hasReviews ? [{ id: SECTION_IDS.reviews, label: s.navReviews }] : []),
    { id: SECTION_IDS.faq, label: s.navFaq },
  ];

  return (
    <div className="tmpl-prestige" dir={data.dir} style={data.theme as CSSProperties}
      data-edit="theme.bg" data-edit-type="background">

      {/* ── NAV ── */}
      <nav className="pd-nav" aria-label="Site navigation">
        <div className="pd-nav-inner">
          <button className="pd-logo" onClick={() => scrollToSection(SECTION_IDS.hero)}
            aria-label={`${data.business.name} — scroll to top`}>
            {data.business.logoSrc
              ? <img src={data.business.logoSrc} alt="" data-edit="business.logoSrc" data-edit-type="image"
                  style={{ width: '2rem', height: '2rem', borderRadius: 4, objectFit: 'cover' }} />
              : <span className="pd-logo-mark" data-edit="business.logoSrc" data-edit-type="image">{data.business.logoText.charAt(0)}</span>}
            <span className="pd-logo-text" data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
          </button>
          <div className="pd-nav-links" role="list">
            {navLinks.map(({ id, label }) => (
              <button key={id} role="listitem"
                className={`pd-nav-link${activeSection === id ? ' pd-active' : ''}`}
                onClick={() => { scrollToSection(id); setMobileOpen(false); }}
                data-edit={`copy.nav_${id}`} data-edit-type="text">
                {data.copy?.[`nav_${id}`] ?? label}
              </button>
            ))}
          </div>
          {data.accountUrl && (
            <a href={data.accountUrl} className="pd-btn-ghost">{data.copy?.nav_account ?? s.navAccount}</a>
          )}
          <button className="pd-nav-cta" data-edit="labels.bookCta" data-edit-type="text"
            onClick={() => { scrollToSection(SECTION_IDS.book); setMobileOpen(false); }}>
            {bookCta}
          </button>
          <button className="pd-burger" onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? s.closeMenu : s.openMenu} aria-expanded={mobileOpen}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="pd-mobile-menu" role="menu">
            {navLinks.map(({ id, label }) => (
              <button key={id} role="menuitem" className="pd-mobile-link"
                onClick={() => { scrollToSection(id); setMobileOpen(false); }}>{label}</button>
            ))}
            {data.accountUrl && (
              <a href={data.accountUrl} className="pd-mobile-link">{data.copy?.nav_account ?? s.navAccount}</a>
            )}
            <button className="pd-nav-cta pd-mobile-cta"
              onClick={() => { scrollToSection(SECTION_IDS.book); setMobileOpen(false); }}>
              {bookCta}
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section id={SECTION_IDS.hero} className="pd-hero" ref={heroRef}>
        <div className="pd-hero-img-wrap" aria-hidden="true">
          {!reduced
            ? <motion.img src={data.hero.image} alt="" className="pd-hero-img" style={{ y: heroImgY }}
                data-edit="hero.image" data-edit-type="image" />
            : <img src={data.hero.image} alt="" className="pd-hero-img"
                data-edit="hero.image" data-edit-type="image" />
          }
          <div className="pd-hero-scrim" />
        </div>
        <div className="pd-hero-content">
          <motion.p className="pd-eyebrow" data-edit="hero.eyebrow" data-edit-type="text"
            initial={reduced ? {} : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
            {data.hero.eyebrow}
          </motion.p>
          <motion.h1 className="pd-headline" data-edit="hero.headline" data-edit-type="text"
            initial={reduced ? {} : { opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}>
            {data.hero.headline}
          </motion.h1>
          <motion.p className="pd-sub" data-edit="hero.sub" data-edit-type="text"
            initial={reduced ? {} : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.48, ease: [0.16, 1, 0.3, 1] }}>
            {data.hero.sub}
          </motion.p>
          <motion.div className="pd-hero-ctas"
            initial={reduced ? {} : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.66, ease: [0.16, 1, 0.3, 1] }}>
            <button className="pd-btn-primary pd-shimmer" data-edit="hero.ctaPrimary" data-edit-type="text"
              onClick={() => scrollToSection(SECTION_IDS.book)}>
              {data.hero.ctaPrimary}
            </button>
            <button className="pd-btn-ghost" data-edit="hero.ctaSecondary" data-edit-type="text"
              onClick={() => scrollToSection(SECTION_IDS.packages)}>
              {data.hero.ctaSecondary} &rarr;
            </button>
          </motion.div>
        </div>
        <div className="pd-creds-strip" aria-label="Instructor credentials">
          {data.instructor.credentials.map((c, i) => (
            <span key={i} className="pd-cred-item" data-edit-item={`instructor.credentials.${i}`}>
              <Award size={11} aria-hidden="true" /><span data-edit={`instructor.credentials.${i}`} data-edit-type="text">{c}</span>
            </span>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section id={SECTION_IDS.stats} className="pd-stats-section">
        <div className="pd-container pd-stats-grid">
          {data.stats.map((s, i) => (
            <div key={i} data-edit-item={`stats.${i}`}>
              <StatCard {...s} editIndex={i} />
            </div>
          ))}
        </div>
      </section>

      {/* ── PACKAGES ── */}
      <section id={SECTION_IDS.packages} className="pd-section">
        <div className="pd-container">
          <Reveal>
            <p className="pd-eyebrow pd-eyebrow-section" data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? s.packagesEyebrowPg}</p>
            <h2 className="pd-section-title" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingPg}</h2>
          </Reveal>
          <div className="pd-packages-grid">
            {data.packages.map((pkg, i) => (
              <Reveal key={pkg.id} delay={i * 0.14}>
                <div className={`pd-pkg-card${pkg.popular ? ' pd-popular' : ''}`} data-edit-item={`packages.${i}`}>
                  {pkg.badge && <span className="pd-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge}</span>}
                  <h3 className="pd-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</h3>
                  <div className="pd-pkg-price">
                    <span className="pd-pkg-amount tabular-nums" data-edit={`packages.${i}.price`} data-edit-type="text">₪{pkg.price}</span>
                    {pkg.unit && <span className="pd-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}
                  </div>
                  {pkg.duration && (
                    <p className="pd-pkg-meta">
                      <Clock size={11} aria-hidden="true" /> <span data-edit={`packages.${i}.duration`} data-edit-type="text">{pkg.duration}</span><span data-edit="copy.packagesDurationSuffix" data-edit-type="text">{data.copy?.packagesDurationSuffix ?? s.lessonDurationSuffix}</span>
                    </p>
                  )}
                  <div className="pd-pkg-rule" aria-hidden="true" />
                  <ul className="pd-pkg-features" aria-label="Included features">
                    {pkg.features.map((f, j) => (
                      <li key={j} data-edit={`packages.${i}.features.${j}`} data-edit-type="text"><Check size={11} className="pd-check-icon" aria-hidden="true" />{f}</li>
                    ))}
                  </ul>
                  <button
                    className={`pd-btn-select${pkg.popular ? ' pd-btn-select-gold' : ''}`}
                    data-edit="labels.packageCta" data-edit-type="text"
                    onClick={() => scrollToSection(SECTION_IDS.book)}>
                    {pkg.popular
                      ? (data.labels?.packageCtaPopular ?? data.labels?.packageCta ?? s.packageCtaPopular)
                      : (data.labels?.packageCta ?? s.packageCtaPg)}
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id={SECTION_IDS.about} className="pd-section pd-about-section">
        <div className="pd-container pd-about-grid">
          <div className="pd-about-copy">
            <Reveal>
              <p className="pd-eyebrow pd-eyebrow-section" data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? s.aboutEyebrowPg}</p>
              <h2 className="pd-section-title" data-edit="about.heading" data-edit-type="text">{data.about.heading}</h2>
            </Reveal>
            {data.about.body.map((p, i) => (
              <Reveal key={i} delay={0.1 + i * 0.12}>
                <p className="pd-body-text" data-edit={`about.body.${i}`} data-edit-type="text">{p}</p>
              </Reveal>
            ))}
            <Reveal delay={0.3}>
              <ul className="pd-checklist">
                {data.about.checklist.map((item, i) => (
                  <li key={i} data-edit-item={`about.checklist.${i}`}><Check size={12} className="pd-check-icon" aria-hidden="true" /><span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span></li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.45}>
              <div className="pd-instructor-card">
                <img src={data.instructor.photo} alt={data.instructor.name}
                  className="pd-instr-photo" width={80} height={80}
                  data-edit="instructor.photo" data-edit-type="image" />
                <div>
                  <p className="pd-instr-name" data-edit="instructor.name" data-edit-type="text">{data.instructor.name}</p>
                  <p className="pd-instr-title" data-edit="instructor.title" data-edit-type="text">{data.instructor.title}</p>
                  <p className="pd-instr-bio" data-edit="instructor.bio" data-edit-type="text">{data.instructor.bio}</p>
                </div>
              </div>
            </Reveal>
          </div>
          <Reveal className="pd-about-img-col" delay={0.2}>
            <div className="pd-about-img-wrap" ref={aboutImgRef}>
              {!reduced
                ? <motion.img src={data.about.image} alt={s.aboutImageAlt}
                    className="pd-about-img" style={{ y: aboutImgY }}
                    data-edit="about.image" data-edit-type="image" />
                : <img src={data.about.image} alt={s.aboutImageAlt} className="pd-about-img"
                    data-edit="about.image" data-edit-type="image" />
              }
              <div className="pd-about-img-overlay" aria-hidden="true" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── AREAS ── */}
      <section id={SECTION_IDS.areas} className="pd-section pd-areas-section">
        <div className="pd-container">
          <Reveal>
            <p className="pd-eyebrow pd-eyebrow-section" data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? s.areasEyebrow}</p>
            <h2 className="pd-section-title" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingPg}</h2>
          </Reveal>
          <Reveal delay={0.1}><p className="pd-section-sub" data-edit="copy.areasSub" data-edit-type="text">{data.copy?.areasSub ?? s.areasSubPg}</p></Reveal>
          <Reveal delay={0.2}>
            <div className="pd-areas-grid">
              {data.areas.map((area, i) => (
                <div key={i} className="pd-area-chip" data-edit-item={`areas.${i}`}>
                  <Car size={11} aria-hidden="true" />
                  <span data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
                  {area.note && <span className="pd-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      {hasReviews && (
        <section id={SECTION_IDS.reviews} className="pd-section">
          <div className="pd-container">
            <Reveal>
              <p className="pd-eyebrow pd-eyebrow-section" data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? s.reviewsEyebrowPg}</p>
              <h2 className="pd-section-title" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingPg}</h2>
            </Reveal>
            <div className="pd-reviews-grid">
              {data.reviews.map((r, i) => (
                <Reveal key={r.id} delay={i * 0.12}>
                  <div className="pd-review-card" data-edit-item={`reviews.${i}`}>
                    <Stars n={r.rating} />
                    <p className="pd-review-text">&#8220;<span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span>&#8221;</p>
                    {r.reply && (
                      <p className="pd-review-reply">
                        <span className="pd-review-reply-label">{reviewReplyLabel(data.locale)}</span> {r.reply}
                      </p>
                    )}
                    <div className="pd-reviewer">
                      {r.avatar
                        ? <img src={r.avatar} alt="" className="pd-avatar" width={40} height={40} data-edit={`reviews.${i}.avatar`} data-edit-type="image" />
                        : <div className="pd-avatar-init" aria-hidden="true">{r.name.charAt(0)}</div>
                      }
                      <div>
                        <p className="pd-reviewer-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>
                        {r.meta && <p className="pd-reviewer-meta" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}
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
        <section className="pd-section pd-gallery-section">
          <div className="pd-container">
            <Reveal>
              <p className="pd-eyebrow pd-eyebrow-section" data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? s.galleryEyebrow}</p>
              <h2 className="pd-section-title" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingPg}</h2>
            </Reveal>
            <div className="pd-gallery-grid">
              {data.gallery.map((src, i) => (
                <Reveal key={i} delay={(i % 3) * 0.1}>
                  <figure className="pd-gallery-item" data-edit-item={`gallery.${i}`}>
                    <img src={src} alt="" className="pd-gallery-img" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" />
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      <section id={SECTION_IDS.faq} className="pd-section pd-faq-section">
        <div className="pd-container pd-faq-wrap">
          <Reveal>
            <p className="pd-eyebrow pd-eyebrow-section" data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? s.faqEyebrowPg}</p>
            <h2 className="pd-section-title" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingPg}</h2>
          </Reveal>
          <div className="pd-faq-list">
            {data.faqs.map((faq, i) => (
              <Reveal key={faq.q} delay={i * 0.07}>
                <FaqItem q={faq.q} a={faq.a} editIndex={i}
                  open={editing || activeFaq === faq.q}
                  onToggle={() => setActiveFaq(v => v === faq.q ? null : faq.q)} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOOK ── */}
      <section id={SECTION_IDS.book} className="pd-section pd-book-section">
        <div className="pd-container pd-book-cta">
          <Reveal>
            <p className="pd-eyebrow pd-eyebrow-section" data-edit="copy.bookEyebrow" data-edit-type="text">{data.copy?.bookEyebrow ?? s.bookEyebrowPg}</p>
            <h2 className="pd-section-title" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingPg}</h2>
          </Reveal>
          <Reveal delay={0.12}><p className="pd-section-sub" data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodyPg}</p></Reveal>
          <Reveal delay={0.18}><div className="pd-book-rule" aria-hidden="true" /></Reveal>
          <Reveal delay={0.24}>
            <div className="pd-book-actions">
              {data.bookingUrl ? (
                <a href={data.bookingUrl} className="pd-btn-primary pd-shimmer"
                  data-edit="labels.bookCta" data-edit-type="text">
                  {data.labels?.bookCta ?? s.bookCta}
                </a>
              ) : (
                <button type="button" className="pd-btn-primary pd-shimmer"
                  title="Available once your site is published"
                  data-edit="labels.bookCta" data-edit-type="text">
                  {data.labels?.bookCta ?? s.bookCta}
                </button>
              )}
              {data.enrollUrl && (
                <a href={data.enrollUrl} className="pd-btn-ghost"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span> &rarr;</a>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CONTACT / FOOTER ── */}
      <footer id={SECTION_IDS.contact} className="pd-footer">
        <div className="pd-container pd-footer-grid">
          <div>
            <Reveal><h2 className="pd-footer-heading" data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeading}</h2></Reveal>
            <Reveal delay={0.1}>
              <ul className="pd-contact-list">
                <li><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={14} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" />
                  <a href={`tel:${data.contact.phone.replace(/\s/g, '')}`} data-edit="contact.phone" data-edit-type="text">{data.contact.phone}</a></li>
                <li><DynamicIcon name={data.icons?.email ?? 'Mail'} size={14} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" />
                  <a href={`mailto:${data.contact.email}`} data-edit="contact.email" data-edit-type="text">{data.contact.email}</a></li>
                <li><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={14} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{data.contact.address}</span></li>
              </ul>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="pd-social">
                {(data.contact.socials ?? []).map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noreferrer"
                    aria-label={s.platform} className="pd-social-btn" data-edit-item={`contact.socials.${i}`}>
                    <SocialIcon platform={s.platform} size={16} />
                  </a>
                ))}
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.14}>
            <div className="pd-hours-panel">
              <h3 className="pd-hours-title" data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabel}</h3>
              <table className="pd-hours-table">
                <tbody>
                  {data.hours.map(h => (
                    <tr key={h.day} className={h.closed ? 'pd-closed' : ''}>
                      <td>{h.day}</td>
                      <td className="tabular-nums">{h.closed ? s.closedLabel : `${h.open} – ${h.close}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
        <div className="pd-container">
          <div className="pd-footer-bottom">
            <p>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span>. <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCreditPg}</span></p>
            <p className="pd-footer-tagline" data-edit="business.tagline" data-edit-type="text">{data.business.tagline}</p>
          </div>
        </div>
      </footer>

    </div>
  );
}

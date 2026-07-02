/**
 * Mumotor — the brand's own design, as a template. Faithful to the Mumotor app/landing:
 * fixed soft-blue aurora background + faint grid, glass nav, FadeUp/Stagger/ScrollTilt motion,
 * a big centered hero with a ScrollTilt media panel carrying floating glass cards, glass feature
 * cards, a ScrollTilt "Today's schedule" showcase, a dark band, Apple pills + frosted glass buttons,
 * big tight Inter headings, soft #F5F5F7 bands.
 *
 * The single accent var `--mm-accent` (recolorable from the template card's colour dots →
 * customization.theme['--mm-accent']) drives CTAs / links / active nav / popular plan / the soft
 * aurora orbs (via color-mix) — never dominant. Palette vars on `.tmpl-mumotor`.
 */
import { useRef, useState, type CSSProperties } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Check, Star, Menu, X, ArrowRight, Plus, Minus, ShieldCheck } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts, useCountUp, EnterTilt } from '../shared';
import { FadeUp, Stagger } from '../../components/motion';
import './mumotor.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

function Stars({ n }: { n: number }) {
  return (
    <span className="mm-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={15} fill={i < n ? 'var(--mm-accent)' : 'none'} color={i < n ? 'var(--mm-accent)' : 'var(--mm-muted)'} />
      ))}
    </span>
  );
}

function MmBackground() {
  return (
    <div className="mm-bg" aria-hidden="true">
      <div className="mm-grid" />
      <span className="mm-orb mm-orb-1" />
      <span className="mm-orb mm-orb-2" />
      <span className="mm-orb mm-orb-3" />
    </div>
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

function MmNav({ data, active }: { data: TemplateData; active: string }) {
  const [open, setOpen] = useState(false);
  const links = NAV_LINKS.filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? 'Book now';
  return (
    <nav className="mm-nav" aria-label="Main navigation">
      <div className="mm-nav-inner">
        <button className="mm-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label="Go to top">
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={28} bg="var(--mm-ink)" fg="#fff" radius={9} />
          </span>
          <span data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <div className="mm-nav-links">
          {links.map(({ id, label }) => (
            <button key={id} className={cx('mm-nav-link', active === id && 'is-active')} onClick={() => scrollToSection(id)} data-edit={`copy.nav_${id}`} data-edit-type="text">{data.copy?.[`nav_${id}`] ?? label}</button>
          ))}
        </div>
        <div className="mm-nav-end">
          <button className="mm-btn mm-btn-primary mm-btn-sm" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{bookLabel}</button>
          <button className="mm-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className="mm-nav-mobile" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {links.map(({ id, label }) => <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{label}</button>)}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ── Hero (centered + ScrollTilt media with floating glass cards) ──────────────

function MmHero({ data }: { data: TemplateData }) {
  const { hero } = data;
  const stat = data.stats[0];
  return (
    <section id={SECTION_IDS.hero} className="mm-hero">
      <div className="mm-container mm-hero-copy">
        <FadeUp><p className="mm-eyebrow mm-eyebrow-center"><span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span></p></FadeUp>
        <FadeUp delay={0.05}><h1 className="mm-h1" data-edit="hero.headline" data-edit-type="text">{hero.headline}</h1></FadeUp>
        <FadeUp delay={0.1}><p className="mm-hero-sub" data-edit="hero.sub" data-edit-type="text">{hero.sub}</p></FadeUp>
        <FadeUp delay={0.15}>
          <div className="mm-hero-ctas">
            <button className="mm-btn mm-btn-primary mm-btn-lg" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{hero.ctaPrimary} <ArrowRight size={17} aria-hidden="true" /></button>
            <button className="mm-btn mm-btn-glass mm-btn-lg" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>{hero.ctaSecondary}</button>
          </div>
        </FadeUp>
        {data.instructor.credentials.length > 0 && (
          <FadeUp delay={0.2}>
            <div className="mm-hero-creds">
              {data.instructor.credentials.map((c, i) => (
                <span key={i} className="mm-cred" data-edit-item={`instructor.credentials.${i}`}>
                  <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                  <span data-edit={`instructor.credentials.${i}`} data-edit-type="text">{c}</span>
                </span>
              ))}
            </div>
          </FadeUp>
        )}
      </div>
      <EnterTilt maxTilt={18} perspective={1200} className="mm-container mm-hero-tilt">
        <div className="mm-media">
          <img src={hero.image} alt="Driving lesson in progress" className="mm-media-img" data-edit="hero.image" data-edit-type="image" />
          <div className="mm-media-shade" aria-hidden="true" />
          <div className="mm-glass mm-float mm-float-book">
            <span className="mm-float-ic"><DynamicIcon name={data.icons?.heroFloat ?? 'CalendarCheck'} size={18} strokeWidth={2} aria-hidden="true" data-edit="icons.heroFloat" data-edit-type="icon" /></span>
            <div><p className="mm-float-t" data-edit="copy.heroFloatTitle" data-edit-type="text">{data.copy?.heroFloatTitle ?? 'New booking confirmed'}</p><p className="mm-float-s" data-edit="copy.heroFloatSub" data-edit-type="text">{data.copy?.heroFloatSub ?? 'Lesson booked · just now'}</p></div>
          </div>
          {stat && (
            <div className="mm-glass mm-chip">
              <ShieldCheck size={15} aria-hidden="true" /> <span data-edit="stats.0.value" data-edit-type="text">{stat.prefix}{stat.value}{stat.suffix}</span> <span data-edit="stats.0.label" data-edit-type="text">{stat.label}</span>
            </div>
          )}
        </div>
      </EnterTilt>
    </section>
  );
}

// ── Stats ──────────────────────────────────────────────────────────────────────

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value) ? Math.round(n).toLocaleString() : n.toFixed(1);
  return (
    <div ref={ref} className="mm-stat" data-edit-item={`stats.${index}`}>
      <span className="mm-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{formatted}{stat.suffix}</span>
      <span className="mm-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function MmStats({ stats }: { stats: TemplateData['stats'] }) {
  return (
    <section id={SECTION_IDS.stats} className="mm-stats">
      <div className="mm-container mm-stats-row">{stats.map((s, i) => <StatItem key={i} stat={s} index={i} />)}</div>
    </section>
  );
}

// ── Why (glass feature cards over aurora) ────────────────────────────────────

const FEATURES = [
  { icon: 'HeartHandshake', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: 'Calm, one-to-one lessons', body: 'Never doubled-up. Patient, steady guidance paced exactly to you.' },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: 'Dual-control, fully insured', body: 'A modern dual-control car that quietly does the worrying for you.' },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: 'Door-to-door pickup', body: 'Picked up from home, work or college — at no extra cost.' },
];

function MmWhy({ data }: { data: TemplateData }) {
  return (
    <section className="mm-section">
      <div className="mm-container">
        <FadeUp className="mm-head">
          <p className="mm-eyebrow mm-eyebrow-center"><span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? 'Why learners choose us'}</span></p>
          <h2 className="mm-h2" data-edit="copy.whyHeading" data-edit-type="text">{data.copy?.whyHeading ?? 'Everything feels calmer here.'}</h2>
        </FadeUp>
        <Stagger className="mm-why-grid">
          {FEATURES.map((f, i) => (
            <Stagger.Item key={i}>
              <div className="mm-glass mm-why-card">
                <span className="mm-why-icon"><DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={24} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" /></span>
                <h3 className="mm-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">{data.copy?.[f.titleKey] ?? f.title}</h3>
                <p className="mm-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">{data.copy?.[f.bodyKey] ?? f.body}</p>
              </div>
            </Stagger.Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

// ── Packages ─────────────────────────────────────────────────────────────────

function MmPackages({ data }: { data: TemplateData }) {
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="mm-section mm-band">
      <div className="mm-container">
        <FadeUp className="mm-head">
          <p className="mm-eyebrow mm-eyebrow-center"><span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? 'Packages'}</span></p>
          <h2 className="mm-h2" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? 'Simple, fair pricing.'}</h2>
          <p className="mm-lead" data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? 'Transparent prices, no hidden fees, change your mind any time.'}</p>
        </FadeUp>
        <Stagger className="mm-pkg-grid">
          {packages.map((pkg, i) => (
            <Stagger.Item key={pkg.id}>
              <div className={cx('mm-pkg', pkg.popular && 'is-popular')} data-edit-item={`packages.${i}`}>
                {pkg.popular && <span className="mm-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge ?? 'Most popular'}</span>}
                <p className="mm-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                <p className="mm-pkg-price"><span className="mm-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">£{pkg.price}</span>{pkg.unit && <span className="mm-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}</p>
                <ul className="mm-pkg-features">
                  {pkg.features.map((f, fi) => <li key={fi}><Check size={15} className="mm-check" aria-hidden="true" /><span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span></li>)}
                </ul>
                <button className={cx('mm-btn', pkg.popular ? 'mm-btn-primary' : 'mm-btn-glass', 'mm-btn-block')} data-edit="labels.packageCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
                  {pkg.popular ? (labels?.packageCtaPopular ?? labels?.packageCta ?? 'Book this plan') : (labels?.packageCta ?? 'Choose plan')}
                </button>
              </div>
            </Stagger.Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

// ── About (ScrollTilt showcase + floating glass schedule card) ────────────────

function MmAbout({ data }: { data: TemplateData }) {
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="mm-section">
      <div className="mm-container mm-about">
        <FadeUp className="mm-about-copy">
          <p className="mm-eyebrow"><span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? 'About'}</span></p>
          <h2 className="mm-h2 mm-h2-left" data-edit="about.heading" data-edit-type="text">{about.heading}</h2>
          {about.body.map((p, i) => <p key={i} className="mm-body"><span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span></p>)}
          <ul className="mm-checklist">{about.checklist.map((item, i) => <li key={i} data-edit-item={`about.checklist.${i}`}><span className="mm-tick"><Check size={13} strokeWidth={3} aria-hidden="true" /></span><span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span></li>)}</ul>
          <div className="mm-instructor">
            <img src={instructor.photo} alt={instructor.name} className="mm-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div><p className="mm-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p><p className="mm-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p></div>
          </div>
        </FadeUp>
        <EnterTilt maxTilt={12} className="mm-about-media">
          <div className="mm-media">
            <img src={about.image} alt="Instructor with a learner driver" className="mm-media-img mm-about-img" data-edit="about.image" data-edit-type="image" />
          </div>
          <div className="mm-glass mm-schedule">
            <div className="mm-schedule-head"><span>Today’s schedule</span><span className="mm-live"><span className="mm-live-dot" /> Live</span></div>
            {[{ time: '08:00', name: 'Maya G.', tag: 'Lesson 6' }, { time: '10:30', name: 'Omar H.', tag: 'Lesson 2' }, { time: '13:00', name: 'Noa L.', tag: 'Test prep' }].map((r) => (
              <div key={r.time} className="mm-schedule-row"><span className="mm-schedule-time">{r.time}</span><span className="mm-schedule-av">{r.name.charAt(0)}</span><span className="mm-schedule-name">{r.name}</span><span className="mm-schedule-tag">{r.tag}</span></div>
            ))}
          </div>
        </EnterTilt>
      </div>
    </section>
  );
}

// ── Areas ────────────────────────────────────────────────────────────────────

function MmAreas({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.areas} className="mm-section mm-band mm-center">
      <div className="mm-container">
        <FadeUp className="mm-head">
          <p className="mm-eyebrow mm-eyebrow-center"><span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? 'Areas covered'}</span></p>
          <h2 className="mm-h2" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? 'We come to you.'}</h2>
        </FadeUp>
        <Stagger className="mm-areas">
          {data.areas.map((area, i) => (
            <Stagger.Item key={i}>
              <span className="mm-area" data-edit-item={`areas.${i}`}>
                <span className="mm-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
                {area.note && <span className="mm-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
              </span>
            </Stagger.Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

// ── Reviews ────────────────────────────────────────────────────────────────────

function MmReviews({ data }: { data: TemplateData }) {
  return (
    <section id={SECTION_IDS.reviews} className="mm-section mm-center">
      <div className="mm-container">
        <FadeUp className="mm-head">
          <p className="mm-eyebrow mm-eyebrow-center"><span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? 'Reviews'}</span></p>
          <h2 className="mm-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? 'Loved by learners.'}</h2>
        </FadeUp>
        <Stagger className="mm-reviews">
          {data.reviews.map((r, i) => (
            <Stagger.Item key={r.id}>
              <div className="mm-glass mm-review" data-edit-item={`reviews.${i}`}>
                <Stars n={r.rating} />
                <blockquote className="mm-review-text">"<span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span>"</blockquote>
                <div className="mm-review-meta">
                  {r.avatar && <img src={r.avatar} alt={r.name} className="mm-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                  <div><p className="mm-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>{r.meta && <p className="mm-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}</div>
                </div>
              </div>
            </Stagger.Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

// ── Gallery ────────────────────────────────────────────────────────────────────

function MmGallery({ data }: { data: TemplateData }) {
  return (
    <section className="mm-section mm-center">
      <div className="mm-container">
        <FadeUp className="mm-head">
          <p className="mm-eyebrow mm-eyebrow-center"><span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? 'Gallery'}</span></p>
          <h2 className="mm-h2" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? 'From the driving seat.'}</h2>
        </FadeUp>
        <Stagger className="mm-gallery">{data.gallery.map((src, i) => <Stagger.Item key={i}><div className="mm-gallery-cell" data-edit-item={`gallery.${i}`}><img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" /></div></Stagger.Item>)}</Stagger>
      </div>
    </section>
  );
}

// ── FAQ (Apple plus/minus) ─────────────────────────────────────────────────────

function MmFaq({ data }: { data: TemplateData }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id={SECTION_IDS.faq} className="mm-section mm-band">
      <div className="mm-container mm-faq-wrap">
        <FadeUp className="mm-head mm-center">
          <p className="mm-eyebrow mm-eyebrow-center"><span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? 'FAQ'}</span></p>
          <h2 className="mm-h2" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? 'Common questions.'}</h2>
        </FadeUp>
        <div className="mm-faq-list">
          {data.faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="mm-faq-item" data-edit-item={`faqs.${i}`}>
                <button className="mm-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span data-edit={`faqs.${i}.q`} data-edit-type="text">{faq.q}</span>
                  <span className="mm-faq-ic">{isOpen ? <Minus size={16} /> : <Plus size={16} />}</span>
                </button>
                <div className={cx('mm-faq-panel', isOpen && 'is-open')}>
                  <div className="mm-faq-panel-in"><p data-edit={`faqs.${i}.a`} data-edit-type="text">{faq.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Book (dark band) ───────────────────────────────────────────────────────────

function MmBook({ data }: { data: TemplateData }) {
  const bookLabel = data.labels?.bookCta ?? 'Book a lesson';
  return (
    <section id={SECTION_IDS.book} className="mm-section mm-dark mm-center">
      <div className="mm-container">
        <FadeUp>
          <h2 className="mm-h2 mm-h2-light" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? 'Ready when you are.'}</h2>
          <p className="mm-lead mm-lead-light" data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? 'Pick a time that works for you and we’ll take it from there.'}</p>
          <div className="mm-book-ctas">
            {data.bookingUrl ? (
              <a href={data.bookingUrl} className="mm-btn mm-btn-primary mm-btn-lg" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={17} aria-hidden="true" /></a>
            ) : (
              <button type="button" className="mm-btn mm-btn-primary mm-btn-lg" title="Available once your site is published" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={17} aria-hidden="true" /></button>
            )}
            {data.enrollUrl && <a href={data.enrollUrl} className="mm-btn mm-btn-glass-dark mm-btn-lg"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? 'Enroll'}</span></a>}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ── Contact / Footer ───────────────────────────────────────────────────────────

function MmContact({ data }: { data: TemplateData }) {
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="mm-footer">
      <div className="mm-container mm-footer-grid">
        <div>
          <p className="mm-eyebrow"><span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? 'Get in touch'}</span></p>
          <div className="mm-contact-info">
            <a href={`tel:${contact.phone}`} className="mm-contact-link"><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={16} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span></a>
            <a href={`mailto:${contact.email}`} className="mm-contact-link"><DynamicIcon name={data.icons?.email ?? 'Mail'} size={16} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span></a>
            <span className="mm-contact-link"><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={16} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span></span>
          </div>
          <div className="mm-socials">
            {socials.map((s, i) => (
              <a key={i} href={s.url} className="mm-social" target="_blank" rel="noreferrer" aria-label={s.platform} data-edit-item={`contact.socials.${i}`}>
                <SocialIcon platform={s.platform} size={18} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="mm-eyebrow"><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? 'Opening hours'}</span></p>
          <table className="mm-hours"><tbody>{hours.map((h) => <tr key={h.day} className={h.closed ? 'is-closed' : ''}><td>{h.day}</td><td>{h.closed ? 'Closed' : `${h.open} – ${h.close}`}</td></tr>)}</tbody></table>
        </div>
      </div>
      <div className="mm-container mm-footer-bottom">
        <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
        <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? 'Built with Mumotor'}</span>
      </div>
    </footer>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function Mumotor({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts(['https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap']);
  const ids = Object.values(SECTION_IDS);
  const active = useScrollSpy(ids);
  return (
    <div className="tmpl-mumotor" dir={data.dir} style={data.theme as CSSProperties} data-edit="theme.bg" data-edit-type="background">
      <MmBackground />
      <div className="mm-content">
        <MmNav data={data} active={active} />
        <main>
          <MmHero data={data} />
          <MmStats stats={data.stats} />
          <MmWhy data={data} />
          <MmPackages data={data} />
          <MmAbout data={data} />
          <MmAreas data={data} />
          {data.reviews.length > 0 && <MmReviews data={data} />}
          {data.gallery.length > 0 && <MmGallery data={data} />}
          <MmFaq data={data} />
          <MmBook data={data} />
          <MmContact data={data} />
        </main>
      </div>
    </div>
  );
}

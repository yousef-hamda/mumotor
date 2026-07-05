/**
 * Aurora — Apple-keynote calm liquid glass (light).
 * Centered, oversized type. Huge whitespace. A single hero "product moment"
 * (one pristine glass slab over a soft WebGL aurora), then full-width sections
 * that breathe. Restrained motion. Sora display · Inter text.
 * Palette via CSS vars on `.tmpl-aurora`: --au-bg / --au-ink / --au-blue (accent)
 * / --au-teal (secondary) / --au-violet (highlight).
 */
import { useRef, useState, type CSSProperties } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ChevronDown, Check, Star, Menu, X, ArrowRight } from 'lucide-react';
import type { TemplateData } from '../types';
import { sampleData } from '../sampleData';
import { BrandMark } from '../BrandMark';
import { SocialIcon } from '../SocialIcon';
import { DynamicIcon } from '../DynamicIcon';
import { ShaderBackground } from '../webgl/ShaderBackground';
import { SHADER_AURORA } from '../webgl/shaders';
import { auStrings, type AuStrings } from './strings';
import {
  SECTION_IDS, scrollToSection, useScrollSpy, useTemplateFonts,
  Reveal, useCountUp,
} from '../shared';
import './aurora.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');
const AU_VARS = ['--au-bg', '--au-blue', '--au-violet', '--au-teal'];

function Stars({ n }: { n: number }) {
  return (
    <span className="au-stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={15} fill={i < n ? 'var(--au-blue)' : 'none'} color={i < n ? 'var(--au-blue)' : 'var(--au-muted)'} />
      ))}
    </span>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────────

const navLinks = (s: AuStrings) => [
  { id: SECTION_IDS.packages, label: s.navPackages },
  { id: SECTION_IDS.about, label: s.navAbout },
  { id: SECTION_IDS.areas, label: s.navAreas },
  { id: SECTION_IDS.reviews, label: s.navReviews },
  { id: SECTION_IDS.faq, label: s.navFaq },
];

function AuNav({ data, active }: { data: TemplateData; active: string }) {
  const s = auStrings(data.locale);
  const [open, setOpen] = useState(false);
  const links = navLinks(s).filter(({ id }) => id !== SECTION_IDS.reviews || data.reviews.length > 0);
  const bookLabel = data.labels?.bookCta ?? s.bookNow;
  return (
    <nav className="au-nav" aria-label="Main navigation">
      <div className="au-nav-inner">
        <button className="au-logo" onClick={() => scrollToSection(SECTION_IDS.hero)} aria-label="Go to top">
          <span data-edit="business.logoSrc" data-edit-type="image" style={{ display: 'inline-flex' }}>
            <BrandMark letter={data.business.logoText} src={data.business.logoSrc} size={28} bg="#0B1220" fg="#F6F8FC" radius={9} />
          </span>
          <span data-edit="business.name" data-edit-type="text">{data.business.logoText}</span>
        </button>
        <div className="au-nav-links">
          {links.map(({ id, label }) => (
            <button key={id} className={cx('au-nav-link', active === id && 'is-active')} onClick={() => scrollToSection(id)} data-edit={`copy.nav_${id}`} data-edit-type="text">{data.copy?.[`nav_${id}`] ?? label}</button>
          ))}
        </div>
        <div className="au-nav-end">
          {data.accountUrl && (
            <a href={data.accountUrl} className="au-btn au-btn-ghost au-btn-sm">{data.copy?.nav_account ?? s.navAccount}</a>
          )}
          <button className="au-btn au-btn-primary au-btn-sm" data-edit="labels.bookCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{bookLabel}</button>
          <button className="au-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className="au-nav-mobile" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {links.map(({ id, label }) => <button key={id} onClick={() => { scrollToSection(id); setOpen(false); }}>{label}</button>)}
            {data.accountUrl && (
              <a href={data.accountUrl} style={{ padding: '12px 8px', borderRadius: 10, fontWeight: 500, color: 'var(--au-ink)', textDecoration: 'none' }}>{data.copy?.nav_account ?? s.navAccount}</a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ── Hero (centered + product slab) ───────────────────────────────────────────

function AuHero({ data }: { data: TemplateData }) {
  const s = auStrings(data.locale);
  const { hero } = data;
  const stat = data.stats[0];
  return (
    <section id={SECTION_IDS.hero} className="au-hero">
      <div className="au-hero-bg" aria-hidden="true">
        <ShaderBackground frag={SHADER_AURORA} colorVars={AU_VARS} paletteKey={JSON.stringify(data.theme ?? {})} className="au-shader" />
      </div>
      <div className="au-hero-copy">
        <Reveal as="div" className="au-pill" delay={0.04}><span className="au-dot" /> <span data-edit="hero.eyebrow" data-edit-type="text">{hero.eyebrow}</span></Reveal>
        <h1 className="au-h1" data-edit="hero.headline" data-edit-type="text">{hero.headline}</h1>
        <Reveal as="p" className="au-hero-sub" delay={0.14}><span data-edit="hero.sub" data-edit-type="text">{hero.sub}</span></Reveal>
        <Reveal className="au-hero-ctas" delay={0.22}>
          <button className="au-btn au-btn-primary au-btn-lg" data-edit="hero.ctaPrimary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>{hero.ctaPrimary} <ArrowRight size={17} aria-hidden="true" /></button>
          <button className="au-btn au-btn-ghost au-btn-lg" data-edit="hero.ctaSecondary" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.packages)}>{hero.ctaSecondary}</button>
        </Reveal>
      </div>
      <Reveal className="au-hero-slab" delay={0.1} y={36}>
        <div className="au-slab">
          <img src={hero.image} alt={s.heroImageAlt} className="au-slab-img" data-edit="hero.image" data-edit-type="image" />
          {stat && (
            <div className="au-slab-badge">
              <p className="au-slab-num" data-edit="stats.0.value" data-edit-type="text">{stat.prefix}{stat.value}{stat.suffix}</p>
              <p className="au-slab-label" data-edit="stats.0.label" data-edit-type="text">{stat.label}</p>
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}

// ── Stats (Apple "spec" row) ──────────────────────────────────────────────────

function StatItem({ stat, index }: { stat: TemplateData['stats'][number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const n = useCountUp(stat.value, inView);
  const formatted = Number.isInteger(stat.value) ? Math.round(n).toLocaleString() : n.toFixed(1);
  return (
    <div ref={ref} className="au-stat" data-edit-item={`stats.${index}`}>
      <span className="au-stat-num" data-edit={`stats.${index}.value`} data-edit-type="text">{stat.prefix}{formatted}{stat.suffix}</span>
      <span className="au-stat-label" data-edit={`stats.${index}.label`} data-edit-type="text">{stat.label}</span>
    </div>
  );
}

function AuStats({ stats }: { stats: TemplateData['stats'] }) {
  return (
    <section id={SECTION_IDS.stats} className="au-stats">
      <div className="au-wrap au-stats-row">{stats.map((s, i) => <StatItem key={i} stat={s} index={i} />)}</div>
    </section>
  );
}

// ── Why ─────────────────────────────────────────────────────────────────────

const features = (s: AuStrings) => [
  { icon: 'HeartHandshake', titleKey: 'feature0Title', bodyKey: 'feature0Body', title: s.feature0Title, body: s.feature0Body },
  { icon: 'ShieldCheck', titleKey: 'feature1Title', bodyKey: 'feature1Body', title: s.feature1Title, body: s.feature1Body },
  { icon: 'MapPin', titleKey: 'feature2Title', bodyKey: 'feature2Body', title: s.feature2Title, body: s.feature2Body },
];

function AuWhy({ data }: { data: TemplateData }) {
  const s = auStrings(data.locale);
  return (
    <section className="au-section au-center">
      <div className="au-wrap">
        <Reveal><p className="au-eyebrow"><span data-edit="copy.whyEyebrow" data-edit-type="text">{data.copy?.whyEyebrow ?? s.whyEyebrowAu}</span></p></Reveal>
        <Reveal delay={0.05}><h2 className="au-h2" data-edit="copy.whyHeading" data-edit-type="text">{data.copy?.whyHeading ?? s.whyHeadingAu}</h2></Reveal>
        <div className="au-why-grid">
          {features(s).map((f, i) => (
            <Reveal key={i} delay={0.08 * i} className="au-why">
              <span className="au-why-icon"><DynamicIcon name={data.icons?.[`feature${i}`] ?? f.icon} size={24} aria-hidden="true" data-edit={`icons.feature${i}`} data-edit-type="icon" /></span>
              <h3 className="au-why-title" data-edit={`copy.${f.titleKey}`} data-edit-type="text">{data.copy?.[f.titleKey] ?? f.title}</h3>
              <p className="au-why-body" data-edit={`copy.${f.bodyKey}`} data-edit-type="text">{data.copy?.[f.bodyKey] ?? f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packages (Apple pricing) ─────────────────────────────────────────────────

function AuPackages({ data }: { data: TemplateData }) {
  const s = auStrings(data.locale);
  const { packages, labels } = data;
  return (
    <section id={SECTION_IDS.packages} className="au-section au-center">
      <div className="au-wrap">
        <Reveal><p className="au-eyebrow"><span data-edit="copy.packagesEyebrow" data-edit-type="text">{data.copy?.packagesEyebrow ?? s.navPackages}</span></p></Reveal>
        <Reveal delay={0.05}><h2 className="au-h2" data-edit="copy.packagesHeading" data-edit-type="text">{data.copy?.packagesHeading ?? s.packagesHeadingAu}</h2></Reveal>
        <Reveal as="p" className="au-lead" delay={0.1}><span data-edit="copy.packagesSub" data-edit-type="text">{data.copy?.packagesSub ?? s.packagesSubAu}</span></Reveal>
        <div className="au-pkg-grid">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.08}>
              <div className={cx('au-pkg', pkg.popular && 'is-popular')} data-edit-item={`packages.${i}`}>
                {pkg.popular && <span className="au-pkg-badge" data-edit={`packages.${i}.badge`} data-edit-type="text">{pkg.badge ?? s.badgePopular}</span>}
                <p className="au-pkg-name" data-edit={`packages.${i}.name`} data-edit-type="text">{pkg.name}</p>
                <p className="au-pkg-price"><span className="au-pkg-amount" data-edit={`packages.${i}.price`} data-edit-type="text">£{pkg.price}</span>{pkg.unit && <span className="au-pkg-unit" data-edit={`packages.${i}.unit`} data-edit-type="text">{pkg.unit}</span>}</p>
                <ul className="au-pkg-features">
                  {pkg.features.map((f, fi) => <li key={fi}><Check size={15} className="au-check" aria-hidden="true" /><span data-edit={`packages.${i}.features.${fi}`} data-edit-type="text">{f}</span></li>)}
                </ul>
                <button className={cx('au-btn', pkg.popular ? 'au-btn-primary' : 'au-btn-ghost', 'au-btn-block')} data-edit="labels.packageCta" data-edit-type="text" onClick={() => scrollToSection(SECTION_IDS.book)}>
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

function AuAbout({ data }: { data: TemplateData }) {
  const s = auStrings(data.locale);
  const { about, instructor } = data;
  return (
    <section id={SECTION_IDS.about} className="au-section">
      <div className="au-wrap au-about">
        <Reveal className="au-about-media" y={30}>
          <div className="au-about-frame"><img src={about.image} alt={s.aboutImageAlt} className="au-about-img" data-edit="about.image" data-edit-type="image" /></div>
          <div className="au-instructor">
            <img src={instructor.photo} alt={instructor.name} className="au-instructor-photo" data-edit="instructor.photo" data-edit-type="image" />
            <div><p className="au-instructor-name" data-edit="instructor.name" data-edit-type="text">{instructor.name}</p><p className="au-instructor-title" data-edit="instructor.title" data-edit-type="text">{instructor.title}</p></div>
          </div>
        </Reveal>
        <div className="au-about-copy">
          <Reveal><p className="au-eyebrow"><span data-edit="copy.aboutEyebrow" data-edit-type="text">{data.copy?.aboutEyebrow ?? s.aboutEyebrow}</span></p></Reveal>
          <Reveal delay={0.05}><h2 className="au-h2 au-h2-left" data-edit="about.heading" data-edit-type="text">{about.heading}</h2></Reveal>
          {about.body.map((p, i) => <Reveal key={i} as="p" className="au-body" delay={0.1 + i * 0.06}><span data-edit={`about.body.${i}`} data-edit-type="text">{p}</span></Reveal>)}
          <Reveal delay={0.22}><ul className="au-checklist">{about.checklist.map((item, i) => <li key={i} data-edit-item={`about.checklist.${i}`}><Check size={16} aria-hidden="true" /><span data-edit={`about.checklist.${i}`} data-edit-type="text">{item}</span></li>)}</ul></Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Areas ────────────────────────────────────────────────────────────────────

function AuAreas({ data }: { data: TemplateData }) {
  const s = auStrings(data.locale);
  return (
    <section id={SECTION_IDS.areas} className="au-section au-center">
      <div className="au-wrap">
        <Reveal><p className="au-eyebrow"><span data-edit="copy.areasEyebrow" data-edit-type="text">{data.copy?.areasEyebrow ?? s.areasEyebrowAu}</span></p></Reveal>
        <Reveal delay={0.05}><h2 className="au-h2" data-edit="copy.areasHeading" data-edit-type="text">{data.copy?.areasHeading ?? s.areasHeadingAu}</h2></Reveal>
        <div className="au-areas">
          {data.areas.map((area, i) => (
            <Reveal key={i} delay={(i % 4) * 0.04} as="span" className="au-area" data-edit-item={`areas.${i}`}>
              <span className="au-area-name" data-edit={`areas.${i}.name`} data-edit-type="text">{area.name}</span>
              {area.note && <span className="au-area-note" data-edit={`areas.${i}.note`} data-edit-type="text">{area.note}</span>}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Reviews ────────────────────────────────────────────────────────────────────

function AuReviews({ data }: { data: TemplateData }) {
  const s = auStrings(data.locale);
  return (
    <section id={SECTION_IDS.reviews} className="au-section au-center">
      <div className="au-wrap">
        <Reveal><p className="au-eyebrow"><span data-edit="copy.reviewsEyebrow" data-edit-type="text">{data.copy?.reviewsEyebrow ?? s.reviewsEyebrow}</span></p></Reveal>
        <Reveal delay={0.05}><h2 className="au-h2" data-edit="copy.reviewsHeading" data-edit-type="text">{data.copy?.reviewsHeading ?? s.reviewsHeadingAu}</h2></Reveal>
        <div className="au-reviews">
          {data.reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.08} className="au-review" data-edit-item={`reviews.${i}`}>
              <Stars n={r.rating} />
              <blockquote className="au-review-text">"<span data-edit={`reviews.${i}.text`} data-edit-type="text">{r.text}</span>"</blockquote>
              <div className="au-review-meta">
                {r.avatar && <img src={r.avatar} alt={r.name} className="au-avatar" data-edit={`reviews.${i}.avatar`} data-edit-type="image" />}
                <div><p className="au-review-name" data-edit={`reviews.${i}.name`} data-edit-type="text">{r.name}</p>{r.meta && <p className="au-review-sub" data-edit={`reviews.${i}.meta`} data-edit-type="text">{r.meta}</p>}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Gallery ────────────────────────────────────────────────────────────────────

function AuGallery({ data }: { data: TemplateData }) {
  const s = auStrings(data.locale);
  return (
    <section className="au-section au-center">
      <div className="au-wrap">
        <Reveal><p className="au-eyebrow"><span data-edit="copy.galleryEyebrow" data-edit-type="text">{data.copy?.galleryEyebrow ?? s.galleryEyebrow}</span></p></Reveal>
        <Reveal delay={0.05}><h2 className="au-h2" data-edit="copy.galleryHeading" data-edit-type="text">{data.copy?.galleryHeading ?? s.galleryHeadingAu}</h2></Reveal>
        <div className="au-gallery">{data.gallery.map((src, i) => <Reveal key={i} delay={(i % 3) * 0.06} className="au-gallery-cell" data-edit-item={`gallery.${i}`}><img src={src} alt="" loading="lazy" data-edit={`gallery.${i}`} data-edit-type="image" /></Reveal>)}</div>
      </div>
    </section>
  );
}

// ── FAQ ──────────────────────────────────────────────────────────────────────

function FaqItem({ faq, index }: { faq: TemplateData['faqs'][number]; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="au-faq-item" data-edit-item={`faqs.${index}`}>
      <button className="au-faq-q" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span data-edit={`faqs.${index}.q`} data-edit-type="text">{faq.q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }} className="au-faq-chev" aria-hidden="true"><ChevronDown size={18} /></motion.span>
      </button>
      <AnimatePresence>
        {open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }} style={{ overflow: 'hidden' }}><p className="au-faq-a" data-edit={`faqs.${index}.a`} data-edit-type="text">{faq.a}</p></motion.div>}
      </AnimatePresence>
    </div>
  );
}

function AuFaq({ data }: { data: TemplateData }) {
  const s = auStrings(data.locale);
  return (
    <section id={SECTION_IDS.faq} className="au-section au-center">
      <div className="au-wrap au-faq-wrap">
        <Reveal><p className="au-eyebrow"><span data-edit="copy.faqEyebrow" data-edit-type="text">{data.copy?.faqEyebrow ?? s.faqEyebrow}</span></p></Reveal>
        <Reveal delay={0.05}><h2 className="au-h2" data-edit="copy.faqHeading" data-edit-type="text">{data.copy?.faqHeading ?? s.faqHeadingAu}</h2></Reveal>
        <div className="au-faq-list">{data.faqs.map((faq, i) => <Reveal key={i} delay={i * 0.04}><FaqItem faq={faq} index={i} /></Reveal>)}</div>
      </div>
    </section>
  );
}

// ── Book ─────────────────────────────────────────────────────────────────────

function AuBook({ data }: { data: TemplateData }) {
  const s = auStrings(data.locale);
  const bookLabel = data.labels?.bookCta ?? s.bookCta;
  return (
    <section id={SECTION_IDS.book} className="au-section au-book">
      <div className="au-book-bg" aria-hidden="true"><ShaderBackground frag={SHADER_AURORA} colorVars={AU_VARS} paletteKey={JSON.stringify(data.theme ?? {})} speed={0.7} className="au-shader" /></div>
      <Reveal className="au-book-inner">
        <h2 className="au-h2" data-edit="copy.bookHeading" data-edit-type="text">{data.copy?.bookHeading ?? s.bookHeadingAu}</h2>
        <p className="au-lead" data-edit="copy.bookBody" data-edit-type="text">{data.copy?.bookBody ?? s.bookBodyAu}</p>
        <div className="au-book-ctas">
          {data.bookingUrl ? (
            <a href={data.bookingUrl} className="au-btn au-btn-primary au-btn-lg" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={17} aria-hidden="true" /></a>
          ) : (
            <button type="button" className="au-btn au-btn-primary au-btn-lg" title="Available once your site is published" data-edit="labels.bookCta" data-edit-type="text">{bookLabel} <ArrowRight size={17} aria-hidden="true" /></button>
          )}
          {data.enrollUrl && <a href={data.enrollUrl} className="au-btn au-btn-ghost au-btn-lg"><span data-edit="copy.enrollCta" data-edit-type="text">{data.copy?.enrollCta ?? s.enrollLabel}</span></a>}
        </div>
      </Reveal>
    </section>
  );
}

// ── Contact / Footer ───────────────────────────────────────────────────────────

function AuContact({ data }: { data: TemplateData }) {
  const s = auStrings(data.locale);
  const { contact, hours } = data;
  const socials = contact.socials ?? [];
  return (
    <footer id={SECTION_IDS.contact} className="au-footer">
      <div className="au-wrap au-footer-grid">
        <div>
          <p className="au-eyebrow"><span data-edit="copy.contactHeading" data-edit-type="text">{data.copy?.contactHeading ?? s.contactHeading}</span></p>
          <div className="au-contact-info">
            <a href={`tel:${contact.phone}`} className="au-contact-link"><DynamicIcon name={data.icons?.phone ?? 'Phone'} size={16} aria-hidden="true" data-edit="icons.phone" data-edit-type="icon" /><span data-edit="contact.phone" data-edit-type="text">{contact.phone}</span></a>
            <a href={`mailto:${contact.email}`} className="au-contact-link"><DynamicIcon name={data.icons?.email ?? 'Mail'} size={16} aria-hidden="true" data-edit="icons.email" data-edit-type="icon" /><span data-edit="contact.email" data-edit-type="text">{contact.email}</span></a>
            <span className="au-contact-link"><DynamicIcon name={data.icons?.address ?? 'MapPin'} size={16} aria-hidden="true" data-edit="icons.address" data-edit-type="icon" /><span data-edit="contact.address" data-edit-type="text">{contact.address}</span></span>
          </div>
          <div className="au-socials">
            {socials.map((s, i) => (
              <a key={i} href={s.url} className="au-social" target="_blank" rel="noreferrer" aria-label={s.platform} data-edit-item={`contact.socials.${i}`}>
                <SocialIcon platform={s.platform} size={18} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="au-eyebrow"><span data-edit="copy.hoursLabel" data-edit-type="text">{data.copy?.hoursLabel ?? s.hoursLabel}</span></p>
          <table className="au-hours"><tbody>{hours.map((h) => <tr key={h.day} className={h.closed ? 'is-closed' : ''}><td>{h.day}</td><td>{h.closed ? s.closedLabel : `${h.open} – ${h.close}`}</td></tr>)}</tbody></table>
        </div>
      </div>
      <div className="au-wrap au-footer-bottom">
        <span>© {new Date().getFullYear()} <span data-edit="business.name" data-edit-type="text">{data.business.name}</span></span>
        <span data-edit="copy.footerCredit" data-edit-type="text">{data.copy?.footerCredit ?? s.footerCredit}</span>
      </div>
    </footer>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function Aurora({ data = sampleData }: { data?: TemplateData }) {
  useTemplateFonts(['https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap']);
  const ids = Object.values(SECTION_IDS);
  const active = useScrollSpy(ids);
  return (
    <div className="tmpl-aurora" dir={data.dir} style={data.theme as CSSProperties} data-edit="theme.bg" data-edit-type="background">
      <AuNav data={data} active={active} />
      <main>
        <AuHero data={data} />
        <AuStats stats={data.stats} />
        <AuWhy data={data} />
        <AuPackages data={data} />
        <AuAbout data={data} />
        <AuAreas data={data} />
        {data.reviews.length > 0 && <AuReviews data={data} />}
        {data.gallery.length > 0 && <AuGallery data={data} />}
        <AuFaq data={data} />
        <AuBook data={data} />
        <AuContact data={data} />
      </main>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CalendarCheck,
  KeyRound,
  Users,
  Mail,
  ShieldCheck,
  LayoutTemplate,
  Plus,
  Minus,
  Check,
  Car,
  MapPin,
  Star,
  Wallet,
  Phone,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Logo } from '../components/Logo';
import { useSeo } from '../lib/seo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { InstallAppButton } from '../components/InstallAppButton';
import { FadeUp, Stagger, ScrollTilt } from '../components/motion';
import { Background } from '../components/Background';
import { CinematicHero } from '../components/hero/CinematicHero';

export default function Landing() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const features = [
    { icon: LayoutTemplate, title: t('landing.feature1Title'), desc: t('landing.feature1Desc') },
    { icon: KeyRound, title: t('landing.feature2Title'), desc: t('landing.feature2Desc') },
    { icon: CalendarCheck, title: t('landing.feature3Title'), desc: t('landing.feature3Desc') },
    { icon: Users, title: t('landing.feature4Title'), desc: t('landing.feature4Desc') },
    { icon: Mail, title: t('landing.feature5Title'), desc: t('landing.feature5Desc') },
    { icon: ShieldCheck, title: t('landing.feature6Title'), desc: t('landing.feature6Desc') },
  ];

  const steps = [
    { n: '1', title: t('landing.step1Title'), desc: t('landing.step1Desc') },
    { n: '2', title: t('landing.step2Title'), desc: t('landing.step2Desc') },
    { n: '3', title: t('landing.step3Title'), desc: t('landing.step3Desc') },
    { n: '4', title: t('landing.step4Title'), desc: t('landing.step4Desc') },
  ];

  const included = [
    { icon: Wallet, title: t('landing.included1Title'), desc: t('landing.included1Desc') },
    { icon: Car, title: t('landing.included2Title'), desc: t('landing.included2Desc') },
    { icon: MapPin, title: t('landing.included3Title'), desc: t('landing.included3Desc') },
    { icon: Star, title: t('landing.included4Title'), desc: t('landing.included4Desc') },
    { icon: CalendarCheck, title: t('landing.included5Title'), desc: t('landing.included5Desc') },
    { icon: Phone, title: t('landing.included6Title'), desc: t('landing.included6Desc') },
  ];

  const benefits = [
    { t: t('landing.benefit1Title'), d: t('landing.benefit1Desc') },
    { t: t('landing.benefit2Title'), d: t('landing.benefit2Desc') },
    { t: t('landing.benefit3Title'), d: t('landing.benefit3Desc') },
  ];

  const faqs = [
    { q: t('landing.faq1Q'), a: t('landing.faq1A') },
    { q: t('landing.faq2Q'), a: t('landing.faq2A') },
    { q: t('landing.faq3Q'), a: t('landing.faq3A') },
    { q: t('landing.faq4Q'), a: t('landing.faq4A') },
    { q: t('landing.faq5Q'), a: t('landing.faq5A') },
  ];

  useSeo({
    title: 'Mumotor — Website builder & booking for driving instructors',
    description:
      'Build a professional driving-instructor website in minutes — online lesson booking, student enrollment, packages and reviews. Trilingual (Hebrew, Arabic, English), no code.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: 'Mumotor',
          url: window.location.origin,
          logo: `${window.location.origin}/favicon.svg`,
          description: 'The all-in-one website builder and booking platform for driving instructors.',
        },
        {
          '@type': 'SoftwareApplication',
          name: 'Mumotor',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          url: window.location.origin,
          description:
            'Website builder for driving instructors: professional site, lesson booking, student enrollment and reminders. Hebrew, Arabic and English with RTL support.',
          offers: { '@type': 'Offer', price: '199', priceCurrency: 'ILS' },
          audience: { '@type': 'Audience', audienceType: 'Driving instructors and driving schools' },
        },
        {
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
      ],
    },
  });

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <Background />

      {/* Header — translucent frosted glass nav */}
      <header className="sticky top-0 z-40 border-b border-white/40 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" aria-label="Mumotor home" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><Logo size="sm" /></Link>
          <nav className="hidden items-center gap-9 text-sm text-sand-600 md:flex">
            <Link to="/templates" className="transition-colors hover:text-sand-900">{t('common.navTemplates')}</Link>
            <a href="#features" className="transition-colors hover:text-sand-900">{t('common.navFeatures')}</a>
            <a href="#how" className="transition-colors hover:text-sand-900">{t('common.navHowItWorks')}</a>
            <a href="#faq" className="transition-colors hover:text-sand-900">{t('common.navFaq')}</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <InstallAppButton className="hidden md:inline-flex" />
            <LanguageSwitcher className="hidden sm:inline-flex" />
            {user ? (
              <Link to="/dashboard" className="btn-primary px-4 py-1.5 text-sm">
                {t('common.dashboard')}
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden text-sm text-sand-700 transition-colors hover:text-sand-900 sm:inline-flex">
                  {t('common.signIn')}
                </Link>
                <Link to="/builder" className="btn-primary px-4 py-1.5 text-sm">
                  {t('common.getStarted')}
                </Link>
              </>
            )}
            {/* Mobile menu toggle — nav links + sign-in live here below md */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? t('common.close') : t('common.menu')}
              aria-expanded={menuOpen}
              aria-controls="landing-mobile-menu"
              className="-me-1 flex h-11 w-11 items-center justify-center rounded-full text-sand-700 transition-colors hover:bg-sand-100 hover:text-sand-900 md:hidden"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <nav
            id="landing-mobile-menu"
            className="border-t border-white/40 px-6 py-3 md:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <div className="flex flex-col gap-1 text-[15px] text-sand-700">
              <Link to="/templates" className="rounded-xl px-2 py-3 transition-colors hover:bg-sand-100 hover:text-sand-900">{t('common.navTemplates')}</Link>
              <a href="#features" className="rounded-xl px-2 py-3 transition-colors hover:bg-sand-100 hover:text-sand-900">{t('common.navFeatures')}</a>
              <a href="#how" className="rounded-xl px-2 py-3 transition-colors hover:bg-sand-100 hover:text-sand-900">{t('common.navHowItWorks')}</a>
              <a href="#faq" className="rounded-xl px-2 py-3 transition-colors hover:bg-sand-100 hover:text-sand-900">{t('common.navFaq')}</a>
              {!user && (
                <Link to="/login" className="rounded-xl px-2 py-3 transition-colors hover:bg-sand-100 hover:text-sand-900 sm:hidden">{t('common.signIn')}</Link>
              )}
            </div>
            <div className="mt-2 border-t border-sand-200 pt-3 sm:hidden">
              <LanguageSwitcher />
            </div>
          </nav>
        )}
      </header>

      {/* Hero */}
      <CinematicHero />

      {/* Features — transparent so the aurora shows through behind the cards */}
      <section id="features" className="relative">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeUp className="mx-auto max-w-3xl text-center">
            <p className="section-eyebrow justify-center">{t('landing.featuresEyebrow')}</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-sand-900 sm:text-5xl">{t('landing.featuresTitle')}</h2>
            <p className="mt-5 text-xl leading-relaxed text-sand-600">{t('landing.featuresLead')}</p>
          </FadeUp>
          <Stagger className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Stagger.Item key={i}>
                  <div className="glass h-full rounded-3xl p-7 shadow-card transition-transform duration-300 hover:-translate-y-1">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-sm ring-1 ring-black/5">
                      <Icon className="h-6 w-6 text-sand-900" strokeWidth={1.75} aria-hidden />
                    </span>
                    <h3 className="mt-5 text-xl font-semibold tracking-tight text-sand-900">{f.title}</h3>
                    <p className="mt-2.5 text-[15px] leading-relaxed text-sand-600">{f.desc}</p>
                  </div>
                </Stagger.Item>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* What's on every instructor's site — driving-specific, on a dark band */}
      <section className="bg-black">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeUp className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
              {t('landing.includedTitle')}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-sand-400">
              {t('landing.includedLead')}
            </p>
          </FadeUp>
          <Stagger className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {included.map((f, i) => {
              const Icon = f.icon;
              return (
                <Stagger.Item key={i}>
                  <div className="h-full">
                    <Icon className="h-7 w-7 text-white" strokeWidth={1.75} aria-hidden />
                    <h3 className="mt-4 text-lg font-semibold tracking-tight text-white">{f.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-sand-400">{f.desc}</p>
                  </div>
                </Stagger.Item>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-sand-50">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeUp className="mx-auto max-w-3xl text-center">
            <p className="section-eyebrow justify-center">{t('landing.howEyebrow')}</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-sand-900 sm:text-5xl">{t('landing.howTitle')}</h2>
          </FadeUp>
          <Stagger className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <Stagger.Item key={s.n}>
                <div className="h-full">
                  <div className="text-5xl font-semibold tracking-tight text-sand-300">{s.n}</div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight text-sand-900">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-sand-600">{s.desc}</p>
                </div>
              </Stagger.Item>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Showcase / value split */}
      <section id="showcase" className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 py-24 sm:py-32 lg:grid-cols-2">
          <FadeUp>
            <p className="section-eyebrow">{t('landing.showcaseEyebrow')}</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-sand-900 sm:text-5xl">{t('landing.showcaseTitle')}</h2>
            <p className="mt-5 max-w-xl text-xl leading-relaxed text-sand-600">
              {t('landing.showcaseLead')}
            </p>
            <ul className="mt-9 space-y-6">
              {benefits.map((row, i) => (
                <li key={i} className="flex gap-4">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sand-900 text-white">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-sand-900">{row.t}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-sand-600">{row.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </FadeUp>

          <ScrollTilt maxTilt={12}>
            <div className="relative">
              {/* real driving-lesson photo */}
              <div className="overflow-hidden rounded-3xl border border-white/60 shadow-elevated ring-1 ring-black/5">
                <img
                  src="/img/hero-drive.jpg"
                  alt={t('landing.showcaseImageAlt')}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
              {/* floating glass schedule card */}
              <div className="glass absolute -bottom-6 end-4 w-60 rounded-2xl p-4 shadow-elevated sm:end-[-1.5rem]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-sand-900">{t('landing.scheduleTitle')}</span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sand-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden /> {t('landing.scheduleLive')}
                  </span>
                </div>
                <div className="mt-3 space-y-2.5">
                  {[
                    { time: '08:00', name: 'Maya G.', tag: 'Lesson 6' },
                    { time: '10:30', name: 'Omar H.', tag: 'Lesson 2' },
                    { time: '13:00', name: 'Noa L.', tag: 'Test prep' },
                  ].map((r) => (
                    <div key={r.time} className="flex items-center gap-2.5">
                      <span className="w-10 text-xs font-semibold tabular-nums text-sand-900">{r.time}</span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sand-100 text-[10px] font-semibold text-sand-600">
                        {r.name.charAt(0)}
                      </span>
                      <span className="flex-1 truncate text-xs font-medium text-sand-700">{r.name}</span>
                      <span className="text-[10px] font-medium text-sand-500">{r.tag}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollTilt>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-sand-50">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
          <FadeUp>
            <blockquote className="mx-auto max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-sand-900 sm:text-[2.5rem]">
              “{t('landing.testimonialQuote')}”
            </blockquote>
            <figcaption className="mt-10 flex items-center justify-center gap-3.5">
              <img
                src="/img/instructor.jpg"
                alt={t('landing.testimonialName')}
                loading="lazy"
                className="h-12 w-12 rounded-full object-cover ring-1 ring-black/5"
              />
              <div className="text-start">
                <div className="font-semibold text-sand-900">{t('landing.testimonialName')}</div>
                <div className="text-sm text-sand-500">{t('landing.testimonialRole')}</div>
              </div>
            </figcaption>
          </FadeUp>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32">
          <FadeUp className="text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-sand-900 sm:text-5xl">{t('landing.faqTitle')}</h2>
          </FadeUp>
          <div className="mt-14 divide-y divide-sand-200 border-y border-sand-200">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={i}>
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 py-6 text-start"
                    aria-expanded={open}
                  >
                    <span className="text-lg font-medium tracking-tight text-sand-900">{f.q}</span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sand-100 text-sand-600">
                      {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </span>
                  </button>
                  <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] pb-6 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="text-base leading-relaxed text-sand-600">{f.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-sand-50">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
          <FadeUp>
            <h2 className="text-4xl font-semibold tracking-tight text-sand-900 sm:text-6xl">
              {t('landing.ctaTitle')}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-xl leading-relaxed text-sand-600">{t('landing.ctaText')}</p>
            <p className="mx-auto mt-4 max-w-xl text-lg text-sand-900">
              <span className="font-semibold">{t('landing.ctaPrice')}</span> {t('landing.ctaCancel')}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-x-7 gap-y-3 sm:flex-row">
              <Link to="/builder" className="btn-primary px-7 py-3 text-base">
                {t('landing.ctaButton')}
              </Link>
              <Link to="/login" className="btn-glass px-6 py-3 text-base">
                {t('common.signIn')}
              </Link>
            </div>
            <p className="mt-8 text-sm text-sand-500">{t('landing.ctaFootnote')}</p>
          </FadeUp>
        </div>
      </section>

      {/* Footer — Apple-style fine print */}
      <footer className="border-t border-sand-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 sm:grid-cols-[2fr_1fr_1fr]">
            <div>
              <Link to="/" aria-label="Mumotor home" className="inline-flex" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><Logo size="sm" /></Link>
              <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-sand-500">
                {t('landing.footerBlurb')}
              </p>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-sand-900">{t('landing.footerProduct')}</h4>
              <ul className="mt-3 space-y-2.5 text-[13px] text-sand-600">
                <li><a href="#features" className="transition-colors hover:text-sand-900">{t('common.navFeatures')}</a></li>
                <li><a href="#how" className="transition-colors hover:text-sand-900">{t('common.navHowItWorks')}</a></li>
                <li><a href="#faq" className="transition-colors hover:text-sand-900">{t('common.navFaq')}</a></li>
                <li><Link to="/builder" className="transition-colors hover:text-sand-900">{t('common.buildSite')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-sand-900">{t('landing.footerAccount')}</h4>
              <ul className="mt-3 space-y-2.5 text-[13px] text-sand-600">
                <li><Link to="/login" className="transition-colors hover:text-sand-900">{t('common.signIn')}</Link></li>
                <li><Link to="/register" className="transition-colors hover:text-sand-900">{t('common.getStarted')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-sand-200 pt-6 sm:flex-row">
            <p className="text-[13px] text-sand-500">© {new Date().getFullYear()} Mumotor. {t('common.allRightsReserved')}</p>
            <LanguageSwitcher />
          </div>
        </div>
      </footer>
    </div>
  );
}

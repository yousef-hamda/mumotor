import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarCheck, KeyRound, Users, Mail, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { siteUrl } from '../lib/api';
import { Logo } from '../components/Logo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Reveal } from '../components/motion';

// Code-split the 3D scene so three.js loads only on the landing page.
const CarScene = lazy(() => import('../components/three/CarScene').then((m) => ({ default: m.CarScene })));

const features = [
  { icon: Sparkles, title: 'AI site generator', desc: 'Answer a few questions and get a complete, on-brand website — instantly.' },
  { icon: KeyRound, title: 'Enrollment codes', desc: 'Hand students a code to self-enroll — no accounts or passwords to manage.' },
  { icon: CalendarCheck, title: 'Online booking', desc: 'Students book lessons straight into your real availability. No phone tag.' },
  { icon: Users, title: 'Student roster', desc: 'Track every student, their lesson count, and progress from one place.' },
  { icon: Mail, title: 'Automated email', desc: 'Daily booking nudges, two-hour reminders, and an evening schedule report.' },
  { icon: ShieldCheck, title: 'Secure by design', desc: 'Hashed codes, rate limiting, and transactional booking that never double-books.' },
];

const steps = [
  { n: '01', title: 'Describe yourself', desc: 'A short wizard: your hours, pricing, and style.' },
  { n: '02', title: 'Pick a design', desc: 'Choose one of nine premium templates.' },
  { n: '03', title: 'Publish', desc: 'Go live at your own address in minutes.' },
  { n: '04', title: 'Take bookings', desc: 'Students enroll and book; you run it all from one dashboard.' },
];

export default function Landing() {
  const { user } = useAuth();
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Logo size="md" />
          <nav className="flex items-center gap-2">
            <LanguageSwitcher className="me-1 hidden sm:inline-flex" />
            {user ? (
              <Link to="/dashboard" className="btn-primary whitespace-nowrap">
                {t('common.dashboard')} <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost hidden sm:inline-flex">
                  {t('common.signIn')}
                </Link>
                <Link to="/builder" className="btn-primary whitespace-nowrap">
                  {t('common.buildSite')}
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        {/* premium ambient background */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-dots opacity-60" />
        <div className="pointer-events-none absolute -top-40 right-0 -z-10 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-brand-200/50 via-brand-100/30 to-transparent blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-2 lg:py-20">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> {t('landing.eyebrow')}
            </span>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.04] tracking-[-0.03em] text-zinc-900 sm:text-6xl lg:text-7xl">
              {t('landing.heroTitle')}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600">{t('landing.heroLead')}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/builder" className="btn-primary px-7 py-3.5 text-base shadow-lg shadow-zinc-900/15">
                {t('landing.ctaButton')} <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={siteUrl('davids-driving')} target="_blank" rel="noreferrer" className="btn-secondary px-7 py-3.5 text-base">
                {t('common.viewDemo')}
              </a>
            </div>
            <p className="mt-6 text-sm text-zinc-500">{t('landing.heroNote')}</p>
          </Reveal>

          {/* 3D hero */}
          <div className="relative h-[360px] sm:h-[440px] lg:h-[520px]">
            <div className="pointer-events-none absolute inset-6 -z-10 rounded-[40%] bg-gradient-to-tr from-brand-100/70 to-brand-50 blur-2xl" />
            <Suspense fallback={<div className="h-full w-full animate-pulse rounded-3xl bg-zinc-100/60" />}>
              <CarScene className="h-full w-full" />
            </Suspense>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-zinc-200 bg-white/80 px-4 py-1.5 text-xs font-medium text-zinc-500 shadow-sm backdrop-blur">
              Live 3D · drag-free auto-spin
            </div>
          </div>
        </div>

        {/* stat strip */}
        <div className="mx-auto max-w-6xl px-5 pb-10">
          <Reveal className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 shadow-card sm:grid-cols-4">
            {[
              ['9', 'Premium templates'],
              ['3', 'Languages (HE/AR/EN)'],
              ['~5 min', 'To publish'],
              ['95%', 'Demo pass rate'],
            ].map(([v, l]) => (
              <div key={l} className="bg-white px-5 py-5 text-center">
                <div className="text-2xl font-extrabold tracking-tight text-zinc-900">{v}</div>
                <div className="mt-1 text-xs text-zinc-500">{l}</div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-zinc-200 bg-zinc-50/60">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="section-eyebrow">{t('landing.featuresEyebrow')}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">{t('landing.featuresTitle')}</h2>
            <p className="mt-3 text-zinc-600">{t('landing.featuresLead')}</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.title} delay={i * 60} className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <h3 className="mt-4 font-semibold text-zinc-900">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{f.desc}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="section-eyebrow">{t('landing.howEyebrow')}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">{t('landing.howTitle')}</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 80} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-card">
              <span className="font-mono text-sm font-bold text-brand-600">{s.n}</span>
              <h3 className="mt-2 font-semibold text-zinc-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <Reveal className="relative isolate overflow-hidden rounded-3xl bg-zinc-900 px-8 py-16 text-center sm:px-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-brand-600/30 blur-3xl" />
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{t('landing.ctaTitle')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-zinc-300">{t('landing.ctaText')}</p>
          <Link to="/builder" className="btn mt-8 bg-white px-7 py-3.5 text-base font-semibold text-zinc-900 shadow-lg hover:bg-zinc-100">
            {t('landing.ctaButton')} <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </section>

      <footer className="border-t border-zinc-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 sm:flex-row">
          <Logo size="sm" />
          <p className="text-sm text-zinc-500">© {new Date().getFullYear()} DriveSawa. Your road to confidence.</p>
        </div>
      </footer>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CalendarCheck,
  KeyRound,
  Users,
  Mail,
  ShieldCheck,
  ArrowRight,
  LayoutTemplate,
  Plus,
  Minus,
  Check,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Logo } from '../components/Logo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { FadeUp, Stagger } from '../components/motion';
import { CinematicHero } from '../components/hero/CinematicHero';

const features = [
  { icon: LayoutTemplate, title: 'Nine professional templates', desc: 'Pick a design built for driving instructors and tailor it in a visual editor — no code required.' },
  { icon: KeyRound, title: 'Enrollment codes', desc: 'Share a code and students self-enroll. No accounts or passwords for you to manage.' },
  { icon: CalendarCheck, title: 'Online booking', desc: 'Students book into your real availability, and your calendar updates the moment a lesson is taken.' },
  { icon: Users, title: 'Student roster', desc: 'Every student, their lesson count and their progress — organised in one place.' },
  { icon: Mail, title: 'Automatic reminders', desc: 'Booking confirmations and lesson reminders are sent on their own, so no one forgets.' },
  { icon: ShieldCheck, title: 'No double-bookings', desc: 'Transactional booking and rate limiting keep your schedule accurate and your slots honest.' },
];

const steps = [
  { n: '1', title: 'Describe your school', desc: 'A short wizard covers your hours, pricing and teaching style.' },
  { n: '2', title: 'Pick a template', desc: 'Choose one of nine designs and customise it in the editor.' },
  { n: '3', title: 'Publish', desc: 'Go live at your own address in minutes — trilingual by default.' },
  { n: '4', title: 'Take bookings', desc: 'Students enroll and book; you manage it all from one dashboard.' },
];

const benefits = [
  { t: 'Clean, credible design', d: 'Professional templates that look like a real business — not a generic template kit.' },
  { t: 'Your real availability', d: 'The booking calendar reflects exactly when you teach and updates instantly on every booking.' },
  { t: 'Trilingual, out of the box', d: 'Hebrew, Arabic and English with full right-to-left support — students read it in their own language.' },
];

const stats = [
  { v: '9', l: 'Professional templates' },
  { v: 'HE · AR · EN', l: 'Built-in languages with RTL' },
  { v: '~5 min', l: 'From sign-up to published' },
  { v: 'No code', l: 'Visual editor, zero setup' },
];

const faqs = [
  { q: 'Do I need any design or tech skills?', a: 'None. You answer a few questions, Mumotor builds the site, and you can fine-tune anything in a visual editor — no code, ever.' },
  { q: 'Which languages are supported?', a: 'Every site is built trilingual — Hebrew, Arabic and English — with full right-to-left support. Students see it in their language automatically.' },
  { q: 'How do students book lessons?', a: 'They enroll with a code you share, then book straight into your real availability. You are notified and your calendar updates instantly.' },
  { q: 'Can I change my site after publishing?', a: 'Yes. Edit text, photos, colours and layout anytime in the editor, then re-publish in one click. Your booking data is never affected.' },
];

export default function Landing() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen overflow-x-clip">
      {/* Header — frosted glass, sticky, always visible (Apple/Vercel-style) */}
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Logo size="md" />
          <nav className="hidden items-center gap-8 text-sm font-medium text-sand-600 md:flex">
            <a href="#features" className="transition-colors hover:text-sand-900">Features</a>
            <a href="#how" className="transition-colors hover:text-sand-900">How it works</a>
            <a href="#faq" className="transition-colors hover:text-sand-900">FAQ</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            {user ? (
              <Link to="/dashboard" className="btn-primary whitespace-nowrap">
                {t('common.dashboard')} <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden text-sm font-semibold text-sand-700 transition-colors hover:text-sand-900 sm:inline-flex">
                  {t('common.signIn')}
                </Link>
                <Link to="/builder" className="btn-primary whitespace-nowrap">
                  {t('common.getStarted')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <CinematicHero />

      {/* Stat bar */}
      <section className="border-y border-sand-200 bg-sand-50">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <Stagger className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
            {stats.map((s) => (
              <Stagger.Item key={s.l}>
                <div>
                  <div className="text-3xl font-semibold tracking-tight text-sand-900 sm:text-4xl">{s.v}</div>
                  <div className="mt-1.5 text-sm text-sand-500">{s.l}</div>
                </div>
              </Stagger.Item>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <FadeUp className="max-w-2xl">
            <p className="section-eyebrow">{t('landing.featuresEyebrow')}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-sand-900 sm:text-4xl">{t('landing.featuresTitle')}</h2>
            <p className="mt-4 text-lg leading-relaxed text-sand-600">{t('landing.featuresLead')}</p>
          </FadeUp>
          <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Stagger.Item key={f.title}>
                  <div className="card h-full p-7 transition-colors duration-200 hover:bg-white/85">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sun-50 text-sun-600">
                      <Icon className="h-6 w-6" strokeWidth={2} />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold tracking-tight text-sand-900">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-sand-600">{f.desc}</p>
                  </div>
                </Stagger.Item>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-sand-200 bg-sand-50">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <FadeUp className="max-w-2xl">
            <p className="section-eyebrow">{t('landing.howEyebrow')}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-sand-900 sm:text-4xl">{t('landing.howTitle')}</h2>
          </FadeUp>
          <Stagger className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <Stagger.Item key={s.n}>
                <div className="card h-full p-7">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sun-600 text-base font-bold text-white">
                    {s.n}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-sand-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-sand-600">{s.desc}</p>
                </div>
              </Stagger.Item>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Benefits / value split */}
      <section id="showcase" className="relative">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 sm:py-28 lg:grid-cols-2">
          <FadeUp>
            <p className="section-eyebrow">{t('landing.showcaseEyebrow')}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-sand-900 sm:text-4xl">{t('landing.showcaseTitle')}</h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-sand-600">
              Every template is tuned for driving instructors — clear typography, real availability and smooth, calm motion.
            </p>
            <ul className="mt-8 space-y-5">
              {benefits.map((row) => (
                <li key={row.t} className="flex gap-4">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sun-50 text-sun-600">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-sand-900">{row.t}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-sand-600">{row.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </FadeUp>

          <FadeUp delay={0.1}>
            {/* frosted-glass dashboard preview card */}
            <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/65 shadow-elevated backdrop-blur-xl backdrop-saturate-150">
              <div className="flex items-center justify-between border-b border-white/50 bg-white/40 px-5 py-3.5">
                <span className="text-sm font-semibold text-sand-900">Today&apos;s schedule</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden /> Live
                </span>
              </div>
              <div className="divide-y divide-sand-100">
                {[
                  { time: '08:00', name: 'Maya G.', tag: 'Lesson 6' },
                  { time: '10:30', name: 'Omar H.', tag: 'Lesson 2' },
                  { time: '13:00', name: 'Noa L.', tag: 'Test prep' },
                  { time: '15:30', name: 'Yara S.', tag: 'Lesson 9' },
                ].map((r) => (
                  <div key={r.time} className="flex items-center gap-4 px-5 py-3.5">
                    <span className="w-12 text-sm font-semibold text-sand-900">{r.time}</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sand-100 text-xs font-semibold text-sand-600">
                      {r.name.charAt(0)}
                    </span>
                    <span className="flex-1 text-sm font-medium text-sand-700">{r.name}</span>
                    <span className="rounded-md bg-sun-50 px-2 py-0.5 text-xs font-semibold text-sun-700">{r.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Testimonial */}
      <section className="border-y border-sand-200 bg-sand-50">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
          <FadeUp>
            <p className="section-eyebrow justify-center">{t('landing.testimonialEyebrow')}</p>
            <blockquote className="mx-auto mt-6 max-w-3xl text-2xl font-medium leading-snug tracking-tight text-sand-900 sm:text-3xl">
              “{t('landing.testimonialQuote')}”
            </blockquote>
            <figcaption className="mt-8 flex items-center justify-center gap-3.5">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sun-600 text-base font-semibold text-white">
                {t('landing.testimonialName').charAt(0)}
              </span>
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
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 sm:py-28 lg:grid-cols-[0.8fr_1.2fr]">
          <FadeUp>
            <p className="section-eyebrow">{t('landing.faqEyebrow')}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-sand-900 sm:text-4xl">{t('landing.faqTitle')}</h2>
          </FadeUp>
          <div className="divide-y divide-sand-200 border-y border-sand-200">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q}>
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-start"
                    aria-expanded={open}
                  >
                    <span className="text-base font-semibold tracking-tight text-sand-900">{f.q}</span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sand-300 text-sand-600">
                      {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </span>
                  </button>
                  <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] pb-5 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="max-w-xl text-sm leading-relaxed text-sand-600">{f.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA — dark navy band */}
      <section className="bg-white px-6 py-12 sm:py-16">
        <FadeUp className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-3xl bg-dusk px-8 py-16 text-center sm:px-16 sm:py-20">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Build your driving school website <span className="text-sun-300">in minutes.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sand-300">{t('landing.ctaText')}</p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/builder" className="btn-primary px-7 py-3.5 text-base">
                {t('landing.ctaButton')} <ArrowRight className="h-5 w-5" strokeWidth={2} />
              </Link>
              <Link
                to="/login"
                className="btn border border-white/20 bg-white/5 px-7 py-3.5 text-base font-semibold text-white hover:bg-white/10"
              >
                {t('common.signIn')}
              </Link>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* Footer */}
      <footer className="border-t border-sand-200 bg-sand-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo size="md" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-sand-500">
              Professional websites and booking for independent driving instructors. Trilingual, no code.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-sand-900">Product</h4>
            <ul className="mt-3 space-y-2 text-sm text-sand-600">
              <li><a href="#features" className="transition-colors hover:text-sand-900">Features</a></li>
              <li><a href="#how" className="transition-colors hover:text-sand-900">How it works</a></li>
              <li><a href="#faq" className="transition-colors hover:text-sand-900">FAQ</a></li>
              <li><Link to="/builder" className="transition-colors hover:text-sand-900">{t('common.buildSite')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-sand-900">Account</h4>
            <ul className="mt-3 space-y-2 text-sm text-sand-600">
              <li><Link to="/login" className="transition-colors hover:text-sand-900">{t('common.signIn')}</Link></li>
              <li><Link to="/register" className="transition-colors hover:text-sand-900">{t('common.getStarted')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-sand-200">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
            <p className="text-sm text-sand-500">© {new Date().getFullYear()} Mumotor. All rights reserved.</p>
            <LanguageSwitcher />
          </div>
        </div>
      </footer>
    </div>
  );
}

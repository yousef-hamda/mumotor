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
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Logo } from '../components/Logo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { FadeUp, Stagger, ScrollTilt } from '../components/motion';
import { Background } from '../components/Background';
import { CinematicHero } from '../components/hero/CinematicHero';

const features = [
  { icon: LayoutTemplate, title: 'Nine professional templates', desc: 'Designs built for driving instructors, tailored in a visual editor — no code required.' },
  { icon: KeyRound, title: 'Enrollment codes', desc: 'Share a code and students self-enroll. No accounts or passwords for you to manage.' },
  { icon: CalendarCheck, title: 'Online booking', desc: 'Students book into your real availability, and your calendar updates the instant a lesson is taken.' },
  { icon: Users, title: 'Student roster', desc: 'Every student, their lesson count and their progress — organised in one place.' },
  { icon: Mail, title: 'Automatic reminders', desc: 'Booking confirmations and lesson reminders send on their own, so no one forgets.' },
  { icon: ShieldCheck, title: 'No double-bookings', desc: 'Transactional booking keeps your schedule accurate and your slots honest.' },
];

const steps = [
  { n: '1', title: 'Describe your school', desc: 'A short wizard covers your hours, pricing and teaching style.' },
  { n: '2', title: 'Pick a template', desc: 'Choose one of nine designs and customise it in the editor.' },
  { n: '3', title: 'Publish', desc: 'Go live at your own address in minutes — trilingual by default.' },
  { n: '4', title: 'Take bookings', desc: 'Students enroll and book; you manage it all from one dashboard.' },
];

const included = [
  { icon: Wallet, title: 'Lesson packages & pricing', desc: 'Show your single-lesson and package prices clearly, in the local currency.' },
  { icon: Car, title: 'Manual & automatic', desc: 'List the gearbox types, vehicles and licence categories you teach.' },
  { icon: MapPin, title: 'Areas you cover', desc: 'The towns and pickup points you serve, so students know you reach them.' },
  { icon: Star, title: 'Student reviews', desc: 'Real reviews and pass stories build trust before a student ever calls.' },
  { icon: CalendarCheck, title: 'Online booking', desc: 'Students book lessons into your real availability — no phone tag.' },
  { icon: Phone, title: 'WhatsApp & contact', desc: 'One tap to message you, call, or get directions to your meeting point.' },
];

const benefits = [
  { t: 'Clean, credible design', d: 'Professional templates that look like a real business — not a generic template kit.' },
  { t: 'Your real availability', d: 'The booking calendar reflects exactly when you teach and updates instantly on every booking.' },
  { t: 'Trilingual, out of the box', d: 'Hebrew, Arabic and English with full right-to-left support — students read it in their own language.' },
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
    <div className="relative min-h-screen overflow-x-clip">
      <Background />

      {/* Header — translucent frosted glass nav */}
      <header className="sticky top-0 z-40 border-b border-white/40 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Logo size="sm" />
          <nav className="hidden items-center gap-9 text-sm text-sand-600 md:flex">
            <Link to="/templates" className="transition-colors hover:text-sand-900">Templates</Link>
            <a href="#features" className="transition-colors hover:text-sand-900">Features</a>
            <a href="#how" className="transition-colors hover:text-sand-900">How it works</a>
            <a href="#faq" className="transition-colors hover:text-sand-900">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
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
          </div>
        </div>
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
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Stagger.Item key={f.title}>
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
              Everything a driving instructor&apos;s site needs.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-sand-400">
              Each generated site is built for how driving lessons actually work — not a generic business template.
            </p>
          </FadeUp>
          <Stagger className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {included.map((f) => {
              const Icon = f.icon;
              return (
                <Stagger.Item key={f.title}>
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
              Every template is tuned for driving instructors — clear typography, real availability and calm, considered motion.
            </p>
            <ul className="mt-9 space-y-6">
              {benefits.map((row) => (
                <li key={row.t} className="flex gap-4">
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
                  alt="A learner driving during a lesson"
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
              {/* floating glass schedule card */}
              <div className="glass absolute -bottom-6 end-4 w-60 rounded-2xl p-4 shadow-elevated sm:end-[-1.5rem]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-sand-900">Today&apos;s schedule</span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sand-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden /> Live
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
                <div key={f.q}>
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
              Put your driving school online today.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-xl leading-relaxed text-sand-600">{t('landing.ctaText')}</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-x-7 gap-y-3 sm:flex-row">
              <Link to="/builder" className="btn-primary px-7 py-3 text-base">
                {t('landing.ctaButton')}
              </Link>
              <Link to="/login" className="btn-glass px-6 py-3 text-base">
                {t('common.signIn')}
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Footer — Apple-style fine print */}
      <footer className="border-t border-sand-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 sm:grid-cols-[2fr_1fr_1fr]">
            <div>
              <Logo size="sm" />
              <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-sand-500">
                Professional websites and booking for independent driving instructors. Trilingual, no code.
              </p>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-sand-900">Product</h4>
              <ul className="mt-3 space-y-2.5 text-[13px] text-sand-600">
                <li><a href="#features" className="transition-colors hover:text-sand-900">Features</a></li>
                <li><a href="#how" className="transition-colors hover:text-sand-900">How it works</a></li>
                <li><a href="#faq" className="transition-colors hover:text-sand-900">FAQ</a></li>
                <li><Link to="/builder" className="transition-colors hover:text-sand-900">{t('common.buildSite')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-sand-900">Account</h4>
              <ul className="mt-3 space-y-2.5 text-[13px] text-sand-600">
                <li><Link to="/login" className="transition-colors hover:text-sand-900">{t('common.signIn')}</Link></li>
                <li><Link to="/register" className="transition-colors hover:text-sand-900">{t('common.getStarted')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-sand-200 pt-6 sm:flex-row">
            <p className="text-[13px] text-sand-500">© {new Date().getFullYear()} Mumotor. All rights reserved.</p>
            <LanguageSwitcher />
          </div>
        </div>
      </footer>
    </div>
  );
}

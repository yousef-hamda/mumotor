import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarCheck, KeyRound, Users, Mail, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { siteUrl } from '../lib/api';
import { Logo } from '../components/Logo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Reveal } from '../components/motion';

const features = [
  { icon: KeyRound, title: 'Enrollment codes', desc: 'Give students a code to self-enroll — no accounts or passwords to manage.' },
  { icon: CalendarCheck, title: 'Self-service booking', desc: 'Students book lessons directly into your daily schedule. No more phone tag.' },
  { icon: Users, title: 'Student roster', desc: 'Track every student, their lesson count, and progress from one place.' },
  { icon: Mail, title: 'Automated email', desc: 'Daily booking reminders, two-hour lesson alerts, and an evening schedule report.' },
  { icon: ShieldCheck, title: 'Secure by design', desc: 'Hashed codes, rate limiting, and transactional booking that never double-books.' },
  { icon: Clock, title: 'Your scheduling rules', desc: 'Set lesson length, working hours, breaks, advance window, and same-day cutoff.' },
];

const steps = [
  { n: '01', title: 'Share your code', desc: 'Hand a new student your enrollment code or daily code.' },
  { n: '02', title: 'They enroll', desc: 'The student registers with their name, email, and the code.' },
  { n: '03', title: 'They book', desc: 'Students choose from your open slots; you get a clean schedule.' },
  { n: '04', title: 'They pass', desc: 'Track progress through to a confident, licensed driver.' },
];

function ScheduleMock() {
  const rows = [
    { time: '09:00', name: 'Anna Krause', booked: true },
    { time: '10:00', name: 'Sam Becker', booked: true },
    { time: '11:00', name: '', booked: false },
    { time: '13:00', name: 'Omar Jaber', booked: true },
    { time: '14:00', name: '', booked: false },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-elevated">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5">
        <p className="text-sm font-semibold text-zinc-900">Today's schedule</p>
        <span className="chip bg-zinc-100 text-zinc-600">3 booked · 2 free</span>
      </div>
      <div className="divide-y divide-zinc-100">
        {rows.map((r) => (
          <div key={r.time} className="flex items-center gap-4 px-5 py-3">
            <span className="w-12 font-mono text-sm text-zinc-500">{r.time}</span>
            {r.booked ? (
              <>
                <span className="text-sm font-medium text-zinc-900">{r.name}</span>
                <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />
              </>
            ) : (
              <span className="ml-auto text-xs text-zinc-400">Available</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
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
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="section-eyebrow">{t('landing.eyebrow')}</p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-zinc-900 sm:text-5xl">
              {t('landing.heroTitle')}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-600">{t('landing.heroLead')}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/builder" className="btn-primary px-6 py-3 text-base">
                {t('landing.ctaButton')} <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={siteUrl('davids-driving')} target="_blank" rel="noreferrer" className="btn-secondary px-6 py-3 text-base">
                {t('common.viewDemo')}
              </a>
            </div>
            <p className="mt-6 text-sm text-zinc-500">{t('landing.heroNote')}</p>
          </div>
          <div className="lg:pl-6">
            <ScheduleMock />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="section-eyebrow">{t('landing.featuresEyebrow')}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">{t('landing.featuresTitle')}</h2>
            <p className="mt-3 text-zinc-600">{t('landing.featuresLead')}</p>
          </div>
          <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.title} delay={i * 60}>
                  <Icon className="h-5 w-5 text-zinc-700" strokeWidth={1.75} />
                  <h3 className="mt-3 font-semibold text-zinc-900">{f.title}</h3>
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
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">{t('landing.howTitle')}</h2>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 80} className="border-t border-zinc-900 pt-4">
              <span className="font-mono text-sm text-zinc-400">{s.n}</span>
              <h3 className="mt-2 font-semibold text-zinc-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <Reveal className="rounded-2xl bg-zinc-900 px-8 py-14 text-center sm:px-16">
          <h2 className="text-3xl font-bold tracking-tight text-white">{t('landing.ctaTitle')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-zinc-300">{t('landing.ctaText')}</p>
          <Link
            to="/builder"
            className="btn mt-8 bg-white px-6 py-3 text-base font-semibold text-zinc-900 hover:bg-zinc-100"
          >
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

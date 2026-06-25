import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useScroll } from 'framer-motion';
import { CalendarCheck, KeyRound, Users, Mail, ShieldCheck, ArrowRight, Sparkles, Plus, Minus, Check, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { siteUrl } from '../lib/api';
import { Logo } from '../components/Logo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { FadeUp, Stagger, Tilt, Magnetic, CountUp } from '../components/motion';
import { CinematicHero } from '../components/hero/CinematicHero';
import { useIntro } from '../lib/useIntro';

const features = [
  { icon: Sparkles, n: '01', title: 'Instant website', desc: 'Answer a few warm questions and get a complete, on-brand site — generated in seconds, not weeks.' },
  { icon: KeyRound, n: '02', title: 'Enrollment codes', desc: 'Hand students a code to self-enroll. No accounts, no passwords, no admin headaches.' },
  { icon: CalendarCheck, n: '03', title: 'Online booking', desc: 'Students book straight into your real availability. The phone tag finally stops.' },
  { icon: Users, n: '04', title: 'Student roster', desc: 'Every student, their lesson count and progress — gathered in one quiet place.' },
  { icon: Mail, n: '05', title: 'Automatic reminders', desc: 'Booking nudges, two-hour reminders and an evening recap go out on their own.' },
  { icon: ShieldCheck, n: '06', title: 'Never double-books', desc: 'Hashed codes, rate limiting and transactional booking keep your calendar honest.' },
];

const steps = [
  { n: '01', title: 'Describe yourself', desc: 'A short, friendly wizard: your hours, pricing and teaching style.' },
  { n: '02', title: 'Pick a design', desc: 'Choose one of nine hand-tuned templates. Make it yours in the editor.' },
  { n: '03', title: 'Publish', desc: 'Go live at your own address in minutes — trilingual out of the box.' },
  { n: '04', title: 'Take bookings', desc: 'Students enroll and book; you run it all from one calm dashboard.' },
];

const faqs = [
  { q: 'Do I need any design or tech skills?', a: 'None at all. You answer a few questions, Mumotor designs the site, and you can fine-tune anything with a visual editor — no code, ever.' },
  { q: 'Which languages are supported?', a: 'Every site is built trilingual — Hebrew, Arabic and English — with full right-to-left support. Students read it in their language automatically.' },
  { q: 'How do students book lessons?', a: 'They enroll with a code you share, then book straight into your real availability. You get notified and your calendar updates instantly.' },
  { q: 'Can I change my site after publishing?', a: 'Yes. Edit text, photos, colours and layout anytime in the editor, then re-publish in one click. Your booking data is never affected.' },
];

export default function Landing() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { phase, reduced, start, finish } = useIntro();
  const { scrollYProgress } = useScroll();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const revealed = phase === 'revealed';

  return (
    <div className="min-h-screen overflow-x-clip bg-sand-50">
      {/* scroll progress */}
      <motion.div style={{ scaleX: scrollYProgress }} className="fixed inset-x-0 top-0 z-[65] h-[3px] origin-left bg-sunrise" />

      {/* Nav — revealed after the intro */}
      <header
        className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-sand-950/40 backdrop-blur-xl transition-all duration-700"
        style={{ opacity: revealed ? 1 : 0, transform: revealed ? 'none' : 'translateY(-12px)', pointerEvents: revealed ? 'auto' : 'none' }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Logo size="md" invert />
          <nav className="hidden items-center gap-8 text-sm font-semibold text-sand-200 md:flex">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#how" className="transition-colors hover:text-white">How it works</a>
            <a href="#showcase" className="transition-colors hover:text-white">Showcase</a>
            <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <LanguageSwitcher className="me-1 hidden border-white/15 bg-white/10 text-sand-100 sm:inline-flex" />
            {user ? (
              <Link to="/dashboard" className="btn-sun whitespace-nowrap">
                {t('common.dashboard')} <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden text-sm font-semibold text-sand-200 transition-colors hover:text-white sm:inline-flex">
                  {t('common.signIn')}
                </Link>
                <Magnetic>
                  <Link to="/builder" className="btn-sun whitespace-nowrap">
                    {t('common.buildSite')}
                  </Link>
                </Magnetic>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Cinematic hero */}
      <CinematicHero phase={phase} reduced={reduced} onStart={start} onFinish={finish} />

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <Stagger className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
          {[
            { v: 9, suffix: '', l: 'Premium templates' },
            { v: 3, suffix: '', l: 'Languages · HE / AR / EN' },
            { v: 5, suffix: ' min', l: 'Average time to publish' },
            { v: 100, suffix: '%', l: 'No-code, no headaches' },
          ].map((s) => (
            <Stagger.Item key={s.l}>
              <div className="border-s-2 border-sun-300 ps-5">
                <div className="font-display text-5xl font-semibold tracking-tight text-sand-950">
                  <CountUp value={s.v} suffix={s.suffix} />
                </div>
                <div className="mt-2 text-sm text-sand-500">{s.l}</div>
              </div>
            </Stagger.Item>
          ))}
        </Stagger>
      </section>

      {/* Features */}
      <section id="features" className="relative border-t border-sand-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:py-28">
          <FadeUp className="max-w-2xl">
            <p className="section-eyebrow"><span className="h-px w-8 bg-sun-500" /> {t('landing.featuresEyebrow')}</p>
            <h2 className="mt-5 text-4xl font-semibold tracking-tightest text-sand-950 sm:text-5xl">{t('landing.featuresTitle')}</h2>
            <p className="mt-4 text-lg text-sand-600">{t('landing.featuresLead')}</p>
          </FadeUp>
          <Stagger className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-sand-200 bg-sand-200 sm:grid-cols-2 lg:grid-cols-3" gap={0.06}>
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Stagger.Item key={f.title}>
                  <div className="group h-full bg-white p-8 transition-colors duration-300 hover:bg-sand-50">
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sand-950 text-sun-400 transition-colors group-hover:bg-sun-500 group-hover:text-white">
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <span className="font-display text-2xl font-semibold text-sand-200">{f.n}</span>
                    </div>
                    <h3 className="mt-6 text-lg font-bold tracking-tight text-sand-950">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-sand-600">{f.desc}</p>
                  </div>
                </Stagger.Item>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* Showcase */}
      <section id="showcase" className="relative overflow-hidden bg-sand-50">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:py-28">
          <FadeUp className="max-w-2xl">
            <p className="section-eyebrow"><span className="h-px w-8 bg-sun-500" /> {t('landing.showcaseEyebrow')}</p>
            <h2 className="mt-5 text-4xl font-semibold tracking-tightest text-sand-950 sm:text-5xl">{t('landing.showcaseTitle')}</h2>
            <p className="mt-4 text-lg text-sand-600">{t('landing.showcaseLead')}</p>
          </FadeUp>
          <div className="mt-16 grid items-center gap-12 lg:grid-cols-2">
            <FadeUp>
              <Tilt max={6}>
                <figure className="overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-elevated">
                  <div className="flex items-center gap-1.5 border-b border-sand-100 px-4 py-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-ember-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-sun-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-sand-300" />
                    <span className="ms-3 truncate rounded-full bg-sand-100 px-3 py-1 text-xs font-medium text-sand-500">davids-driving.mumotor.com</span>
                  </div>
                  <div className="relative">
                    <img src="/img/hero-drive.jpg" alt="A confident learner driver behind the wheel" className="aspect-[16/10] w-full object-cover" loading="lazy" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-sand-950/40 via-transparent to-transparent" />
                    <div className="pointer-events-none absolute inset-0 mix-blend-soft-light" style={{ background: 'linear-gradient(120deg, rgba(168,96,79,0.32), transparent 60%)' }} />
                  </div>
                </figure>
              </Tilt>
            </FadeUp>
            <div className="space-y-3">
              {[
                { t: 'Warm, human design', d: 'Soft serif headlines, golden-hour photography and gentle motion — it never looks like a template.' },
                { t: 'Your real availability', d: 'The booking calendar shows exactly when you teach, and updates the moment a lesson is taken.' },
                { t: 'Trilingual, out of the box', d: 'Hebrew, Arabic and English with full RTL — your students read it in their own language.' },
              ].map((row, i) => (
                <FadeUp key={row.t} delay={i * 0.08}>
                  <div className="flex gap-4 border-b border-sand-200 py-5">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sun-500 text-white">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold tracking-tight text-sand-950">{row.t}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-sand-600">{row.d}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-sand-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:py-28">
          <FadeUp className="max-w-2xl">
            <p className="section-eyebrow"><span className="h-px w-8 bg-sun-500" /> {t('landing.howEyebrow')}</p>
            <h2 className="mt-5 text-4xl font-semibold tracking-tightest text-sand-950 sm:text-5xl">{t('landing.howTitle')}</h2>
          </FadeUp>
          <Stagger className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <Stagger.Item key={s.n}>
                <div className="group">
                  <span className="font-display text-3xl font-semibold text-sun-500">{s.n}</span>
                  <div className="mt-4 h-px w-full bg-sand-200">
                    <div className="h-px w-0 bg-sand-950 transition-all duration-700 group-hover:w-full" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold tracking-tight text-sand-950">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-sand-600">{s.desc}</p>
                </div>
              </Stagger.Item>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-sand-50">
        <div className="mx-auto max-w-4xl px-5 py-24 text-center sm:py-28">
          <FadeUp>
            <p className="section-eyebrow justify-center">{t('landing.testimonialEyebrow')}</p>
            <blockquote className="mx-auto mt-6 max-w-3xl font-display text-3xl font-medium leading-snug tracking-tight text-sand-900 sm:text-4xl">
              “{t('landing.testimonialQuote')}”
            </blockquote>
            <figcaption className="mt-8 flex items-center justify-center gap-3.5">
              <img src="/img/instructor.jpg" alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-sun-200" />
              <div className="text-start">
                <div className="font-bold text-sand-950">{t('landing.testimonialName')}</div>
                <div className="text-sm text-sand-500">{t('landing.testimonialRole')}</div>
              </div>
            </figcaption>
          </FadeUp>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-sand-200/70 bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 sm:py-28 lg:grid-cols-[0.8fr_1.2fr]">
          <FadeUp>
            <p className="section-eyebrow">{t('landing.faqEyebrow')}</p>
            <h2 className="mt-5 text-4xl font-semibold tracking-tightest text-sand-950 sm:text-5xl">{t('landing.faqTitle')}</h2>
          </FadeUp>
          <div className="divide-y divide-sand-200 border-y border-sand-200">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q}>
                  <button onClick={() => setOpenFaq(open ? null : i)} className="flex w-full items-center justify-between gap-4 py-5 text-start">
                    <span className="text-lg font-bold tracking-tight text-sand-950">{f.q}</span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sand-300 text-sand-700">
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

      {/* Final CTA */}
      <section className="bg-sand-50 px-5 py-20">
        <FadeUp className="mx-auto max-w-6xl">
          <div className="relative isolate overflow-hidden rounded-4xl bg-sand-950 px-8 py-20 text-center sm:px-16">
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full sun-glow opacity-70 blur-2xl" />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-grain opacity-[0.12]" />
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold tracking-tightest text-white sm:text-5xl">{t('landing.ctaTitle')}</h2>
            <p className="mx-auto mt-4 max-w-xl text-sand-300">{t('landing.ctaText')}</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Magnetic>
                <Link to="/builder" className="btn-sun px-8 py-4 text-base">
                  {t('landing.ctaButton')} <ArrowRight className="h-4 w-4" />
                </Link>
              </Magnetic>
              <Link to="/login" className="btn px-7 py-4 text-base font-semibold text-sand-200 hover:text-white">
                {t('common.signIn')} <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* Footer */}
      <footer className="border-t border-sand-200/70 bg-sand-50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 sm:flex-row">
          <Logo size="sm" />
          <p className="text-sm text-sand-500">© {new Date().getFullYear()} Mumotor · Online by sunrise.</p>
          <LanguageSwitcher />
        </div>
      </footer>
    </div>
  );
}

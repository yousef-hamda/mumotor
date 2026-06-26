import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Languages, Clock, MousePointerClick, CalendarCheck } from 'lucide-react';
import { siteUrl } from '../../lib/api';
import { FadeUp } from '../motion';

/**
 * Clean, immediate marketing hero. The old full-screen "start engine" video
 * gate has been removed — this renders instantly, with the nav always visible.
 */
export function CinematicHero() {
  const { t } = useTranslation();

  const trust = [
    { icon: Languages, label: 'Trilingual · HE · AR · EN' },
    { icon: Clock, label: 'Publish in minutes' },
    { icon: MousePointerClick, label: 'No code' },
  ];

  return (
    <section className="relative isolate overflow-hidden">
      {/* faint grid over the body's blue ambient tint — gives the frosted
          surfaces something subtle to refract (no glow blob) */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-warm opacity-50" aria-hidden />

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 pb-20 pt-32 sm:pt-36 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pb-28">
        {/* ---- Copy ---- */}
        <div className="max-w-xl">
          <FadeUp>
            <span className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-sand-600">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden /> {t('landing.eyebrow')}
            </span>
          </FadeUp>

          <FadeUp delay={0.05}>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-sand-900 sm:text-5xl lg:text-6xl">
              {t('landing.heroTitlePre')}{' '}
              <span className="text-sun-600">online in minutes.</span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.1}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-sand-600">{t('landing.heroLead')}</p>
          </FadeUp>

          <FadeUp delay={0.15}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/builder" className="btn-primary px-6 py-3 text-base">
                {t('landing.ctaButton')} <ArrowRight className="h-5 w-5" strokeWidth={2} />
              </Link>
              <a href={siteUrl('davids-driving')} target="_blank" rel="noreferrer" className="btn-secondary px-6 py-3 text-base">
                {t('common.viewDemo')}
              </a>
            </div>
          </FadeUp>

          <FadeUp delay={0.2}>
            <ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
              {trust.map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-2 text-sm font-medium text-sand-600">
                  <Icon className="h-4 w-4 text-sun-600" strokeWidth={2} aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
          </FadeUp>
        </div>

        {/* ---- Product mockup (browser frame, built with divs) ---- */}
        <FadeUp delay={0.1}>
          <BrowserMockup />
        </FadeUp>
      </div>
    </section>
  );
}

function BrowserMockup() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/60 shadow-elevated backdrop-blur-xl backdrop-saturate-150">
        {/* chrome */}
        <div className="flex items-center gap-2 border-b border-white/40 bg-white/40 px-4 py-3">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-3 w-3 rounded-full bg-sand-300" />
            <span className="h-3 w-3 rounded-full bg-sand-300" />
            <span className="h-3 w-3 rounded-full bg-sand-300" />
          </span>
          <span className="ms-2 inline-flex flex-1 items-center justify-center rounded-md border border-white/50 bg-white/50 px-3 py-1 text-xs font-medium text-sand-500">
            davids-driving.mumotor.com
          </span>
        </div>

        {/* faux published site — kept lightly translucent so text stays sharp */}
        <div className="bg-white/70">
          {/* site nav */}
          <div className="flex items-center justify-between border-b border-white/50 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sun-600 text-xs font-bold text-white">D</span>
              <span className="text-sm font-bold tracking-tight text-sand-900">David&apos;s Driving</span>
            </div>
            <div className="hidden items-center gap-3 sm:flex" aria-hidden>
              <span className="h-1.5 w-10 rounded-full bg-sand-200" />
              <span className="h-1.5 w-8 rounded-full bg-sand-200" />
              <span className="h-6 w-16 rounded-md bg-sun-600" />
            </div>
          </div>

          {/* site hero */}
          <div className="px-5 py-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sun-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-sun-700">
              Licensed instructor · Netanya
            </span>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-sand-900">Learn to drive with confidence.</h3>
            <p className="mt-2 text-sm leading-relaxed text-sand-500">
              Flexible lessons, patient teaching, and online booking that fits your schedule.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-sun-600 px-3.5 py-2 text-xs font-semibold text-white">
                <CalendarCheck className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Book a lesson
              </span>
              <span className="rounded-lg border border-sand-300 px-3.5 py-2 text-xs font-semibold text-sand-700">Pricing</span>
            </div>
          </div>

          {/* booking strip */}
          <div className="grid grid-cols-3 gap-px border-t border-white/50 bg-white/30">
            {[
              { k: 'Mon', v: '08:00' },
              { k: 'Wed', v: '14:30' },
              { k: 'Fri', v: '10:00' },
            ].map((s) => (
              <div key={s.k} className="bg-white/55 px-4 py-3 text-center">
                <div className="text-[10px] font-medium uppercase tracking-wide text-sand-400">{s.k}</div>
                <div className="mt-0.5 text-sm font-semibold text-sand-900">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* small floating availability card — frosted glass, no glow */}
      <div className="glass absolute -bottom-5 -start-5 hidden items-center gap-3 rounded-xl px-4 py-3 sm:flex">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <CalendarCheck className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
        <div>
          <div className="text-xs font-semibold text-sand-900">New booking</div>
          <div className="text-[11px] text-sand-500">Lesson confirmed · just now</div>
        </div>
      </div>
    </div>
  );
}

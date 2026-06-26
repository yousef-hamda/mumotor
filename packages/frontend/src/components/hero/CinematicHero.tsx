import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, CalendarCheck } from 'lucide-react';
import { siteUrl } from '../../lib/api';
import { FadeUp } from '../motion';

/**
 * Apple-style hero: centered, oversized type, generous whitespace, near-monochrome,
 * with a single restrained blue accent on the CTAs. A large, clean product
 * showcase sits below the headline. Renders instantly (no intro gate).
 */
export function CinematicHero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-5xl px-6 pb-16 pt-24 text-center sm:pt-32">
        <FadeUp>
          <p className="text-base font-semibold tracking-tight text-sun-600">{t('landing.eyebrow')}</p>
        </FadeUp>

        <FadeUp delay={0.05}>
          <h1 className="mx-auto mt-4 max-w-4xl text-5xl font-semibold leading-[1.05] tracking-[-0.03em] text-sand-900 sm:text-6xl lg:text-[5.25rem]">
            {t('landing.heroTitlePre')} online in minutes.
          </h1>
        </FadeUp>

        <FadeUp delay={0.1}>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-sand-600 sm:text-[1.375rem]">
            {t('landing.heroLead')}
          </p>
        </FadeUp>

        <FadeUp delay={0.15}>
          <div className="mt-9 flex flex-col items-center justify-center gap-x-7 gap-y-3 sm:flex-row">
            <Link to="/builder" className="btn-primary px-7 py-3 text-base">
              {t('landing.ctaButton')}
            </Link>
            <a
              href={siteUrl('davids-driving')}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-1 text-base font-medium text-sun-600 transition-colors hover:text-sun-500"
            >
              {t('common.viewDemo')}
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" strokeWidth={2.5} aria-hidden />
            </a>
          </div>
        </FadeUp>
      </div>

      {/* Large, clean product showcase */}
      <FadeUp delay={0.1} className="mx-auto max-w-6xl px-6 pb-24">
        <BrowserShowcase />
      </FadeUp>
    </section>
  );
}

function BrowserShowcase() {
  return (
    <div className="relative mx-auto w-full">
      <div className="overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-elevated">
        {/* chrome */}
        <div className="flex items-center gap-2 border-b border-sand-200 bg-sand-50 px-5 py-3.5">
          <span className="flex gap-2" aria-hidden>
            <span className="h-3 w-3 rounded-full bg-sand-300" />
            <span className="h-3 w-3 rounded-full bg-sand-300" />
            <span className="h-3 w-3 rounded-full bg-sand-300" />
          </span>
          <span className="ms-3 inline-flex flex-1 items-center justify-center rounded-md bg-white px-3 py-1.5 text-xs font-medium text-sand-500">
            davids-driving.mumotor.com
          </span>
        </div>

        {/* faux published site */}
        <div className="bg-white">
          <div className="flex items-center justify-between border-b border-sand-200 px-6 py-4 sm:px-10">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand-900 text-xs font-bold text-white">D</span>
              <span className="text-base font-semibold tracking-tight text-sand-900">David&apos;s Driving</span>
            </div>
            <div className="hidden items-center gap-4 sm:flex" aria-hidden>
              <span className="h-1.5 w-12 rounded-full bg-sand-200" />
              <span className="h-1.5 w-10 rounded-full bg-sand-200" />
              <span className="h-8 w-20 rounded-full bg-sand-900" />
            </div>
          </div>

          <div className="px-6 py-14 text-center sm:px-10 sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sand-500">Licensed instructor · Netanya</p>
            <h3 className="mx-auto mt-4 max-w-lg text-3xl font-semibold tracking-tight text-sand-900 sm:text-4xl">
              Learn to drive with confidence.
            </h3>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-sand-600">
              Flexible lessons, patient teaching, and online booking that fits your schedule.
            </p>
            <div className="mt-7 flex items-center justify-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-sand-900 px-5 py-2.5 text-sm font-medium text-white">
                <CalendarCheck className="h-4 w-4" strokeWidth={2} aria-hidden /> Book a lesson
              </span>
              <span className="rounded-full bg-sand-100 px-5 py-2.5 text-sm font-medium text-sand-900">Pricing</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-px border-t border-sand-200 bg-sand-200">
            {[
              { k: 'Mon', v: '08:00' },
              { k: 'Wed', v: '14:30' },
              { k: 'Fri', v: '10:00' },
            ].map((s) => (
              <div key={s.k} className="bg-white px-4 py-5 text-center">
                <div className="text-[11px] font-medium uppercase tracking-wide text-sand-400">{s.k}</div>
                <div className="mt-1 text-base font-semibold text-sand-900">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

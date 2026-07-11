import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play, CalendarCheck, ShieldCheck } from 'lucide-react';
import { FadeUp, ScrollTilt } from '../motion';
import { VideoLightbox } from '../VideoLightbox';

/**
 * Apple-style hero: centered oversized type, near-monochrome with one blue accent,
 * a glass secondary CTA that opens the product demo video, and a large real
 * driving-lesson video that rises and flattens on scroll (3D). Renders instantly.
 */
export function CinematicHero() {
  const { t } = useTranslation();
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-5xl px-6 pb-14 pt-24 text-center sm:pt-32">
        <FadeUp>
          <p className="text-base font-semibold tracking-tight text-sun-600">{t('landing.eyebrow')}</p>
        </FadeUp>

        <FadeUp delay={0.05}>
          <h1 className="mx-auto mt-4 max-w-4xl break-words text-[2.75rem] font-semibold leading-[1.05] tracking-[-0.03em] text-sand-900 sm:text-6xl lg:text-[5.25rem]">
            {t('landing.heroTitlePre')} {t('landing.heroTitleAccent')}
          </h1>
        </FadeUp>

        <FadeUp delay={0.1}>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-sand-600 sm:text-[1.375rem]">
            {t('landing.heroLead')}
          </p>
        </FadeUp>

        <FadeUp delay={0.15}>
          <div className="mt-9 flex flex-col items-center justify-center gap-x-5 gap-y-3 sm:flex-row">
            <Link to="/builder" className="btn-primary px-7 py-3 text-base">
              {t('landing.ctaButton')}
            </Link>
            <button type="button" onClick={() => setVideoOpen(true)} className="btn-glass px-6 py-3 text-base">
              <Play className="h-4 w-4 fill-current" strokeWidth={0} aria-hidden />
              {t('common.watchDemo')}
            </button>
          </div>
        </FadeUp>
      </div>

      {/* Large real driving-lesson video — 3D scroll reveal. Click to play the full demo. */}
      <ScrollTilt className="mx-auto max-w-6xl px-6 pb-24">
        <div className="group relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-white shadow-elevated ring-1 ring-black/5">
          <video
            className="aspect-[16/9] w-full object-cover"
            poster="/media/hero-car-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="A driving instructor giving a lesson"
          >
            <source src="/media/hero-car.webm" type="video/webm" />
            <source src="/media/hero-car.mp4" type="video/mp4" />
          </video>

          {/* subtle bottom gradient for legibility of the floating card */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/30 to-transparent" />

          {/* floating glass "booking confirmed" card */}
          <div className="glass absolute bottom-5 start-5 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-card">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sand-900 text-white">
              <CalendarCheck className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <div className="text-start">
              <div className="text-sm font-semibold text-sand-900">{t('landing.heroCardBooking')}</div>
              <div className="text-xs text-sand-500">Maya G. · {t('landing.heroCardLesson')} 6 · {t('landing.heroCardJustNow')}</div>
            </div>
          </div>

          {/* floating glass trust chip */}
          <div className="glass absolute end-5 top-5 hidden items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-sand-700 shadow-card sm:flex">
            <ShieldCheck className="h-4 w-4 text-sun-600" strokeWidth={2} aria-hidden />
            {t('landing.heroTrustChip')}
          </div>

          {/* full-cover play affordance — clicking the hero opens the demo video */}
          <button
            type="button"
            onClick={() => setVideoOpen(true)}
            aria-label={t('common.watchDemo')}
            className="absolute inset-0 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-sun-500/60"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/85 text-sand-900 shadow-elevated backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
              <Play className="ms-1 h-8 w-8 fill-current" strokeWidth={0} aria-hidden />
            </span>
          </button>
        </div>
      </ScrollTilt>

      <VideoLightbox
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        title={t('common.videoTitle')}
        mp4="/media/marketing.mp4"
        webm="/media/marketing.webm"
        poster="/media/marketing-poster.jpg"
      />
    </section>
  );
}

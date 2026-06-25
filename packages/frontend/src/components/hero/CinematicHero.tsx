import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ArrowRight, Star, Play } from 'lucide-react';
import { siteUrl } from '../../lib/api';
import { Logo } from '../Logo';
import { Magnetic } from '../motion';
import type { IntroPhase } from '../../lib/useIntro';

const MP4 = '/media/hero-car.mp4';
const WEBM = '/media/hero-car.webm';
const POSTER = '/media/hero-car-poster.jpg';

export function CinematicHero({
  phase,
  reduced,
  onStart,
  onFinish,
}: {
  phase: IntroPhase;
  reduced: boolean;
  onStart: () => void;
  onFinish: () => void;
}) {
  const { t } = useTranslation();
  const overlayRef = useRef<HTMLDivElement>(null);
  const gateRef = useRef<HTMLDivElement>(null);
  const overlayVideoRef = useRef<HTMLVideoElement>(null);

  const show = phase !== 'gate'; // reveal hero content once the lesson begins
  const showOverlay = phase !== 'revealed' && !reduced;

  // Silent drive-in choreography once the user begins. No audio — the user
  // explicitly removed the engine sound; this is a calm cinematic reveal.
  useEffect(() => {
    if (phase !== 'driving') return;
    const ov = overlayRef.current;
    const vid = overlayVideoRef.current;
    const gate = gateRef.current;
    vid?.play().catch(() => {});

    const tl = gsap.timeline({ onComplete: onFinish });
    if (gate) tl.to(gate, { autoAlpha: 0, y: -18, duration: 0.5, ease: 'power2.out' }, 0);
    if (vid) tl.fromTo(vid, { scale: 1.08, filter: 'brightness(1.12)' }, { scale: 1, filter: 'brightness(1)', duration: 2.6, ease: 'power2.out' }, 0);
    if (ov) tl.to(ov, { autoAlpha: 0, duration: 0.8, ease: 'power2.inOut' }, 2.7);
    return () => {
      tl.kill();
    };
  }, [phase, onFinish]);

  const handleStart = () => onStart();

  const R = ({ i = 0, className, children }: { i?: number; className?: string; children: ReactNode }) => (
    <div
      className={className}
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'none' : 'translateY(24px)',
        transition: 'opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1)',
        transitionDelay: `${i * 90}ms`,
      }}
    >
      {children}
    </div>
  );

  return (
    <>
    <section className="relative isolate min-h-[92vh] overflow-hidden bg-sand-950 text-white">
      {/* Cinematic background — darkened still of the lesson, kept static for
          legibility behind the headline (the moving clip lives in the intro). */}
      <div className="absolute inset-0 -z-10">
        <img src={POSTER} alt="" className="h-full w-full object-cover" />
        {/* legibility + clay grade */}
        <div className="absolute inset-0 bg-gradient-to-t from-sand-950 via-sand-950/70 to-sand-950/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-sand-950/90 via-sand-950/45 to-sand-950/20" />
        <div className="absolute inset-0 mix-blend-soft-light" style={{ background: 'linear-gradient(120deg, rgba(168,96,79,0.30), transparent 55%, rgba(86,31,26,0.28))' }} />
        <div className="pointer-events-none absolute inset-0 bg-grain opacity-[0.12]" />
      </div>

      {/* Hero content */}
      <div className="mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-center px-5 pb-24 pt-28">
        <div className="max-w-2xl">
          <R i={0}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-sand-100 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-sun-300" /> {t('landing.eyebrow')}
            </span>
          </R>
          <R i={1}>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.0] tracking-tightest text-white sm:text-6xl lg:text-[5.2rem]">
              {t('landing.heroTitlePre')}
              <br className="hidden sm:block" />{' '}
              <span className="text-clay-accent-light">{t('landing.heroTitleAccent')}</span>
            </h1>
          </R>
          <R i={2}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-sand-200">{t('landing.heroLead')}</p>
          </R>
          <R i={3}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Magnetic>
                <Link to="/builder" className="btn-sun px-7 py-4 text-base">
                  {t('landing.ctaButton')} <ArrowRight className="h-4 w-4" />
                </Link>
              </Magnetic>
              <a
                href={siteUrl('davids-driving')}
                target="_blank"
                rel="noreferrer"
                className="btn border border-white/25 bg-white/10 px-7 py-4 text-base text-white backdrop-blur-md hover:bg-white/20"
              >
                {t('common.viewDemo')}
              </a>
            </div>
          </R>
          <R i={4}>
            <div className="mt-9 flex items-center gap-4">
              <div className="flex items-center gap-0.5 text-sun-300">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-sm font-medium text-sand-200">{t('landing.heroNote')}</p>
            </div>
          </R>
        </div>
      </div>
    </section>

      {/* ---- Intro gate overlay (rendered at root so it covers nav + page) ---- */}
      {showOverlay && (
        <div ref={overlayRef} className="fixed inset-0 z-[90] overflow-hidden bg-sand-950">
          {/* Paused on the poster until the user presses Start — the car/lesson
              is visibly still in the first place, then comes to life on start. */}
          <video
            ref={overlayVideoRef}
            className="absolute inset-0 h-full w-full object-cover"
            poster={POSTER}
            muted
            playsInline
            preload="auto"
          >
            <source src={WEBM} type="video/webm" />
            <source src={MP4} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-sand-950/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-sand-950 via-transparent to-sand-950/45" />
          <div className="pointer-events-none absolute inset-0 bg-grain opacity-[0.12]" />

          {phase === 'gate' && (
            <div ref={gateRef} className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <Logo size="lg" invert />
              <h2 className="mt-8 max-w-xl font-display text-3xl font-semibold leading-tight tracking-tightest text-white sm:text-4xl">
                Step into the driver’s seat.
              </h2>
              <p className="mt-3 max-w-md text-sand-200">Press start and watch a real lesson come to life.</p>
              <Magnetic>
                <button
                  onClick={handleStart}
                  className="group relative mt-9 inline-flex items-center gap-3 rounded-full bg-sun-500 px-8 py-4 text-base font-semibold text-white shadow-glow ring-1 ring-white/10 transition hover:bg-sun-600 hover:-translate-y-0.5"
                >
                  <Play className="h-5 w-5 fill-current" /> Start
                </button>
              </Magnetic>
              <button onClick={onFinish} className="mt-5 text-sm font-medium text-sand-300 underline-offset-4 transition hover:text-white hover:underline">
                Skip intro
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ArrowRight, Star, Power, Volume2 } from 'lucide-react';
import { siteUrl } from '../../lib/api';
import { Logo } from '../Logo';
import { Magnetic } from '../motion';
import { playEngineStart, type EngineHandle } from '../../lib/audio';
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
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<EngineHandle | null>(null);

  const show = phase !== 'gate'; // reveal hero content once the drive-in begins
  const showOverlay = phase !== 'revealed' && !reduced;

  // Keep the background road alive (muted autoplay is always permitted).
  useEffect(() => {
    if (reduced) return;
    bgVideoRef.current?.play().catch(() => {});
  }, [reduced]);

  // Drive-in choreography once the user starts the engine.
  useEffect(() => {
    if (phase !== 'driving') return;
    const ov = overlayRef.current;
    const vid = overlayVideoRef.current;
    const gate = gateRef.current;
    vid?.play().catch(() => {});

    const tl = gsap.timeline({ onComplete: onFinish });
    if (gate) tl.to(gate, { autoAlpha: 0, y: -18, duration: 0.45, ease: 'power2.out' }, 0);
    if (vid) tl.fromTo(vid, { scale: 1.2, filter: 'brightness(1.25)' }, { scale: 1, filter: 'brightness(1)', duration: 2.6, ease: 'power2.out' }, 0);
    if (ov) tl.to(ov, { autoAlpha: 0, duration: 0.75, ease: 'power2.inOut' }, 2.65);
    return () => {
      tl.kill();
    };
  }, [phase, onFinish]);

  // Cleanup audio on unmount.
  useEffect(() => () => engineRef.current?.stop(), []);

  const handleStart = () => {
    engineRef.current = playEngineStart({ volume: 0.55 });
    onStart();
  };
  const replayEngine = () => {
    engineRef.current?.stop();
    engineRef.current = playEngineStart({ volume: 0.5 });
  };

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
      {/* Cinematic background (real footage) */}
      <div className="absolute inset-0 -z-10">
        {reduced ? (
          <img src={POSTER} alt="" className="h-full w-full object-cover" />
        ) : (
          <video
            ref={bgVideoRef}
            className="h-full w-full object-cover"
            poster={POSTER}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
          >
            <source src={WEBM} type="video/webm" />
            <source src={MP4} type="video/mp4" />
          </video>
        )}
        {/* legibility + warm grade */}
        <div className="absolute inset-0 bg-gradient-to-t from-sand-950 via-sand-950/55 to-sand-950/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-sand-950/85 via-sand-950/30 to-transparent" />
        <div className="absolute inset-0 mix-blend-soft-light" style={{ background: 'linear-gradient(120deg, rgba(249,176,33,0.28), transparent 55%, rgba(229,78,38,0.22))' }} />
        <div className="pointer-events-none absolute inset-0 bg-grain opacity-[0.12]" />
      </div>

      {/* Hero content */}
      <div className="mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-center px-5 pb-24 pt-28">
        <div className="max-w-2xl">
          <R i={0}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-sand-100 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-sun-400" /> {t('landing.eyebrow')}
            </span>
          </R>
          <R i={1}>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.0] tracking-tightest text-white sm:text-6xl lg:text-[5.2rem]">
              {t('landing.heroTitlePre')}
              <br className="hidden sm:block" />{' '}
              <span className="text-sunrise-anim">{t('landing.heroTitleAccent')}</span>
            </h1>
          </R>
          <R i={2}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-sand-200">{t('landing.heroLead')}</p>
          </R>
          <R i={3}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Magnetic>
                <Link to="/builder" className="btn-sun shine px-7 py-4 text-base">
                  {t('landing.ctaButton')} <ArrowRight className="h-4 w-4" />
                </Link>
              </Magnetic>
              <a
                href={siteUrl('davids-driving')}
                target="_blank"
                rel="noreferrer"
                className="btn border border-white/20 bg-white/10 px-7 py-4 text-base text-white backdrop-blur-md hover:bg-white/20"
              >
                {t('common.viewDemo')}
              </a>
            </div>
          </R>
          <R i={4}>
            <div className="mt-9 flex items-center gap-4">
              <div className="flex items-center gap-0.5 text-sun-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-sm font-medium text-sand-300">{t('landing.heroNote')}</p>
            </div>
          </R>
        </div>
      </div>

      {/* Persistent engine replay + scroll cue */}
      <R i={5} className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex items-center justify-between px-5">
        <button
          onClick={replayEngine}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-sand-100 backdrop-blur-md transition hover:bg-white/20"
        >
          <Volume2 className="h-3.5 w-3.5 text-sun-400" /> Rev engine
        </button>
        <span className="hidden items-center gap-2 text-xs font-medium text-sand-300 sm:inline-flex">
          <span className="h-8 w-px bg-gradient-to-b from-transparent to-sand-300/70" /> scroll
        </span>
      </R>
    </section>

      {/* ---- Intro gate overlay (rendered at root so it covers nav + page) ---- */}
      {showOverlay && (
        <div ref={overlayRef} className="fixed inset-0 z-[90] overflow-hidden bg-sand-950">
          <video
            ref={overlayVideoRef}
            className="absolute inset-0 h-full w-full object-cover"
            poster={POSTER}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
          >
            <source src={WEBM} type="video/webm" />
            <source src={MP4} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-sand-950/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-sand-950 via-transparent to-sand-950/40" />
          <div className="pointer-events-none absolute inset-0 bg-grain opacity-[0.12]" />

          {phase === 'gate' && (
            <div ref={gateRef} className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <Logo size="lg" invert />
              <h2 className="mt-8 max-w-xl font-display text-3xl font-semibold leading-tight tracking-tightest text-white sm:text-4xl">
                Start the engine.
              </h2>
              <p className="mt-3 max-w-md text-sand-300">Turn the key and watch your driving school pull up at sunrise.</p>
              <Magnetic>
                <button
                  onClick={handleStart}
                  className="group relative mt-9 inline-flex items-center gap-3 rounded-full bg-sun-500 px-8 py-4 text-base font-semibold text-white shadow-glow transition hover:bg-sun-600"
                >
                  <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-sun-500/40" />
                  <Power className="h-5 w-5" /> Start engine
                </button>
              </Magnetic>
              <button onClick={onFinish} className="mt-5 text-sm font-medium text-sand-400 underline-offset-4 transition hover:text-white hover:underline">
                Skip intro
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

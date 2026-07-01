import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useMotionValue } from 'framer-motion';
import type { EffectMeta } from '../data/effects';
import { LazyStage } from './LazyStage';
import { StageScrollContext, type StageScroll } from '../lib/stageScroll';

/** Numbered showcase section: heading (rank · name · score · difficulty · blurb) + a contained live stage.
 *  While the pointer is over the stage, wheel events scrub THIS effect (local
 *  scroll) instead of the page — move the cursor off the frame to scroll the page. */
export function EffectStage({ meta, children }: { meta: EffectMeta; children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [touched, setTouched] = useState(false);
  const [active, setActive] = useState(false); // pointer over frame (affordance)
  const progressRef = useRef(0);
  const velocityRef = useRef(0);
  const velocityMV = useMotionValue(0);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    let decayRaf = 0;
    let hideTimer = 0;
    const decay = () => {
      velocityRef.current *= 0.86;
      velocityMV.set(velocityRef.current);
      if (Math.abs(velocityRef.current) > 0.4) decayRaf = requestAnimationFrame(decay);
      else { velocityRef.current = 0; velocityMV.set(0); decayRaf = 0; }
    };
    // Non-passive so preventDefault actually stops the page (React's onWheel is passive).
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const next = Math.max(0, Math.min(1, progressRef.current + e.deltaY * 0.0016));
      progressRef.current = next;
      setProgress(next);
      setTouched(true);
      velocityRef.current += e.deltaY * 3;
      if (!decayRaf) decayRaf = requestAnimationFrame(decay);
      setActive(true);
      clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setActive(false), 800);
    };
    box.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      box.removeEventListener('wheel', onWheel);
      cancelAnimationFrame(decayRaf);
      clearTimeout(hideTimer);
    };
  }, [velocityMV]);

  const ctx = useMemo<StageScroll>(() => ({ progress, touched, velocityMV, velocityRef }), [progress, touched, velocityMV]);

  const diffColor =
    meta.difficulty === 'high' ? 'text-rose-300' : meta.difficulty === 'med' ? 'text-amber-300' : 'text-emerald-300';

  return (
    <section id={meta.id} className="scroll-mt-6 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] font-mono text-sm text-white/60">
              {String(meta.rank).padStart(2, '0')}
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{meta.name}</h2>
            <span className="chip">★ {meta.score}/100</span>
            <span className={`chip ${diffColor}`}>{meta.difficulty} effort</span>
          </div>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-white/55">{meta.blurb}</p>
          {meta.hint && <p className="mt-1.5 text-[13px] font-medium text-accent/80">→ {meta.hint}</p>}
        </header>
        <div ref={boxRef} className="stage-box" style={{ minHeight: meta.h }}>
          <StageScrollContext.Provider value={ctx}>
            <LazyStage h={meta.h}>{children}</LazyStage>
          </StageScrollContext.Provider>
          {/* local-scroll affordance: thin progress rail on the right edge */}
          <div className="pointer-events-none absolute bottom-3 right-2 top-3 w-1 overflow-hidden rounded-full bg-white/5" style={{ opacity: active ? 1 : 0, transition: 'opacity 0.3s' }}>
            <div className="w-full rounded-full bg-accent/70" style={{ height: `${progress * 100}%` }} />
          </div>
        </div>
        <p className="mt-2 text-[11px] text-white/25">Scroll wheel stays inside this frame — scrubs &amp; replays scroll-driven effects · move the cursor off the frame to scroll the page</p>
      </div>
    </section>
  );
}

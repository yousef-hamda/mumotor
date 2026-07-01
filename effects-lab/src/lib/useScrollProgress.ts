import { useEffect, useRef, useState } from 'react';
import { useStageScroll } from './stageScroll';

/**
 * Progress (0..1) for a scroll-scrubbed effect. Inside an EffectStage it reflects
 * the LOCAL wheel progress of the hovered frame (so the effect scrubs in place);
 * otherwise it falls back to the element's travel through the viewport.
 */
export function useScrollProgress<T extends HTMLElement>() {
  const stage = useStageScroll();
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (stage) return; // local stage scroll drives progress instead
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = r.height + vh;
      const p = (vh - r.top) / total;
      setProgress(Math.max(0, Math.min(1, p)));
      raf = 0;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [stage]);

  return { ref, progress: stage ? stage.progress : progress };
}

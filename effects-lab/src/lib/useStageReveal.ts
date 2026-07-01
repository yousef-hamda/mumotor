import { useEffect, useRef, useState } from 'react';
import { useStageScroll } from './stageScroll';

/**
 * Reveal trigger for entrance-style effects. Reveals when the frame scrolls into
 * view (own IntersectionObserver — more reliable than Framer's whileInView here),
 * and once the user wheel-scrolls the frame it switches to scrub mode: scroll the
 * frame up to hide, down to replay. Works without a stage too (pure in-view).
 */
export function useStageReveal<T extends HTMLElement>(threshold = 0.35) {
  const stage = useStageScroll();
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  // Before the user touches the frame's wheel → reveal on view. After → scrub by
  // frame progress (down reveals, back up to top hides for replay).
  const revealed = stage && stage.touched ? stage.progress > 0.1 : inView;
  return { ref, revealed };
}

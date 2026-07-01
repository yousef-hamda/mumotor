import { useRef } from 'react';
import { useSpring, useMotionValue } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';

/**
 * Magnetic pull toward the cursor with a spring return. Returns motion values
 * for x/y plus the handlers to spread on the element. `strength` scales the pull
 * (use a larger value on an inner label than its container for parallax depth).
 */
export function useMagnetic(strength = 0.4, max = 40) {
  const reduced = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 200, damping: 14, mass: 0.4 });
  const y = useSpring(useMotionValue(0), { stiffness: 200, damping: 14, mass: 0.4 });
  const ref = useRef<HTMLElement | null>(null);

  const onMove = (e: React.MouseEvent) => {
    if (reduced) return;
    const el = ref.current ?? (e.currentTarget as HTMLElement);
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    x.set(Math.max(-max, Math.min(max, dx * strength)));
    y.set(Math.max(-max, Math.min(max, dy * strength)));
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return { x, y, onMove, onLeave, ref };
}

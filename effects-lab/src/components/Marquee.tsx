import { useEffect, useRef } from 'react';
import { useScroll, useVelocity, useSpring, useMotionValue, useAnimationFrame, useTransform, motion } from 'framer-motion';
import { useReducedMotion } from '../lib/useReducedMotion';
import { useStageScroll } from '../lib/stageScroll';

/**
 * Infinite marquee whose speed + skew react to scroll velocity. The row wraps
 * seamlessly via a duplicated track and modulo wrapping.
 */
export function Marquee({
  children,
  baseVelocity = 4,
  className,
}: {
  children: React.ReactNode;
  baseVelocity?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const stage = useStageScroll();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const winVelocity = useVelocity(scrollY);
  const smooth = useSpring(stage ? stage.velocityMV : winVelocity, { damping: 50, stiffness: 400 });
  const factor = useTransform(smooth, [-1000, 0, 1000], [-4, 1, 4], { clamp: false });
  const skew = useTransform(smooth, [-1500, 0, 1500], [-8, 0, 8], { clamp: true });
  const dir = useRef(1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const half = useRef(0);

  useEffect(() => {
    const measure = () => { if (wrapRef.current) half.current = wrapRef.current.scrollWidth / 2; };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (reduced) return;
    let move = dir.current * baseVelocity * (delta / 1000);
    const f = factor.get();
    if (f < 0) dir.current = -1;
    else if (f > 0) dir.current = 1;
    move += baseX.get() * 0 + dir.current * Math.abs(f) * baseVelocity * (delta / 1000);
    let next = baseX.get() + move;
    const w = half.current || 1;
    if (next <= -w) next += w;
    if (next > 0) next -= w;
    baseX.set(next);
  });

  return (
    <div className={`overflow-hidden ${className ?? ''}`}>
      <motion.div ref={wrapRef} className="flex w-max whitespace-nowrap" style={{ x: baseX, skewX: reduced ? 0 : skew }}>
        <div className="flex">{children}</div>
        <div className="flex" aria-hidden>{children}</div>
      </motion.div>
    </div>
  );
}

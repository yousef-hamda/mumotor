import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useReducedMotion, useIsTouch } from '../lib/useReducedMotion';

export default function MagneticCursor() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const touch = useIsTouch();
  const enabled = !reduced && !touch;

  const spring = { stiffness: 350, damping: 30, mass: 0.5 };
  const x = useSpring(useMotionValue(0), spring);
  const y = useSpring(useMotionValue(0), spring);
  const w = useSpring(useMotionValue(18), spring);
  const h = useSpring(useMotionValue(18), spring);
  const radius = useSpring(useMotionValue(9), spring);
  const locked = useRef<DOMRect | null>(null);
  const wrapRect = useRef<DOMRect | null>(null);

  const onMove = (e: React.PointerEvent) => {
    if (!enabled) return;
    const base = wrapRect.current ?? (wrapRect.current = wrapRef.current!.getBoundingClientRect());
    if (locked.current) {
      const t = locked.current;
      x.set(t.left - base.left + t.width / 2);
      y.set(t.top - base.top + t.height / 2);
    } else {
      x.set(e.clientX - base.left);
      y.set(e.clientY - base.top);
    }
  };
  const lockTo = (el: HTMLElement) => {
    if (!enabled) return;
    const r = el.getBoundingClientRect();
    locked.current = r;
    w.set(r.width + 16); h.set(r.height + 16); radius.set(16);
  };
  const unlock = () => { locked.current = null; w.set(18); h.set(18); radius.set(9); };

  const Target = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <button
      onPointerEnter={(e) => lockTo(e.currentTarget)}
      onPointerLeave={unlock}
      className={`pointer-events-auto rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/30 ${className ?? ''}`}
    >
      {children}
    </button>
  );

  return (
    <div
      ref={wrapRef}
      onPointerMove={onMove}
      onPointerLeave={() => { wrapRect.current = null; }}
      className={`relative grid h-[440px] w-full place-items-center overflow-hidden ${enabled ? 'cursor-none' : ''}`}
      style={{ background: 'radial-gradient(120% 120% at 50% 30%, #101626, #06070d)' }}
    >
      <div className="flex flex-wrap items-center justify-center gap-5">
        <Target>Book a lesson</Target>
        <Target className="!px-10">Packages</Target>
        <Target>Reviews</Target>
        <Target className="!py-5">Contact us</Target>
      </div>
      {enabled && (
        <motion.div
          className="pointer-events-none absolute left-0 top-0 z-20 mix-blend-difference"
          style={{ x, y, width: w, height: h, borderRadius: radius, translateX: '-50%', translateY: '-50%', background: '#fff' }}
        />
      )}
      <div className="pointer-events-none absolute bottom-4 left-5 text-xs font-medium text-white/45">
        {enabled ? 'The cursor morphs onto each target' : 'Pointer effect disabled (touch / reduced-motion)'}
      </div>
    </div>
  );
}

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useReducedMotion, useIsTouch } from '../lib/useReducedMotion';

// A white blob with mix-blend-mode: difference that auto-inverts whatever's
// beneath it — perfect contrast over black, white or photos — and expands into a
// labelled disc over interactive targets.
export default function DifferenceCursor() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const touch = useIsTouch();
  const enabled = !reduced && !touch;
  const x = useSpring(useMotionValue(0), { stiffness: 500, damping: 40 });
  const y = useSpring(useMotionValue(0), { stiffness: 500, damping: 40 });
  const [big, setBig] = useState(false);

  const onMove = (e: React.PointerEvent) => {
    if (!enabled) return;
    const r = wrapRef.current!.getBoundingClientRect();
    x.set(e.clientX - r.left); y.set(e.clientY - r.top);
  };

  return (
    <div
      ref={wrapRef}
      onPointerMove={onMove}
      className={`relative h-[440px] w-full overflow-hidden ${enabled ? 'cursor-none' : ''}`}
    >
      {/* contrasting bands so the invert is visible */}
      <div className="grid h-full grid-cols-2">
        <div className="grid place-items-center bg-white"><span className="text-3xl font-bold text-black">light side</span></div>
        <div className="grid place-items-center bg-black"><span className="text-3xl font-bold text-white">dark side</span></div>
      </div>
      <div className="absolute inset-x-0 top-1/2 grid -translate-y-1/2 place-items-center">
        <button
          onMouseEnter={() => setBig(true)}
          onMouseLeave={() => setBig(false)}
          className="rounded-full border-2 border-current px-8 py-3 text-lg font-bold text-accent"
        >
          hover me
        </button>
      </div>
      {enabled && (
        <motion.div
          className="pointer-events-none absolute left-0 top-0 z-30 grid place-items-center rounded-full bg-white text-xs font-bold text-black"
          style={{ x, y, translateX: '-50%', translateY: '-50%', mixBlendMode: 'difference' }}
          animate={{ width: big ? 80 : 22, height: big ? 80 : 22 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {big ? 'VIEW' : ''}
        </motion.div>
      )}
    </div>
  );
}

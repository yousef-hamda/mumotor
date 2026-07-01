import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { useReducedMotion, useIsTouch } from '../lib/useReducedMotion';
import { DRIVE_IMAGES } from '../assets/images';

type Ctx = { label: string; color: string } | null;

// The cursor expands into a filled disc carrying a context word — "VIEW" over
// projects, "DRAG" over sliders, "PLAY" over video — a UX affordance system, not
// decoration.
export default function ContextualCursor() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const touch = useIsTouch();
  const enabled = !reduced && !touch;
  const x = useSpring(useMotionValue(0), { stiffness: 400, damping: 32 });
  const y = useSpring(useMotionValue(0), { stiffness: 400, damping: 32 });
  const [ctx, setCtx] = useState<Ctx>(null);

  const onMove = (e: React.PointerEvent) => {
    if (!enabled) return;
    const r = wrapRef.current!.getBoundingClientRect();
    x.set(e.clientX - r.left); y.set(e.clientY - r.top);
  };

  const Zone = ({ label, color, className, children }: { label: string; color: string; className?: string; children: React.ReactNode }) => (
    <div onPointerEnter={() => setCtx({ label, color })} onPointerLeave={() => setCtx(null)} className={className}>{children}</div>
  );

  return (
    <div ref={wrapRef} onPointerMove={onMove} className={`relative grid h-[440px] w-full grid-cols-3 gap-4 p-6 ${enabled ? 'cursor-none' : ''}`} style={{ background: '#06070d' }}>
      <Zone label="VIEW" color="#5ea8f2" className="col-span-2 overflow-hidden rounded-2xl">
        <img src={DRIVE_IMAGES[2]} alt="" className="h-full w-full object-cover" />
      </Zone>
      <div className="flex flex-col gap-4">
        <Zone label="PLAY" color="#34d399" className="grid flex-1 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-300">▶ video</Zone>
        <Zone label="DRAG" color="#f59e0b" className="grid flex-1 place-items-center rounded-2xl bg-amber-500/10 text-amber-300">↔ slider</Zone>
      </div>
      {enabled && (
        <motion.div className="pointer-events-none absolute left-0 top-0 z-30 grid place-items-center rounded-full text-xs font-bold text-black" style={{ x, y, translateX: '-50%', translateY: '-50%', background: ctx?.color ?? '#fff' }} animate={{ width: ctx ? 64 : 14, height: ctx ? 64 : 14 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}>
          <AnimatePresence>{ctx && <motion.span key={ctx.label} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>{ctx.label}</motion.span>}</AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

let rid = 0;

// Disney's squash-&-stretch applied with restraint: a press briefly squashes the
// element then overshoots back through a spring, with a ripple that originates
// exactly at the click point. A "haptic-feel" press.
function SquashButton({ label, primary }: { label: string; primary?: boolean }) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const onDown = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    const id = ++rid;
    setRipples((rs) => [...rs, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setRipples((rs) => rs.filter((x) => x.id !== id)), 600);
  };
  return (
    <motion.button
      onPointerDown={onDown}
      whileTap={{ scaleX: 1.06, scaleY: 0.9 }}
      transition={{ type: 'spring', stiffness: 600, damping: 14 }}
      className={`relative overflow-hidden rounded-2xl px-8 py-4 text-base font-semibold ${primary ? 'bg-accent text-black' : 'border border-white/20 bg-white/[0.04] text-white'}`}
    >
      <span className="relative z-10">{label}</span>
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            className="pointer-events-none absolute rounded-full"
            style={{ left: r.x, top: r.y, background: primary ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)' }}
            initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.6 }}
            animate={{ width: 320, height: 320, x: -160, y: -160, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </motion.button>
  );
}

export default function SquashRipple() {
  return (
    <div className="grid h-[440px] w-full place-items-center" style={{ background: 'radial-gradient(120% 120% at 50% 30%, #101626, #06070d)' }}>
      <div className="flex flex-wrap items-center justify-center gap-5">
        <SquashButton label="Book now" primary />
        <SquashButton label="See packages" />
        <SquashButton label="Call us" />
      </div>
    </div>
  );
}

import { useRef } from 'react';
import { motion } from 'framer-motion';

const CHIPS = [
  { t: 'Manual', c: '#5ea8f2' }, { t: 'Automatic', c: '#a78bfa' }, { t: 'Intensive', c: '#34d399' },
  { t: 'Refresher', c: '#f59e0b' }, { t: 'Motorway', c: '#f472b6' }, { t: 'Pass Plus', c: '#22d3ee' },
];

// Throwable cards: fling them and they keep gliding with momentum, decelerate
// naturally, and rubber-band off the walls. Native-feeling inertial physics.
export default function SpringDrag() {
  const bounds = useRef<HTMLDivElement>(null);
  return (
    <div className="relative h-[440px] w-full" style={{ background: 'radial-gradient(120% 120% at 50% 30%, #0c1220, #06070d)' }}>
      <div ref={bounds} className="absolute inset-6 rounded-2xl border border-dashed border-white/10">
        {CHIPS.map((chip, i) => (
          <motion.div
            key={chip.t}
            drag
            dragConstraints={bounds}
            dragElastic={0.18}
            dragTransition={{ power: 0.35, timeConstant: 220, bounceStiffness: 400, bounceDamping: 28 }}
            whileDrag={{ scale: 1.08, cursor: 'grabbing' }}
            className="absolute cursor-grab select-none rounded-2xl px-5 py-3 text-base font-bold text-black shadow-xl"
            style={{ background: chip.c, left: 24 + (i % 3) * 130, top: 24 + Math.floor(i / 3) * 120 }}
          >
            {chip.t}
          </motion.div>
        ))}
      </div>
      <div className="pointer-events-none absolute bottom-4 left-7 text-xs font-medium text-white/45">Fling the chips — they glide, then bounce off the edges</div>
    </div>
  );
}

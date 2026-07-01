import { useEffect } from 'react';
import { motion, useSpring } from 'framer-motion';
import { useStageReveal } from '../lib/useStageReveal';

const H = 56; // digit cell height in px

function Digit({ digit }: { digit: number }) {
  const y = useSpring(0, { stiffness: 90, damping: 18 });
  useEffect(() => { y.set(-digit * H); }, [digit, y]);
  return (
    <div className="relative overflow-hidden" style={{ height: H, width: '0.62em' }}>
      <motion.div style={{ y }}>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="grid place-items-center" style={{ height: H }}>{i}</div>
        ))}
      </motion.div>
    </div>
  );
}

function Roll({ value, places }: { value: number; places: number }) {
  const digits = String(Math.round(value)).padStart(places, '0').split('').map(Number);
  return (
    <div className="flex font-mono text-5xl font-bold tabular-nums text-white" style={{ lineHeight: `${H}px` }}>
      {digits.map((d, i) => <Digit key={i} digit={d} />)}
    </div>
  );
}

const STATS = [
  { target: 92, suffix: '%', label: 'First-time pass rate' },
  { target: 1240, suffix: '+', label: 'Drivers licensed' },
  { target: 15, suffix: 'yr', label: 'Teaching experience' },
];

export default function Odometer() {
  const { ref, revealed: shown } = useStageReveal<HTMLDivElement>(0.6);
  return (
    <div
      ref={ref}
      className="grid h-[440px] w-full place-items-center"
      style={{ background: 'radial-gradient(120% 120% at 50% 30%, #0e1430, #06070d)' }}
    >
      <div className="grid grid-cols-3 gap-10 text-center">
        {STATS.map((s) => (
          <div key={s.label}>
            <div className="flex items-baseline justify-center">
              <Roll value={shown ? s.target : 0} places={String(s.target).length} />
              <span className="ml-1 text-3xl font-bold text-accent">{s.suffix}</span>
            </div>
            <div className="mt-3 text-sm text-white/50">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { motion, useScroll, useVelocity, useSpring, useTransform } from 'framer-motion';
import { useReducedMotion } from '../lib/useReducedMotion';
import { useStageScroll } from '../lib/stageScroll';

const ITEMS = ['Clutch control', 'Hill starts', 'Roundabouts', 'Parallel parking', 'Motorway merges', 'Night driving', 'Mock test', 'The real thing'];

// Content subtly skews and stretches in the scroll direction proportional to
// speed, then springs back to flat when you stop — mass and momentum, no WebGL.
export default function ScrollSkewList() {
  const reduced = useReducedMotion();
  const stage = useStageScroll();
  const { scrollY } = useScroll();
  const winV = useVelocity(scrollY);
  const sv = useSpring(stage ? stage.velocityMV : winV, { damping: 50, stiffness: 350 });
  const skewY = useTransform(sv, [-2000, 0, 2000], [-7, 0, 7], { clamp: true });
  const scaleY = useTransform(sv, [-2000, 0, 2000], [1.06, 1, 1.06], { clamp: true });

  return (
    <div className="grid h-[440px] w-full place-items-center px-6" style={{ background: 'radial-gradient(120% 120% at 50% 30%, #0e1430, #06070d)' }}>
      <motion.div style={{ skewY: reduced ? 0 : skewY, scaleY: reduced ? 1 : scaleY }} className="w-full max-w-md space-y-2.5">
        {ITEMS.map((it, i) => (
          <div key={it} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3">
            <span className="font-mono text-xs text-accent">{String(i + 1).padStart(2, '0')}</span>
            <span className="text-white/85">{it}</span>
          </div>
        ))}
      </motion.div>
      <p className="mt-4 text-xs text-white/40">Scroll the page fast — the list skews with momentum, then settles.</p>
    </div>
  );
}

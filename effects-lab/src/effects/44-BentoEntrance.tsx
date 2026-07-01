import { motion } from 'framer-motion';
import { useStageReveal } from '../lib/useStageReveal';

const TILES = [
  { t: 'Your site, live', span: 'col-span-2 row-span-2', tint: '#5ea8f2' },
  { t: 'Bookings', span: '', tint: '#a78bfa' },
  { t: 'Reviews', span: '', tint: '#34d399' },
  { t: 'WhatsApp', span: '', tint: '#f59e0b' },
  { t: 'Payments', span: 'col-span-2', tint: '#f472b6' },
  { t: 'Areas map', span: '', tint: '#22d3ee' },
];

// A bento layout whose tiles cascade in with a directional stagger (scale +
// blur-in + translate), reading top-left → bottom-right, then settle.
export default function BentoEntrance() {
  const { ref, revealed } = useStageReveal<HTMLDivElement>();
  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={revealed ? 'show' : 'hidden'}
      transition={{ staggerChildren: 0.08 }}
      className="grid h-[440px] w-full grid-cols-4 grid-rows-3 gap-3 p-6"
      style={{ background: 'radial-gradient(120% 120% at 50% 0%, #0c1220, #06070d)' }}
    >
      {TILES.map((tile, i) => (
        <motion.div
          key={i}
          variants={{ hidden: { opacity: 0, y: 26, scale: 0.92, filter: 'blur(8px)' }, show: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' } }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -4 }}
          className={`relative overflow-hidden rounded-2xl border border-white/10 p-4 ${tile.span}`}
          style={{ background: `linear-gradient(150deg, ${tile.tint}22, #0c0e16)` }}
        >
          <div className="absolute right-3 top-3 h-2 w-2 rounded-full" style={{ background: tile.tint }} />
          <div className="absolute bottom-3 left-4 text-sm font-semibold text-white">{tile.t}</div>
        </motion.div>
      ))}
    </motion.div>
  );
}

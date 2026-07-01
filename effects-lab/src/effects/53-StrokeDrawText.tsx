import { motion } from 'framer-motion';
import { useStageReveal } from '../lib/useStageReveal';

const LEN = 2400;

// Letters appear to write themselves — outlined strokes trace on, then flood-fill
// with colour. (SVG <text> stroke-dash → fill; replays when scrolled into view.)
export default function StrokeDrawText() {
  const { ref, revealed } = useStageReveal<HTMLDivElement>(0.6);
  return (
    <div ref={ref} className="grid h-[440px] w-full place-items-center" style={{ background: 'radial-gradient(120% 120% at 50% 30%, #101a2e, #06070d)' }}>
      <svg viewBox="0 0 600 200" className="w-[min(560px,90%)]">
        <motion.text
          x="300" y="130" textAnchor="middle"
          fontSize="140" fontWeight="800" fontFamily='"Roboto Flex", system-ui, sans-serif'
          fill="var(--accent)" stroke="var(--accent)" strokeWidth="1.5"
          strokeDasharray={LEN}
          initial={false}
          animate={{ strokeDashoffset: revealed ? 0 : LEN, fillOpacity: revealed ? 1 : 0 }}
          transition={{ strokeDashoffset: { duration: 1.8, ease: 'easeInOut' }, fillOpacity: { delay: revealed ? 1.5 : 0, duration: 0.6 } }}
        >
          drive.
        </motion.text>
      </svg>
      <p className="-mt-6 text-xs text-white/40">Scroll inside this frame (down to write, up to replay).</p>
    </div>
  );
}

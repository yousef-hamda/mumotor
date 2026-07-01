import { motion } from 'framer-motion';
import { useMagnetic } from '../lib/useMagnetic';

function MagneticButton({ label, primary }: { label: string; primary?: boolean }) {
  const pill = useMagnetic(0.35, 34);
  const text = useMagnetic(0.55, 50); // inner label leans further → parallax depth
  return (
    <motion.button
      onMouseMove={(e) => { pill.onMove(e); text.onMove(e); }}
      onMouseLeave={() => { pill.onLeave(); text.onLeave(); }}
      style={{ x: pill.x, y: pill.y }}
      whileTap={{ scale: 0.96 }}
      className={`relative rounded-full px-8 py-4 text-base font-semibold ${
        primary ? 'bg-accent text-black' : 'border border-white/20 bg-white/[0.04] text-white'
      }`}
    >
      <motion.span style={{ x: text.x, y: text.y, display: 'inline-block' }}>{label}</motion.span>
    </motion.button>
  );
}

export default function MagneticButtons() {
  return (
    <div className="grid h-[440px] w-full place-items-center" style={{ background: 'radial-gradient(120% 120% at 50% 30%, #101626, #06070d)' }}>
      <div className="flex flex-wrap items-center justify-center gap-6">
        <MagneticButton label="Book a lesson" primary />
        <MagneticButton label="View packages" />
        <MagneticButton label="Call now" />
      </div>
    </div>
  );
}

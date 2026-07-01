import { motion } from 'framer-motion';
import { useStageReveal } from '../lib/useStageReveal';

// The Linear "lamp": two angled conic beams converge into a glowing filament
// line that ignites, and the heading fades up out of the light.
export default function LampReveal() {
  const { ref, revealed } = useStageReveal<HTMLDivElement>(0.5);
  return (
    <div ref={ref} className="relative grid h-[440px] w-full place-items-center overflow-hidden" style={{ background: '#06070d' }}>
      <div className="relative flex w-full flex-col items-center" style={{ marginTop: 40 }}>
        {/* beams */}
        <motion.div
          initial={false}
          animate={{ opacity: revealed ? 1 : 0, width: revealed ? '20rem' : '8rem' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute top-0 h-56"
          style={{ background: 'conic-gradient(from 90deg at 50% 0%, transparent 60%, #5ea8f2 80%, transparent)', filter: 'blur(40px)', transformOrigin: 'top' }}
        />
        {/* filament line */}
        <motion.div
          initial={false}
          animate={{ width: revealed ? '18rem' : '6rem', opacity: revealed ? 1 : 0.4 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="z-10 h-[3px] rounded-full bg-accent"
          style={{ boxShadow: '0 0 24px 6px rgba(94,168,242,0.7)' }}
        />
        <div className="z-10 mt-8 px-6 text-center">
          <motion.h3
            initial={false}
            animate={{ y: revealed ? 0 : 60, opacity: revealed ? 1 : 0 }}
            transition={{ duration: 0.7, delay: revealed ? 0.15 : 0, ease: [0.22, 1, 0.36, 1] }}
            className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl"
          >
            Built to turn on.
          </motion.h3>
          <motion.p initial={false} animate={{ opacity: revealed ? 1 : 0 }} transition={{ delay: revealed ? 0.4 : 0 }} className="mt-3 text-white/50">
            Scroll inside this frame to ignite it (up to reset).
          </motion.p>
        </div>
      </div>
    </div>
  );
}

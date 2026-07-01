import { motion } from 'framer-motion';
import { useStageReveal } from '../lib/useStageReveal';

const LINES = ['Learn to drive', 'with calm,', 'patient lessons.'];
const SUB = 'Every line wipes up from behind a hard mask edge — the difference between “designed” and “default”.';

export default function MaskedLineReveal() {
  const { ref, revealed } = useStageReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="grid h-[440px] w-full place-items-center px-8" style={{ background: 'radial-gradient(120% 120% at 50% 20%, #101626, #06070d)' }}>
      <div>
        <motion.div initial={false} animate={revealed ? 'show' : 'hidden'} transition={{ staggerChildren: 0.12 }}>
          {LINES.map((line, i) => (
            <div key={i} className="overflow-hidden">
              <motion.h3
                variants={{ hidden: { y: '110%' }, show: { y: '0%' } }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl font-semibold tracking-tight text-white sm:text-5xl"
              >
                {line}
              </motion.h3>
            </div>
          ))}
        </motion.div>
        <div className="mt-5 overflow-hidden">
          <motion.p
            initial={false}
            animate={{ y: revealed ? '0%' : '110%' }}
            transition={{ duration: 0.7, delay: revealed ? 0.4 : 0, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-md text-sm text-white/50"
          >
            {SUB}
          </motion.p>
        </div>
        <p className="mt-8 text-xs text-white/30">Scroll inside this frame (down to reveal, up to replay).</p>
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { useStageReveal } from '../lib/useStageReveal';

const TEXT = 'Pass with confidence';

// Letters pop in individually on a spring with a touch of overshoot and rotation,
// cascading across the word so it bounces into place with personality.
export default function CharSpring() {
  const { ref, revealed } = useStageReveal<HTMLDivElement>(0.6);
  return (
    <div ref={ref} className="grid h-[440px] w-full place-items-center px-6" style={{ background: 'radial-gradient(120% 120% at 50% 30%, #101626, #06070d)' }}>
      <div>
        <motion.h3
          aria-label={TEXT}
          initial={false}
          animate={revealed ? 'show' : 'hidden'}
          transition={{ staggerChildren: 0.04 }}
          className="text-center text-5xl font-bold tracking-tight text-white sm:text-6xl"
          style={{ perspective: '600px' }}
        >
          {TEXT.split('').map((ch, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="inline-block"
              variants={{ hidden: { y: 40, opacity: 0, rotateX: -90, scale: 0.6 }, show: { y: 0, opacity: 1, rotateX: 0, scale: 1 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 16 }}
            >
              {ch === ' ' ? ' ' : ch}
            </motion.span>
          ))}
        </motion.h3>
        <p className="mt-8 text-center text-xs text-white/30">Scroll inside this frame (down to reveal, up to replay).</p>
      </div>
    </div>
  );
}

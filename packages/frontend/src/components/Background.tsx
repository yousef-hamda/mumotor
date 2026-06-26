import { motion, useScroll, useTransform } from 'framer-motion';
import { usePrefersReducedMotion } from './motion';

/**
 * Creative, premium site background: a clean white base with soft blue "aurora"
 * orbs and a faint top grid. The orbs drift slowly (CSS) and parallax gently on
 * scroll (framer-motion) for subtle depth. Fixed and non-interactive so it sits
 * calmly behind all content. Respects reduced-motion.
 */
export function Background() {
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -80]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-white" aria-hidden>
      {/* faint structural grid, fading out below the fold */}
      <div className="absolute inset-0 bg-grid-fine" />

      {/* soft blue aurora orbs */}
      <motion.div
        style={reduced ? undefined : { y: y1 }}
        className="aurora-orb aurora-animate absolute -top-32 -start-24 h-[34rem] w-[34rem]"
      >
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle,#60A5FA_0%,transparent_70%)]" />
      </motion.div>
      <motion.div
        style={reduced ? undefined : { y: y2 }}
        className="aurora-orb aurora-animate absolute -top-10 end-[-8rem] h-[30rem] w-[30rem]"
        // slight stagger so the two orbs don't move in lockstep
      >
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle,#93C5FD_0%,transparent_70%)]" />
      </motion.div>
      <motion.div
        style={reduced ? undefined : { y: y3 }}
        className="aurora-orb absolute top-[42rem] start-1/3 h-[26rem] w-[26rem] opacity-40"
      >
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle,#A5B4FC_0%,transparent_70%)]" />
      </motion.div>
    </div>
  );
}

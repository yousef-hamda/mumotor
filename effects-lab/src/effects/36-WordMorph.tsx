import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '../lib/useReducedMotion';

const WORDS = ['Manual', 'Automatic', 'Test-ready', 'Confident', 'Licensed'];

// One word melts and reforms into the next — two blurred layers merging under an
// SVG goo threshold, like liquid metal cycling through your value props.
export default function WordMorph() {
  const [i, setI] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setI((v) => (v + 1) % WORDS.length), 2000);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <div className="grid h-[440px] w-full place-items-center" style={{ background: 'radial-gradient(120% 120% at 50% 30%, #101a30, #06070d)' }}>
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="goo-morph">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b" />
            <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8" result="goo" />
            <feBlend in="goo" in2="SourceGraphic" />
          </filter>
        </defs>
      </svg>
      <div className="text-center">
        <div className="text-sm font-semibold uppercase tracking-widest text-white/40">We make you</div>
        <div className="relative mt-2 grid h-24 place-items-center" style={{ filter: reduced ? 'none' : 'url(#goo-morph)' }}>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.8, filter: 'blur(4px)', position: 'absolute' }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="text-6xl font-extrabold tracking-tight text-accent sm:text-7xl"
            >
              {WORDS[i]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

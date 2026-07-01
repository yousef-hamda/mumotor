import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// A loader that doesn't just fade — it HANDS OFF: the counter climbs, the panel
// lifts like a curtain, and the hero's headline staggers in on the same beat.
export default function PreloaderHandoff() {
  const [runId, setRunId] = useState(0);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    setDone(false);
    setCount(0);
    const start = performance.now();
    const DUR = 1600;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DUR);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * 100));
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else setTimeout(() => setDone(true), 180);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [runId]);

  const words = ['Pass', 'first', 'time.'];

  return (
    <div className="relative h-[460px] w-full overflow-hidden" style={{ background: 'linear-gradient(135deg,#0a1430,#1a0e32)' }}>
      {/* hero */}
      <div className="absolute inset-0 grid place-items-center px-6 text-center">
        <div>
          <h3 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
            {words.map((w, i) => (
              <motion.span
                key={`${runId}-${i}`}
                className="mr-3 inline-block"
                initial={{ y: 40, opacity: 0 }}
                animate={done ? { y: 0, opacity: 1 } : {}}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                {w}
              </motion.span>
            ))}
          </h3>
          <motion.p
            className="mt-3 text-white/60"
            initial={{ opacity: 0 }}
            animate={done ? { opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Calm lessons. Confident drivers.
          </motion.p>
          <motion.button
            onClick={() => setRunId((r) => r + 1)}
            initial={{ opacity: 0 }}
            animate={done ? { opacity: 1 } : {}}
            transition={{ delay: 0.7 }}
            className="mt-6 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-black hover:opacity-90"
          >
            ↻ Replay intro
          </motion.button>
        </div>
      </div>

      {/* loader curtain */}
      <AnimatePresence>
        {!done && (
          <motion.div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#06070d]"
            initial={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="font-mono text-7xl font-bold text-white tabular-nums">{count}</div>
            <div className="mt-4 h-[3px] w-56 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-accent" style={{ width: `${count}%` }} />
            </div>
            <div className="mt-3 text-xs uppercase tracking-widest text-white/40">Loading your route</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

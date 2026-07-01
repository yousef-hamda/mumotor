import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const TIMES = ['08:00', '09:30', '11:00', '13:00', '14:30', '16:00', '17:30', '19:00'];

export default function MorphingDrawer() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const activeRef = useRef<HTMLDivElement | null>(null);

  // Measure the active view and morph the container height to match.
  useLayoutEffect(() => {
    const node = activeRef.current;
    if (!node) return;
    const apply = () => setHeight(node.offsetHeight);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(node);
    return () => ro.disconnect();
  }, [step]);

  const go = (next: number) => { setDir(next > step ? 1 : -1); setStep(next); };

  const views = [
    {
      title: 'Choose a package',
      body: (
        <div className="space-y-2">
          {['Starter · 10 lessons', 'Pass · 20 lessons', 'Intensive · 2 weeks'].map((p) => (
            <button key={p} onClick={() => go(1)} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-white/85 hover:border-accent/50 hover:bg-white/[0.06]">
              {p} <span className="text-accent">→</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Pick a time',
      body: (
        <div className="grid grid-cols-4 gap-2">
          {TIMES.map((t) => (
            <button key={t} onClick={() => go(2)} className="rounded-lg border border-white/10 bg-white/[0.03] py-2.5 text-sm text-white/80 hover:border-accent/50 hover:bg-white/[0.06]">
              {t}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Your details',
      body: (
        <div className="space-y-3">
          <input placeholder="Full name" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-accent/60 focus:outline-none" />
          <input placeholder="Phone number" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-accent/60 focus:outline-none" />
          <button onClick={() => go(3)} className="w-full rounded-full bg-accent py-3 text-sm font-semibold text-black hover:opacity-90">Confirm booking</button>
        </div>
      ),
    },
    {
      title: 'Booked!',
      body: (
        <div className="py-2 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent/20 text-2xl text-accent">✓</div>
          <p className="mt-3 text-sm text-white/70">Your first lesson is confirmed. We've sent the details to your phone.</p>
          <button onClick={() => go(0)} className="mt-4 text-sm font-medium text-accent hover:underline">Book another →</button>
        </div>
      ),
    },
  ];

  const v = views[step];

  return (
    <div className="grid h-[460px] w-full place-items-center px-6" style={{ background: 'radial-gradient(120% 120% at 50% 20%, #0f1426, #06070d)' }}>
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/12 bg-ink-800/90 shadow-2xl backdrop-blur">
        {/* header with back */}
        <div className="flex items-center gap-3 border-b border-white/8 px-5 py-3.5">
          {step > 0 && step < 3 && (
            <button onClick={() => go(step - 1)} className="text-white/50 hover:text-white" aria-label="Back">←</button>
          )}
          <div className="text-sm font-semibold text-white">{v.title}</div>
          <div className="ml-auto flex gap-1">
            {views.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-accent' : 'w-1.5 bg-white/20'}`} />
            ))}
          </div>
        </div>
        {/* morphing body */}
        <motion.div animate={{ height }} transition={{ type: 'spring', stiffness: 320, damping: 34 }} style={{ position: 'relative' }}>
          <AnimatePresence mode="popLayout" custom={dir} initial={false}>
            <motion.div
              key={step}
              ref={activeRef}
              custom={dir}
              initial={{ opacity: 0, filter: 'blur(8px)', x: dir * 24 }}
              animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
              exit={{ opacity: 0, filter: 'blur(8px)', x: dir * -24, position: 'absolute' }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="left-0 top-0 w-full p-5"
            >
              {v.body}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

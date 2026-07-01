import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const PAGES = [
  { title: 'Learn to drive', sub: 'Calm, patient lessons tailored to you.', bg: 'linear-gradient(135deg,#0a1c3a,#102a5a)', accent: '#5ea8f2' },
  { title: 'Simple pricing', sub: 'Transparent packages, no surprises.', bg: 'linear-gradient(135deg,#2a123f,#451a63)', accent: '#a78bfa' },
  { title: 'Pass with us', sub: 'A 92% first-time pass rate.', bg: 'linear-gradient(135deg,#0c2f2a,#124a40)', accent: '#34d399' },
];
const COLS = 6;
const DURATION = 1.0;

export default function CurtainTransition() {
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const timers = useRef<number[]>([]);

  const go = (to: number) => {
    if (busy || to === page) return;
    setBusy(true);
    timers.current.push(window.setTimeout(() => setPage(to), DURATION * 1000 * 0.5));
    timers.current.push(window.setTimeout(() => setBusy(false), DURATION * 1000 + COLS * 40 + 60));
  };

  const p = PAGES[page];

  return (
    <div className="relative h-[460px] w-full overflow-hidden">
      <div className="absolute inset-0 grid place-items-center px-6 text-center" style={{ background: p.bg }}>
        <div>
          <div className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{p.title}</div>
          <div className="mt-2 text-white/70">{p.sub}</div>
          <div className="mt-6 flex justify-center gap-2">
            {PAGES.map((pg, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className="rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur hover:bg-white/15"
                style={i === page ? { background: pg.accent, color: '#000', borderColor: 'transparent' } : undefined}
              >
                {['Lessons', 'Pricing', 'Results'][i]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {busy && (
          <div className="pointer-events-none absolute inset-0 flex">
            {Array.from({ length: COLS }).map((_, i) => (
              <motion.div
                key={i}
                className="h-full flex-1"
                style={{ background: '#06070d' }}
                initial={{ y: '110%' }}
                animate={{ y: ['110%', '0%', '-110%'] }}
                transition={{ duration: DURATION, times: [0, 0.45, 1], ease: ['easeIn', 'easeOut'], delay: i * 0.04 }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

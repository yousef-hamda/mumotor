import { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const TABS = ['Lessons', 'Packages', 'Areas', 'Reviews', 'Contact'];

type Rect = { left: number; width: number; center: number };

export default function GooeyNav() {
  const rowRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<HTMLButtonElement[]>([]);
  const [rects, setRects] = useState<Rect[]>([]);
  const [active, setActive] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      const row = rowRef.current;
      if (!row) return;
      const base = row.getBoundingClientRect();
      setRects(
        btnRefs.current.map((b) => {
          const r = b.getBoundingClientRect();
          return { left: r.left - base.left, width: r.width, center: r.left - base.left + r.width / 2 };
        }),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (rowRef.current) ro.observe(rowRef.current);
    return () => ro.disconnect();
  }, []);

  const activeRect = rects[active];

  return (
    <div
      className="grid h-[440px] w-full place-items-center px-6"
      style={{ background: 'radial-gradient(120% 120% at 50% 20%, #101626, #06070d)' }}
    >
      <div className="w-full max-w-xl">
        <div ref={rowRef} className="relative h-14">
          {/* gooey filter */}
          <svg width="0" height="0" className="absolute">
            <defs>
              <filter id="goo">
                <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b" />
                <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo" />
                <feBlend in="SourceGraphic" in2="goo" />
              </filter>
            </defs>
          </svg>

          {/* filtered blob layer */}
          <div className="absolute inset-0" style={{ filter: 'url(#goo)' }}>
            {rects.map((r, i) => (
              <span
                key={i}
                className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full"
                style={{ left: r.center - 6, background: i === active ? 'var(--accent)' : 'rgba(94,168,242,0.35)' }}
              />
            ))}
            {activeRect && (
              <motion.div
                className="absolute top-1/2 h-11 -translate-y-1/2 rounded-full"
                style={{ background: 'var(--accent)' }}
                animate={{ left: activeRect.left, width: activeRect.width }}
                initial={false}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              />
            )}
          </div>

          {/* crisp labels */}
          <div className="absolute inset-0 flex items-center justify-between">
            {TABS.map((t, i) => (
              <button
                key={t}
                ref={(el) => { if (el) btnRefs.current[i] = el; }}
                onClick={() => setActive(i)}
                className={`relative z-10 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                  i === active ? 'text-white' : 'text-white/55 hover:text-white/80'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-white/45">Click between tabs — the indicator stretches and necks like liquid.</p>
      </div>
    </div>
  );
}

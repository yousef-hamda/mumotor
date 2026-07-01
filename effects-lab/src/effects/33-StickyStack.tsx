import { useState } from 'react';
import { useScrollProgress } from '../lib/useScrollProgress';
import { clamp } from '../lib/raf';

const CARDS = [
  { title: 'Book', body: 'Pick a package and a time that suits you.', tint: '#5ea8f2' },
  { title: 'Learn', body: 'Calm, structured lessons at your pace.', tint: '#a78bfa' },
  { title: 'Practice', body: 'Mock tests until it feels like second nature.', tint: '#f59e0b' },
  { title: 'Pass', body: 'Walk in confident, drive away licensed.', tint: '#34d399' },
];

// A self-assembling, depth-stacked deck: as you scroll, each card scales up to
// the front while the previous recedes and dims beneath it. (Progress-driven so
// it works inside the contained stage; the production version uses position:sticky.)
export default function StickyStack() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>();
  const [override, setOverride] = useState<number | null>(null);
  const p = clamp(override ?? progress);
  const active = p * (CARDS.length - 1);

  return (
    <div ref={ref} className="relative h-[480px] w-full overflow-hidden" style={{ background: 'radial-gradient(120% 100% at 50% 0%, #101626, #06070d)' }}>
      <div className="absolute inset-0 grid place-items-center" style={{ perspective: '1000px' }}>
        {CARDS.map((c, i) => {
          const off = i - active;             // <0 passed, 0 front, >0 stacked behind
          const behind = Math.max(0, off);
          const passed = Math.max(0, -off);
          const y = behind * 26 - passed * 320;
          const scale = 1 - behind * 0.07;
          const opacity = passed > 0.8 ? 0 : 1 - behind * 0.15;
          return (
            <div
              key={i}
              className="absolute flex h-[230px] w-[min(440px,82%)] flex-col justify-between overflow-hidden rounded-3xl border border-white/12 p-7 shadow-2xl"
              style={{
                background: `linear-gradient(150deg, ${c.tint}2a, #0c0e16)`,
                transform: `translateY(${y}px) scale(${scale})`,
                filter: `brightness(${1 - behind * 0.22})`,
                opacity,
                zIndex: 10 - i,
                transition: override !== null ? 'transform 0.25s, opacity 0.25s, filter 0.25s' : 'none',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: c.tint }}>Step {i + 1}</span>
                <span className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-black" style={{ background: c.tint }}>{i + 1}</span>
              </div>
              <div>
                <div className="text-3xl font-bold tracking-tight text-white">{c.title}</div>
                <div className="mt-1.5 text-white/65">{c.body}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-4 px-6 pb-4">
        <span className="shrink-0 text-xs text-white/40">Scroll, or drag →</span>
        <input type="range" min={0} max={1} step={0.001} value={p} onChange={(e) => setOverride(parseFloat(e.target.value))} className="h-1 w-full cursor-pointer accent-[var(--accent)]" aria-label="Scrub deck" />
        {override !== null && <button onClick={() => setOverride(null)} className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20">↻</button>}
      </div>
    </div>
  );
}

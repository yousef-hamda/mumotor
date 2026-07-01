import { useState } from 'react';
import { useScrollProgress } from '../lib/useScrollProgress';
import { clamp } from '../lib/raf';

const STAGES = [
  { kicker: 'STEP 1', title: 'Pick a package', tint: '#5ea8f2', rows: ['Starter · 10', 'Pass · 20', 'Intensive'] },
  { kicker: 'STEP 2', title: 'Book your slot', tint: '#a78bfa', rows: ['Mon 09:00', 'Wed 14:30', 'Fri 17:00'] },
  { kicker: 'STEP 3', title: 'Pass first time', tint: '#34d399', rows: ['Mock test ✓', 'Test booked ✓', 'Licence 🎉'] },
];

export default function PinnedScrolly() {
  const { ref, progress: scrollP } = useScrollProgress<HTMLDivElement>();
  const [override, setOverride] = useState<number | null>(null);
  const p = override ?? scrollP;

  const stageF = clamp(p) * (STAGES.length - 1);
  const idx = Math.min(STAGES.length - 1, Math.floor(stageF));
  const frac = stageF - idx;
  const rotY = -22 + clamp(p) * 44;

  return (
    <div ref={ref} className="relative grid h-[520px] w-full place-items-center overflow-hidden" style={{ background: 'radial-gradient(130% 130% at 50% 0%, #111a30, #06070d)' }}>
      <div className="grid w-full max-w-3xl grid-cols-1 items-center gap-8 px-8 sm:grid-cols-2">
        {/* narrative */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: STAGES[idx].tint }}>{STAGES[idx].kicker}</div>
          <div className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{STAGES[idx].title}</div>
          <div className="mt-4 flex gap-1.5">
            {STAGES.map((_, i) => (
              <span key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === idx ? 28 : 8, background: i === idx ? STAGES[idx].tint : 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        </div>
        {/* phone */}
        <div className="grid place-items-center" style={{ perspective: '1200px' }}>
          <div
            className="relative h-[360px] w-[185px] rounded-[2rem] border-[6px] border-ink-700 bg-black shadow-2xl"
            style={{ transform: `rotateY(${rotY}deg) rotateX(4deg)`, transformStyle: 'preserve-3d' }}
          >
            <div className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-white/20" />
            {STAGES.map((s, i) => {
              const op = i === idx ? 1 - frac : i === idx + 1 ? frac : 0;
              if (op <= 0.01) return null;
              return (
                <div key={i} className="absolute inset-1.5 overflow-hidden rounded-[1.6rem] p-4" style={{ opacity: op, background: `linear-gradient(160deg, ${s.tint}22, #0c0e16)` }}>
                  <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: s.tint }}>{s.kicker}</div>
                  <div className="mt-1 text-base font-bold text-white">{s.title}</div>
                  <div className="mt-4 space-y-2">
                    {s.rows.map((r) => (
                      <div key={r} className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-white/85">{r}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-4 px-8 pb-4">
        <span className="shrink-0 text-xs text-white/40">Scroll, or scrub →</span>
        <input type="range" min={0} max={1} step={0.001} value={p} onChange={(e) => setOverride(parseFloat(e.target.value))} className="h-1 w-full cursor-pointer accent-[var(--accent)]" aria-label="Scrub story" />
        {override !== null && <button onClick={() => setOverride(null)} className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20">↻</button>}
      </div>
    </div>
  );
}

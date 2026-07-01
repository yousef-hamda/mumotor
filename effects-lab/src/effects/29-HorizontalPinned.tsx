import { useState } from 'react';
import { useScrollProgress } from '../lib/useScrollProgress';
import { clamp } from '../lib/raf';
import { DRIVE_IMAGES } from '../assets/images';

const PANELS = [
  { title: 'Manual & automatic', body: 'Whatever suits you — full control or fewer things to juggle.', img: DRIVE_IMAGES[0] },
  { title: 'Areas we cover', body: 'Door-to-door pickup across the whole metro area.', img: DRIVE_IMAGES[2] },
  { title: 'Test-ready', body: 'Mock tests and test-day car hire baked in.', img: DRIVE_IMAGES[4] },
  { title: 'Pass first time', body: 'A 92% first-time pass rate, and counting.', img: DRIVE_IMAGES[5] },
];

export default function HorizontalPinned() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>();
  const [override, setOverride] = useState<number | null>(null);
  const p = clamp(override ?? progress);
  const x = -p * (PANELS.length - 1) * 100; // % of one panel slot

  return (
    <div ref={ref} className="relative h-[480px] w-full overflow-hidden" style={{ background: '#06070d' }}>
      <div className="flex h-full" style={{ transform: `translateX(${x / PANELS.length}%)`, width: `${PANELS.length * 100}%`, transition: override !== null ? 'transform 0.2s' : 'none' }}>
        {PANELS.map((panel, i) => (
          <div key={i} className="relative h-full" style={{ width: `${100 / PANELS.length}%` }}>
            <div className="absolute inset-3 overflow-hidden rounded-2xl border border-white/10">
              <img src={panel.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-black/10" />
              <div className="absolute bottom-0 left-0 p-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-accent">0{i + 1}</div>
                <div className="mt-1 text-3xl font-bold tracking-tight text-white">{panel.title}</div>
                <div className="mt-1.5 max-w-sm text-white/65">{panel.body}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-4 px-6 pb-4">
        <span className="shrink-0 text-xs text-white/40">Scroll, or drag →</span>
        <input type="range" min={0} max={1} step={0.001} value={p} onChange={(e) => setOverride(parseFloat(e.target.value))} className="h-1 w-full cursor-pointer accent-[var(--accent)]" aria-label="Scrub panels" />
        {override !== null && <button onClick={() => setOverride(null)} className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20">↻</button>}
      </div>
    </div>
  );
}

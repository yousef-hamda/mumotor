import { useStageScroll } from '../lib/stageScroll';
import { clamp } from '../lib/raf';

const ITEMS = [
  { k: 'Zero JavaScript', v: 'Keyframes tied to scroll run on the compositor thread.' },
  { k: 'view() timeline', v: 'Each row reveals as it enters the scroll range.' },
  { k: 'scroll() timeline', v: 'The bar above fills with scroll progress.' },
  { k: '60fps, free', v: 'No main-thread cost, graceful fallback where unsupported.' },
];

// The modern 2025–26 move: keyframes tied to scroll via animation-timeline. Here
// it's driven by the in-frame scroll so you can scrub the reveals + progress bar.
export default function CssScrollDriven() {
  const stage = useStageScroll();
  const p = stage ? stage.progress : 0;

  return (
    <div className="w-full px-6 py-10" style={{ background: 'radial-gradient(120% 60% at 50% 0%, #101626, #06070d)' }}>
      <div className="mx-auto max-w-lg">
        <div className="mb-8 h-[4px] w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full origin-left rounded-full bg-gradient-to-r from-accent to-accent2" style={{ transform: `scaleX(${Math.max(0.02, p)})` }} />
        </div>
        <p className="mb-6 text-xs text-white/40">Scroll inside this frame — the rows reveal and the bar fills with progress.</p>
        <div className="space-y-4">
          {ITEMS.map((it, i) => {
            const local = clamp((p - i * 0.16) * 6); // 0 → 1 as progress passes this row
            return (
              <div
                key={it.k}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                style={{ opacity: local, transform: `translateY(${(1 - local) * 40}px) scale(${0.96 + local * 0.04})` }}
              >
                <div className="text-lg font-semibold text-white">{it.k}</div>
                <div className="mt-1 text-sm text-white/55">{it.v}</div>
              </div>
            );
          })}
        </div>
        <div
          className="mt-4 rounded-2xl border border-accent/30 bg-accent/10 p-5 text-sm text-white/80"
          style={{ opacity: clamp((p - 0.7) * 5) }}
        >
          Real version: pure CSS via <code className="rounded bg-white/10 px-1 text-white/70">animation-timeline: view()/scroll()</code> — no JS.
        </div>
      </div>
    </div>
  );
}

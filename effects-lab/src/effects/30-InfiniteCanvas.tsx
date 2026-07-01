import { useRef, useState } from 'react';
import { DRIVE_IMAGES } from '../assets/images';

const NODES = [
  { x: 60, y: 60, w: 200, kind: 'img', img: 0, label: 'First lesson' },
  { x: 340, y: 120, w: 180, kind: 'note', label: 'Manual or automatic?' },
  { x: 120, y: 320, w: 170, kind: 'note', label: 'Areas: Tel Aviv · Haifa' },
  { x: 420, y: 360, w: 210, kind: 'img', img: 2, label: 'Mock test route' },
  { x: 640, y: 90, w: 180, kind: 'note', label: 'Pass rate: 92%' },
  { x: 700, y: 330, w: 200, kind: 'img', img: 5, label: 'Open road' },
  { x: -40, y: 200, w: 160, kind: 'note', label: 'Sign up →' },
];

// A FigJam-style infinite plane you drag to pan and scroll to zoom, content
// scattered in 2D space — explorable spatial navigation instead of a scroll.
export default function InfiniteCanvas() {
  const [t, setT] = useState({ x: 120, y: 60, s: 1 });
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, tx: t.x, ty: t.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setT((p) => ({ ...p, x: drag.current!.tx + (e.clientX - drag.current!.x), y: drag.current!.ty + (e.clientY - drag.current!.y) }));
  };
  const onUp = () => { drag.current = null; };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    setT((p) => {
      const ns = Math.min(2.2, Math.max(0.4, p.s * (e.deltaY < 0 ? 1.08 : 0.93)));
      // zoom about cursor
      const k = ns / p.s;
      return { s: ns, x: mx - (mx - p.x) * k, y: my - (my - p.y) * k };
    });
  };

  return (
    <div
      className="relative h-[460px] w-full cursor-grab touch-none overflow-hidden active:cursor-grabbing"
      style={{ background: 'radial-gradient(120% 120% at 50% 50%, #0c1220, #06070d)' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onWheel={onWheel}
    >
      {/* dotted grid that pans */}
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px)', backgroundSize: `${26 * t.s}px ${26 * t.s}px`, backgroundPosition: `${t.x}px ${t.y}px` }} />
      <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.s})` }}>
        {NODES.map((n, i) => (
          <div key={i} className="absolute" style={{ left: n.x, top: n.y, width: n.w }}>
            {n.kind === 'img' ? (
              <div className="overflow-hidden rounded-xl border border-white/15 shadow-xl">
                <img src={DRIVE_IMAGES[n.img!]} alt="" className="h-28 w-full object-cover" draggable={false} />
                <div className="bg-ink-800 px-3 py-2 text-xs text-white/80">{n.label}</div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/12 bg-amber-200/90 px-4 py-3 text-sm font-medium text-black shadow-xl">{n.label}</div>
            )}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute bottom-4 left-5 text-xs font-medium text-white/55">Drag to pan · scroll to zoom</div>
    </div>
  );
}

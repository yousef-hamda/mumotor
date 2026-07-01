import { useRef, useState } from 'react';
import { DRIVE_IMAGES } from '../assets/images';

// CSS-3D approximation of a scroll-warped 3D gallery: cards sit on a perspective
// curve (rotateY + translateZ by distance from centre) with depth-blur off-centre.
// (A true three.js build is a follow-up; this conveys the effect dependency-free.)
export default function Gallery3D() {
  const [pos, setPos] = useState(0);
  const drag = useRef<{ startX: number; startPos: number } | null>(null);
  const n = DRIVE_IMAGES.length;
  const clamp = (v: number) => Math.max(0, Math.min(n - 1, v));

  const onDown = (e: React.PointerEvent) => {
    drag.current = { startX: e.clientX, startPos: pos };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.startX;
    setPos(clamp(drag.current.startPos - dx / 220));
  };
  const onUp = () => { if (drag.current) { setPos((p) => clamp(Math.round(p))); drag.current = null; } };

  return (
    <div className="relative h-[480px] w-full overflow-hidden" style={{ background: 'radial-gradient(130% 130% at 50% 120%, #14213e, #06070d)' }}>
      <div
        className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
        style={{ perspective: '1400px' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="absolute left-1/2 top-1/2" style={{ transformStyle: 'preserve-3d' }}>
          {DRIVE_IMAGES.map((src, i) => {
            const off = i - pos;
            const abs = Math.abs(off);
            const transform = `translate(-50%,-50%) rotateY(${off * -38}deg) translateX(${off * 58}%) translateZ(${-abs * 140}px)`;
            return (
              <div
                key={i}
                className="absolute h-[300px] w-[230px] overflow-hidden rounded-2xl border border-white/15 shadow-2xl"
                style={{
                  transform,
                  filter: `brightness(${1 - Math.min(abs * 0.28, 0.7)}) blur(${Math.min(abs * 1.6, 5)}px)`,
                  zIndex: 100 - Math.round(abs * 10),
                  opacity: abs > 3 ? 0 : 1,
                  transition: drag.current ? 'none' : 'transform 0.5s cubic-bezier(0.22,1,0.36,1), filter 0.5s',
                }}
              >
                <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            );
          })}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-3">
        <button onClick={() => setPos((p) => clamp(Math.round(p - 1)))} className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20">←</button>
        <span className="font-mono text-xs text-white/50">{Math.round(pos) + 1} / {n}</span>
        <button onClick={() => setPos((p) => clamp(Math.round(p + 1)))} className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20">→</button>
      </div>
    </div>
  );
}

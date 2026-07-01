import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../lib/useReducedMotion';

// A faint animated film-grain texture over a gradient that flickers like 16mm,
// breaking up flat digital perfection. Toggle it to feel the difference.
export default function GrainOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [on, setOn] = useState(true);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const off = document.createElement('canvas');
    off.width = 180; off.height = 110;
    const octx = off.getContext('2d')!;
    const img = octx.createImageData(off.width, off.height);

    const fit = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(2, Math.floor(r.width));
      canvas.height = Math.max(2, Math.floor(r.height));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    let raf = 0, running = false, frame = 0;
    const render = () => {
      frame++;
      if (on && frame % 2 === 0) {
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = (Math.random() * 255) | 0;
          d[i] = d[i + 1] = d[i + 2] = v;
          d[i + 3] = 255;
        }
        octx.putImageData(img, 0, 0);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (on) ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
      raf = requestAnimationFrame(render);
    };
    const play = () => { if (!running && !document.hidden) { running = true; raf = requestAnimationFrame(render); } };
    const pause = () => { running = false; cancelAnimationFrame(raf); };
    if (reduced) { /* draw one static grain frame */ render(); pause(); } else play();

    const io = new IntersectionObserver((es) => { (es[0]?.isIntersecting ?? true) ? play() : pause(); }, { threshold: 0 });
    io.observe(canvas);
    const onVis = () => { if (document.hidden) pause(); else play(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { pause(); io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', onVis); };
  }, [on, reduced]);

  return (
    <div className="relative h-[440px] w-full overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(80% 80% at 30% 20%, #2a4cff44, transparent 60%), radial-gradient(70% 70% at 80% 90%, #a020f044, transparent 60%), linear-gradient(135deg,#0a1030,#1a0a32)' }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ mixBlendMode: 'overlay', opacity: 0.6 }} />
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-3xl font-bold tracking-tight text-white">Tactile, not sterile</div>
          <div className="mt-1 text-sm text-white/55">Animated grain over a gradient</div>
        </div>
      </div>
      <button onClick={() => setOn((v) => !v)} className="absolute bottom-4 left-5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-white/20">
        Grain: {on ? 'on' : 'off'}
      </button>
    </div>
  );
}

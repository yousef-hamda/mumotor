import { useEffect, useRef, useState } from 'react';
import { createFluid, type Fluid } from '../lib/FluidSim';
import { useReducedMotion } from '../lib/useReducedMotion';

const MAX_DPR = 1.5;
const SPLAT_FORCE = 6000;

// hue (deg) → rgb 0..1
function hsv(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [r + m, g + m, b + m];
}

export default function FluidCursor() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.max(2, Math.floor(wrap.clientWidth * dpr));
      canvas.height = Math.max(2, Math.floor(wrap.clientHeight * dpr));
    };
    fit();

    const fluid: Fluid | null = createFluid(canvas);
    if (!fluid) { setUnsupported(true); return; }

    let hue = 210;
    const pointer = { x: 0, y: 0, has: false };
    const colorScale = 0.5;

    const toLocal = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height };
    };
    const onMove = (e: PointerEvent) => {
      const p = toLocal(e);
      if (!pointer.has) { pointer.x = p.x; pointer.y = p.y; pointer.has = true; return; }
      const dx = (p.x - pointer.x) * SPLAT_FORCE;
      const dy = (p.y - pointer.y) * SPLAT_FORCE;
      pointer.x = p.x; pointer.y = p.y;
      hue = (hue + 1.5) % 360;
      // bias hue toward blue→purple→teal band for an on-brand ink
      const h = 180 + ((hue % 140));
      const c = hsv(h, 0.8, 1).map((n) => n * colorScale) as [number, number, number];
      fluid.splat(p.x, p.y, dx, dy, c);
    };
    wrap.addEventListener('pointermove', onMove);

    // seed a couple of splats so there's ink before the user moves
    const seed = () => {
      for (let i = 0; i < 6; i++) {
        const x = 0.2 + Math.random() * 0.6;
        const y = 0.3 + Math.random() * 0.4;
        const c = hsv(190 + Math.random() * 120, 0.85, 1).map((n) => n * colorScale * 1.6) as [number, number, number];
        fluid.splat(x, y, (Math.random() - 0.5) * 1400, (Math.random() - 0.5) * 1400, c);
      }
    };
    seed();

    let raf = 0, last = performance.now(), running = false;
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.016);
      last = now;
      fluid.step(dt);
      raf = requestAnimationFrame(loop);
    };
    const play = () => { if (!running && !reduced && !document.hidden) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); } };
    const pause = () => { running = false; cancelAnimationFrame(raf); };

    if (reduced) {
      fluid.step(0.016); // one static frame
    } else {
      play();
    }

    const io = new IntersectionObserver((es) => { (es[0]?.isIntersecting ?? true) ? play() : pause(); }, { threshold: 0 });
    io.observe(canvas);
    const onVis = () => { if (document.hidden) pause(); else play(); };
    document.addEventListener('visibilitychange', onVis);
    const ro = new ResizeObserver(() => { fit(); fluid.resize(); seed(); });
    ro.observe(wrap);

    return () => {
      pause();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      wrap.removeEventListener('pointermove', onMove);
      fluid.destroy();
    };
  }, [reduced]);

  return (
    <div
      ref={wrapRef}
      className="relative h-[460px] w-full cursor-crosshair"
      style={{ background: 'radial-gradient(120% 120% at 50% 0%, #0e1430, #05060c)' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ display: unsupported ? 'none' : 'block' }} />
      {unsupported ? (
        <div className="absolute inset-0 grid place-items-center text-sm text-white/50">
          Your browser/GPU can't render float textures — this effect needs real WebGL (works on your Mac).
        </div>
      ) : (
        <div className="pointer-events-none absolute bottom-4 left-5 text-xs font-medium text-white/55">
          Drag your cursor through the ink
        </div>
      )}
    </div>
  );
}

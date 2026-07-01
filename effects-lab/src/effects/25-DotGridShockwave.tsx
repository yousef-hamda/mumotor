import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../lib/useReducedMotion';

export default function DotGridShockwave() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, cols = 0, rows = 0;
    const GAP = 30 * dpr;
    const pointer = { x: -9999, y: -9999 };
    const ripples: { x: number; y: number; t: number }[] = [];

    const resize = () => {
      W = canvas.width = Math.max(2, Math.floor(wrap.clientWidth * dpr));
      H = canvas.height = Math.max(2, Math.floor(wrap.clientHeight * dpr));
      cols = Math.floor(W / GAP);
      rows = Math.floor(H / GAP);
    };
    resize();

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) * dpr;
      pointer.y = (e.clientY - r.top) * dpr;
    };
    const onLeave = () => { pointer.x = -9999; pointer.y = -9999; };
    const onDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      ripples.push({ x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr, t: 0 });
      if (ripples.length > 6) ripples.shift();
    };
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerleave', onLeave);
    wrap.addEventListener('pointerdown', onDown);

    const offX = () => (W - (cols - 1) * GAP) / 2;
    const offY = () => (H - (rows - 1) * GAP) / 2;

    let raf = 0, running = false, last = 0;
    const draw = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;
      ctx.clearRect(0, 0, W, H);
      const ox = offX(), oy = offY();
      for (const rp of ripples) rp.t += dt;
      for (let i = ripples.length - 1; i >= 0; i--) if (ripples[i].t > 2.2) ripples.splice(i, 1);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let x = ox + c * GAP;
          let y = oy + r * GAP;
          let scale = 1;
          let bright = 0.22;
          // cursor proximity
          const dx = x - pointer.x, dy = y - pointer.y;
          const d = Math.hypot(dx, dy);
          const R = 120 * dpr;
          if (d < R) {
            const f = 1 - d / R;
            scale += f * 1.8;
            bright += f * 0.6;
            x += (dx / (d + 0.01)) * f * 8 * dpr;
            y += (dy / (d + 0.01)) * f * 8 * dpr;
          }
          // shockwaves
          for (const rp of ripples) {
            const rd = Math.hypot(x - rp.x, y - rp.y);
            const front = rp.t * 520 * dpr;
            const band = Math.exp(-Math.pow((rd - front) / (50 * dpr), 2)) * Math.exp(-rp.t * 1.2);
            scale += band * 2.2;
            bright += band * 0.8;
          }
          const rad = Math.max(0.4, 1.3 * dpr * scale);
          ctx.fillStyle = `rgba(${110 + bright * 120}, ${150 + bright * 80}, 255, ${Math.min(1, bright)})`;
          ctx.beginPath();
          ctx.arc(x, y, rad, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    const play = () => { if (!running && !document.hidden) { running = true; last = 0; raf = requestAnimationFrame(draw); } };
    const pause = () => { running = false; cancelAnimationFrame(raf); };
    if (reduced) { draw(0); pause(); } else play();

    const io = new IntersectionObserver((es) => { (es[0]?.isIntersecting ?? true) ? play() : pause(); }, { threshold: 0 });
    io.observe(canvas);
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const onVis = () => { if (document.hidden) pause(); else play(); };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      pause(); io.disconnect(); ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerleave', onLeave);
      wrap.removeEventListener('pointerdown', onDown);
    };
  }, [reduced]);

  return (
    <div ref={wrapRef} className="relative h-[440px] w-full cursor-pointer" style={{ background: '#06070d' }}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute bottom-4 left-5 text-xs font-medium text-white/55">
        Move over the grid · click to send a shockwave
      </div>
    </div>
  );
}

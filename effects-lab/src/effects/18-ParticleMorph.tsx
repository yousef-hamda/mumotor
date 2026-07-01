import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../lib/useReducedMotion';

const WORDS = ['LEARN', 'DRIVE', 'PASS'];

type Pt = { x: number; y: number };

export default function ParticleMorph() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;

    // sample a word into a point cloud
    const cloudFor = (word: string): Pt[] => {
      const off = document.createElement('canvas');
      off.width = W; off.height = H;
      const o = off.getContext('2d')!;
      o.fillStyle = '#fff';
      o.textAlign = 'center';
      o.textBaseline = 'middle';
      const size = Math.min(W * 0.22, H * 0.5);
      o.font = `800 ${size}px "Roboto Flex", system-ui, sans-serif`;
      o.fillText(word, W / 2, H / 2);
      const data = o.getImageData(0, 0, W, H).data;
      const pts: Pt[] = [];
      const step = Math.max(3, Math.floor(3 * dpr));
      for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
          if (data[(y * W + x) * 4 + 3] > 128) pts.push({ x, y });
        }
      }
      return pts;
    };

    let clouds: Pt[][] = [];
    let N = 0;
    let parts: { x: number; y: number; vx: number; vy: number }[] = [];

    const build = () => {
      W = canvas.width = Math.max(2, Math.floor(wrap.clientWidth * dpr));
      H = canvas.height = Math.max(2, Math.floor(wrap.clientHeight * dpr));
      clouds = WORDS.map(cloudFor);
      N = Math.max(...clouds.map((c) => c.length));
      parts = Array.from({ length: N }, () => ({ x: W / 2, y: H / 2, vx: 0, vy: 0 }));
    };
    build();

    const at = (cloud: Pt[], i: number) => cloud[i % cloud.length] ?? { x: W / 2, y: H / 2 };
    const pointer = { x: -9999, y: -9999 };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) * dpr;
      pointer.y = (e.clientY - r.top) * dpr;
    };
    const onLeave = () => { pointer.x = -9999; pointer.y = -9999; };
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerleave', onLeave);

    let raf = 0;
    let running = false;
    const draw = (tSec: number) => {
      const cycle = tSec * 0.25;
      const idx = Math.floor(cycle) % WORDS.length;
      const nxt = (idx + 1) % WORDS.length;
      const fr = cycle - Math.floor(cycle);
      const e = fr < 0.15 ? 0 : fr > 0.85 ? 1 : (fr - 0.15) / 0.7; // hold then morph
      const ease = e * e * (3 - 2 * e);

      ctx.fillStyle = 'rgba(6,7,13,0.28)';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < N; i++) {
        const a = at(clouds[idx], i);
        const b = at(clouds[nxt], i);
        const tx = a.x + (b.x - a.x) * ease;
        const ty = a.y + (b.y - a.y) * ease;
        const p = parts[i];
        let ax = (tx - p.x) * 0.08;
        let ay = (ty - p.y) * 0.08;
        // cursor repel
        const dx = p.x - pointer.x, dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        const R = 80 * dpr;
        if (d2 < R * R) {
          const d = Math.sqrt(d2) + 0.01;
          const f = (1 - d / R) * 6;
          ax += (dx / d) * f;
          ay += (dy / d) * f;
        }
        p.vx = (p.vx + ax) * 0.82;
        p.vy = (p.vy + ay) * 0.82;
        p.x += p.vx; p.y += p.vy;
        const hue = 200 + 80 * (i / N);
        ctx.fillStyle = `hsla(${hue},90%,65%,0.9)`;
        ctx.fillRect(p.x, p.y, 1.6 * dpr, 1.6 * dpr);
      }
      ctx.globalCompositeOperation = 'source-over';
    };

    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      draw(reduced ? 0.4 : (now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    const play = () => { if (!running && !document.hidden) { running = true; start = 0; raf = requestAnimationFrame(tick); } };
    const pause = () => { running = false; cancelAnimationFrame(raf); };
    if (reduced) { draw(0.4); } else { play(); }

    const io = new IntersectionObserver((es) => { (es[0]?.isIntersecting ?? true) ? play() : pause(); }, { threshold: 0 });
    io.observe(canvas);
    const ro = new ResizeObserver(() => build());
    ro.observe(wrap);
    const onVis = () => { if (document.hidden) pause(); else play(); };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      pause();
      io.disconnect(); ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerleave', onLeave);
    };
  }, [reduced]);

  return (
    <div ref={wrapRef} className="relative h-[440px] w-full" style={{ background: '#06070d' }}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute bottom-4 left-5 text-xs font-medium text-white/55">
        Particles morph between words · move your cursor to disturb them
      </div>
    </div>
  );
}

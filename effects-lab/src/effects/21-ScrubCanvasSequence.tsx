import { useEffect, useRef, useState } from 'react';
import { useScrollProgress } from '../lib/useScrollProgress';

// Scroll position scrubs a procedurally-drawn "drive down a road" frame sequence
// (the Apple-AirPods pattern). A slider can override; "follow scroll" resets it.
export default function ScrubCanvasSequence() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [override, setOverride] = useState<number | null>(null);
  const p = override ?? progress;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = ref.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    // Only reassign canvas.width/height when the size actually changes — setting
    // it (even to the same value) clears the canvas, and the RO's initial fire
    // would otherwise wipe our one-shot draw.
    const fit = () => {
      const w = Math.floor(wrap.clientWidth * dpr), h = Math.floor(wrap.clientHeight * dpr);
      W = w; H = h;
      const changed = canvas.width !== w || canvas.height !== h;
      if (changed) { canvas.width = w; canvas.height = h; }
      return changed;
    };
    fit();
    const ro = new ResizeObserver(() => { if (fit()) draw(p); });
    ro.observe(wrap);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const horizon = H * 0.42;
      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, `hsl(${220 - t * 40}, 60%, ${14 + t * 10}%)`);
      sky.addColorStop(1, `hsl(${30 + t * 20}, 70%, ${30 + t * 25}%)`);
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon);
      // ground
      ctx.fillStyle = '#0a0c10'; ctx.fillRect(0, horizon, W, H - horizon);
      // sun
      ctx.fillStyle = `hsla(${40 + t * 15},90%,60%,0.9)`;
      ctx.beginPath(); ctx.arc(W * 0.5, horizon - 6 * dpr, (18 + t * 26) * dpr, 0, Math.PI * 2); ctx.fill();
      // road trapezoid
      const cx = W / 2, roadBottom = W * 0.7, roadTop = W * 0.04;
      ctx.fillStyle = '#15181f';
      ctx.beginPath();
      ctx.moveTo(cx - roadBottom / 2, H); ctx.lineTo(cx - roadTop / 2, horizon);
      ctx.lineTo(cx + roadTop / 2, horizon); ctx.lineTo(cx + roadBottom / 2, H);
      ctx.closePath(); ctx.fill();
      // center dashes (perspective) scrolling with progress
      for (let i = 0; i < 14; i++) {
        const f = ((i / 14 + t * 1.5) % 1);
        const z = f * f;                 // perspective easing
        const y = horizon + z * (H - horizon);
        const w = (1 + z * 10) * dpr;
        const len = (4 + z * 34) * dpr;
        ctx.fillStyle = `rgba(240,210,120,${0.3 + z * 0.6})`;
        ctx.fillRect(cx - w / 2, y, w, len);
      }
      // side poles
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 8; i++) {
          const f = ((i / 8 + t * 1.5) % 1);
          const z = f * f;
          const y = horizon + z * (H - horizon);
          const roadHalf = (roadTop + (roadBottom - roadTop) * z) / 2;
          const x = cx + side * (roadHalf + (14 + z * 80) * dpr);
          const ph = (6 + z * 60) * dpr;
          ctx.fillStyle = `rgba(150,170,200,${0.2 + z * 0.5})`;
          ctx.fillRect(x - 1.5 * dpr, y - ph, 3 * dpr, ph);
        }
      }
      // car (bottom centre) with spinning wheels
      const carW = 150 * dpr, carH = 70 * dpr, carY = H - carH - 14 * dpr;
      ctx.fillStyle = '#10141c';
      roundRect(ctx, cx - carW / 2, carY, carW, carH, 16 * dpr); ctx.fill();
      ctx.fillStyle = '#1c2330';
      roundRect(ctx, cx - carW * 0.32, carY + 8 * dpr, carW * 0.64, carH * 0.42, 10 * dpr); ctx.fill();
      ctx.fillStyle = 'rgba(120,180,255,0.25)';
      roundRect(ctx, cx - carW * 0.28, carY + 11 * dpr, carW * 0.56, carH * 0.30, 8 * dpr); ctx.fill();
      // tail lights
      ctx.fillStyle = '#ff4d4d';
      ctx.fillRect(cx - carW / 2 + 6 * dpr, carY + carH * 0.5, 10 * dpr, 8 * dpr);
      ctx.fillRect(cx + carW / 2 - 16 * dpr, carY + carH * 0.5, 10 * dpr, 8 * dpr);
      for (const wx of [-carW * 0.3, carW * 0.3]) {
        const wheelX = cx + wx, wheelY = carY + carH, wr = 13 * dpr;
        ctx.fillStyle = '#05060a'; ctx.beginPath(); ctx.arc(wheelX, wheelY, wr, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#3a4255'; ctx.lineWidth = 2 * dpr;
        const ang = t * 40;
        for (let s = 0; s < 5; s++) {
          const a = ang + (s * Math.PI * 2) / 5;
          ctx.beginPath(); ctx.moveTo(wheelX, wheelY);
          ctx.lineTo(wheelX + Math.cos(a) * wr * 0.8, wheelY + Math.sin(a) * wr * 0.8); ctx.stroke();
        }
      }
      // odometer
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `700 ${14 * dpr}px ui-monospace, monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(`${Math.round(t * 100)} km/h`, 16 * dpr, 28 * dpr);
    };
    draw(p);
    return () => ro.disconnect();
  }, [p, ref]);

  return (
    <div ref={ref} className="relative h-[480px] w-full" style={{ background: '#06070d' }}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-4 bg-gradient-to-t from-black/70 to-transparent px-5 pb-4 pt-10">
        <input
          type="range" min={0} max={1} step={0.001} value={p}
          onChange={(e) => setOverride(parseFloat(e.target.value))}
          className="h-1 w-full cursor-pointer accent-[var(--accent)]" aria-label="Scrub the drive"
        />
        {override !== null && (
          <button onClick={() => setOverride(null)} className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20">↻ follow scroll</button>
        )}
      </div>
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

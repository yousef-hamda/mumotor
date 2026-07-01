import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../lib/useReducedMotion';
import { clamp } from '../lib/raf';

const TEXT = 'Drive with confidence';
const INFLUENCE = 150; // px radius of the cursor's pull

export default function VariableFontProximity() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const spans = useRef<HTMLSpanElement[]>([]);
  const reduced = useReducedMotion();

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (reduced) {
      spans.current.forEach((s) => s && (s.style.fontVariationSettings = `'wght' 500, 'wdth' 100`));
      return;
    }
    const pointer = { x: -9999, y: -9999 };
    const state = spans.current.map(() => ({ w: 300, wd: 100 }));

    const onMove = (e: PointerEvent) => { pointer.x = e.clientX; pointer.y = e.clientY; };
    const onLeave = () => { pointer.x = -9999; pointer.y = -9999; };
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerleave', onLeave);

    let raf = 0, running = false;
    const tick = () => {
      for (let i = 0; i < spans.current.length; i++) {
        const el = spans.current[i];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const d = Math.hypot(cx - pointer.x, cy - pointer.y);
        const falloff = Math.exp(-(d * d) / (2 * INFLUENCE * INFLUENCE)); // 0..1
        const tW = 200 + falloff * 700; // 200..900
        const tWd = 75 + falloff * 75; // 75..150
        const s = state[i];
        s.w += (tW - s.w) * 0.18;
        s.wd += (tWd - s.wd) * 0.18;
        el.style.fontVariationSettings = `'wght' ${s.w.toFixed(0)}, 'wdth' ${s.wd.toFixed(0)}`;
        el.style.opacity = `${clamp(0.55 + falloff * 0.45, 0, 1)}`;
      }
      raf = requestAnimationFrame(tick);
    };
    const play = () => { if (!running) { running = true; raf = requestAnimationFrame(tick); } };
    const pause = () => { running = false; cancelAnimationFrame(raf); };
    const io = new IntersectionObserver((es) => { (es[0]?.isIntersecting ?? true) ? play() : pause(); }, { threshold: 0 });
    io.observe(wrap);

    return () => {
      pause();
      io.disconnect();
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerleave', onLeave);
    };
  }, [reduced]);

  return (
    <div
      ref={wrapRef}
      className="grid h-[440px] w-full place-items-center px-6"
      style={{ background: 'radial-gradient(120% 120% at 50% 30%, #141a2e, #06070d)' }}
    >
      <h3
        className="select-none text-center text-5xl text-white sm:text-6xl"
        style={{ lineHeight: 1.1, fontFamily: '"Roboto Flex", sans-serif' }}
        aria-label={TEXT}
      >
        {TEXT.split('').map((ch, i) => (
          <span
            key={i}
            aria-hidden="true"
            ref={(el) => { if (el) spans.current[i] = el; }}
            style={{ display: 'inline-block', fontVariationSettings: `'wght' 300, 'wdth' 100`, transition: 'none' }}
          >
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </h3>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { DRIVE_IMAGES } from '../assets/images';
import { useReducedMotion } from '../lib/useReducedMotion';

const POOL = 14;
const SPAWN_DIST = 55; // px between spawns

export default function ImageTrail() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgs = useRef<HTMLImageElement[]>([]);
  const reduced = useReducedMotion();

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || reduced) return;
    let idx = 0;
    let z = 1;
    let lastX = 0, lastY = 0, has = false;

    const spawn = (x: number, y: number) => {
      const node = imgs.current[idx % POOL];
      idx++;
      if (!node) return;
      node.src = DRIVE_IMAGES[idx % DRIVE_IMAGES.length];
      gsap.killTweensOf(node);
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      gsap.set(node, { xPercent: -50, yPercent: -50, scale: 0.5, opacity: 1, rotation: gsap.utils.random(-14, 14), zIndex: ++z });
      gsap.to(node, { scale: 1, duration: 0.4, ease: 'power3.out' });
      gsap.to(node, { opacity: 0, scale: 1.18, y: '+=24', duration: 0.7, delay: 0.28, ease: 'power2.in' });
    };

    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (!has) { lastX = x; lastY = y; has = true; }
      if (Math.hypot(x - lastX, y - lastY) > SPAWN_DIST) {
        spawn(x, y);
        lastX = x; lastY = y;
      }
    };
    wrap.addEventListener('pointermove', onMove);
    return () => {
      wrap.removeEventListener('pointermove', onMove);
      imgs.current.forEach((n) => n && gsap.killTweensOf(n));
    };
  }, [reduced]);

  return (
    <div
      ref={wrapRef}
      className="relative h-[460px] w-full overflow-hidden"
      style={{ background: 'radial-gradient(120% 120% at 50% 50%, #0f1426, #06070d)' }}
    >
      {/* pooled trail images */}
      {Array.from({ length: POOL }).map((_, i) => (
        <img
          key={i}
          ref={(el) => { if (el) imgs.current[i] = el; }}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute h-[180px] w-[140px] rounded-xl object-cover opacity-0 shadow-2xl ring-1 ring-white/10"
          style={{ left: 0, top: 0, willChange: 'transform, opacity' }}
        />
      ))}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-2xl font-semibold tracking-tight text-white/80">Sweep across the panel</div>
          <div className="mt-1 text-sm text-white/40">{reduced ? 'Reduced-motion: trail disabled' : 'Photos fling out and dissolve behind your cursor'}</div>
        </div>
      </div>
    </div>
  );
}

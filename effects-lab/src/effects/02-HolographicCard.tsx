import { useRef } from 'react';
import { DRIVE_IMAGES } from '../assets/images';
import { useReducedMotion } from '../lib/useReducedMotion';

// Pure-CSS holographic foil: a pointer handler writes CSS custom properties that
// drive the tilt, the rainbow sheen offset, the sparkle mask and the glare hot-spot.
export default function HolographicCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const card = cardRef.current;
    if (!card) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width; // 0..1
    const py = (e.clientY - r.top) / r.height;
    const rx = (px - 0.5) * 2; // -1..1
    const ry = (py - 0.5) * 2;
    card.style.setProperty('--rx', `${rx * 12}deg`);
    card.style.setProperty('--ry', `${-ry * 12}deg`);
    card.style.setProperty('--mx', `${px * 100}%`);
    card.style.setProperty('--my', `${py * 100}%`);
    card.style.setProperty('--bg-x', `${30 + px * 40}%`);
    card.style.setProperty('--bg-y', `${30 + py * 40}%`);
    card.style.setProperty('--active', '1');
  };
  const onLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    card.style.setProperty('--active', '0');
  };

  return (
    <div
      className="grid h-[460px] w-full place-items-center p-6"
      style={{ background: 'radial-gradient(120% 120% at 50% 0%, #12162a, #06070d)' }}
    >
      <div
        ref={cardRef}
        className="holo-card aspect-[3/4] w-[280px] overflow-hidden rounded-2xl border border-white/15 bg-ink-800 shadow-2xl sm:w-[300px]"
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        {/* base art */}
        <img src={DRIVE_IMAGES[1]} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        {/* holo layers */}
        <div className="holo-layer holo-shine" />
        <div className="holo-layer holo-sparkle" />
        <div className="holo-layer holo-glare" />
        {/* content */}
        <div className="absolute inset-x-0 bottom-0 p-4" style={{ transform: 'translateZ(20px)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-accent">Premium pass</div>
          <div className="mt-1 text-xl font-bold text-white">Manual · 20 lessons</div>
          <div className="mt-0.5 text-xs text-white/60">First-time pass guarantee</div>
        </div>
      </div>
    </div>
  );
}

import { useRef } from 'react';
import { useReducedMotion } from '../lib/useReducedMotion';

// A 3D tilt card with depth-layered parallax: image, badge and title sit at
// different translateZ depths so they float against each other, plus a glare
// that tracks the cursor — diorama depth, not a flat plane tipping.
export default function TiltDepth() {
  const cardRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const onMove = (e: React.PointerEvent) => {
    if (reduced) return;
    const card = cardRef.current!;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    card.style.setProperty('--rx', `${(px - 0.5) * 16}deg`);
    card.style.setProperty('--ry', `${-(py - 0.5) * 16}deg`);
    card.style.setProperty('--mx', `${px * 100}%`);
    card.style.setProperty('--my', `${py * 100}%`);
    card.style.setProperty('--a', '1');
  };
  const onLeave = () => {
    const card = cardRef.current!;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    card.style.setProperty('--a', '0');
  };

  return (
    <div className="grid h-[440px] w-full place-items-center" style={{ background: 'radial-gradient(120% 120% at 50% 20%, #101626, #06070d)', perspective: '1000px' }}>
      <div
        ref={cardRef}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="relative h-[300px] w-[420px] rounded-3xl border border-white/12 bg-gradient-to-br from-ink-700 to-ink-900 p-6"
        style={{ transform: 'rotateY(var(--rx,0)) rotateX(var(--ry,0))', transformStyle: 'preserve-3d', transition: 'transform 0.12s ease-out' }}
      >
        <div className="absolute right-6 top-6 rounded-full bg-accent px-3 py-1 text-xs font-bold text-black" style={{ transform: 'translateZ(60px)' }}>POPULAR</div>
        <div className="text-xs font-semibold uppercase tracking-widest text-accent" style={{ transform: 'translateZ(40px)' }}>Pass package</div>
        <div className="mt-2 text-3xl font-bold text-white" style={{ transform: 'translateZ(75px)' }}>20 lessons</div>
        <div className="mt-1 text-white/55" style={{ transform: 'translateZ(30px)' }}>Mock test + test-day car included</div>
        <div className="absolute bottom-6 left-6 text-4xl font-bold text-white" style={{ transform: 'translateZ(90px)' }}>₪2,390</div>
        {/* glare */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl" style={{ background: 'radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.35), transparent 45%)', opacity: 'var(--a,0)', mixBlendMode: 'overlay', transition: 'opacity 0.2s' }} />
      </div>
    </div>
  );
}

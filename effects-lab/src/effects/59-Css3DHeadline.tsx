import { useRef } from 'react';
import { useReducedMotion } from '../lib/useReducedMotion';

// A genuinely 3D-feeling headline: layered shadows give it extruded depth and it
// rotates toward the cursor. (CSS-3D approximation of Troika SDF text — keeps the
// lab dependency-free; a real three.js/Troika build is a follow-up.)
const LAYERS = 14;

export default function Css3DHeadline() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const onMove = (e: React.PointerEvent) => {
    if (reduced) return;
    const r = ref.current!.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ref.current!.style.setProperty('--rx', `${px * 36}deg`);
    ref.current!.style.setProperty('--ry', `${-py * 24}deg`);
  };
  const onLeave = () => {
    ref.current!.style.setProperty('--rx', '-18deg');
    ref.current!.style.setProperty('--ry', '8deg');
  };

  const shadow = Array.from({ length: LAYERS }, (_, i) => `${i + 1}px ${i + 1}px 0 hsl(${215 + i * 4} 70% ${40 - i * 2}%)`).join(', ');

  return (
    <div
      className="grid h-[440px] w-full place-items-center"
      style={{ background: 'radial-gradient(120% 120% at 50% 30%, #0c1530, #06070d)', perspective: '900px' }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div ref={ref} style={{ transformStyle: 'preserve-3d', transform: 'rotateY(var(--rx,-18deg)) rotateX(var(--ry,8deg))', transition: 'transform 0.15s ease-out' }}>
        <div
          className="select-none text-7xl font-extrabold tracking-tight text-white sm:text-8xl"
          style={{ textShadow: shadow }}
        >
          DRIVE
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-4 left-5 text-xs font-medium text-white/45">Move your cursor to rotate the extruded type</div>
    </div>
  );
}

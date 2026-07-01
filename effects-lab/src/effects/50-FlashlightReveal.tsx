import { useRef } from 'react';
import { DRIVE_IMAGES } from '../assets/images';
import { useReducedMotion, useIsTouch } from '../lib/useReducedMotion';

// The page sits under a dark veil; the cursor carries a soft radial "flashlight"
// that reveals the hidden layer beneath — an x-ray torch.
export default function FlashlightReveal() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const touch = useIsTouch();
  const enabled = !reduced && !touch;

  const onMove = (e: React.PointerEvent) => {
    if (!enabled || !veilRef.current) return;
    const r = wrapRef.current!.getBoundingClientRect();
    veilRef.current.style.setProperty('--x', `${e.clientX - r.left}px`);
    veilRef.current.style.setProperty('--y', `${e.clientY - r.top}px`);
  };

  return (
    <div ref={wrapRef} onPointerMove={onMove} className={`relative h-[440px] w-full overflow-hidden ${enabled ? 'cursor-none' : ''}`}>
      {/* hidden layer revealed by the torch */}
      <img src={DRIVE_IMAGES[4]} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center text-white">
          <div className="text-4xl font-bold tracking-tight">There's a road ahead</div>
          <div className="mt-1 text-white/70">Find it with your torch</div>
        </div>
      </div>
      {/* dark veil with a mask hole at the cursor */}
      <div
        ref={veilRef}
        className="absolute inset-0"
        style={{
          background: 'rgba(4,5,9,0.96)',
          WebkitMaskImage: enabled ? 'radial-gradient(circle 130px at var(--x,50%) var(--y,50%), transparent 0%, rgba(0,0,0,0.5) 55%, #000 75%)' : 'none',
          maskImage: enabled ? 'radial-gradient(circle 130px at var(--x,50%) var(--y,50%), transparent 0%, rgba(0,0,0,0.5) 55%, #000 75%)' : 'none',
        }}
      />
      <div className="pointer-events-none absolute bottom-4 left-5 text-xs font-medium text-white/55">
        {enabled ? 'Move your cursor to shine the torch' : 'Pointer effect disabled (touch / reduced-motion)'}
      </div>
    </div>
  );
}

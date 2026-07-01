import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { DRIVE_IMAGES } from '../assets/images';

gsap.registerPlugin(Flip);

const ITEMS = [
  { id: 'a', img: 0, t: 'Manual lessons', body: 'Clutch control, gears and hill starts mastered step by step.' },
  { id: 'b', img: 2, t: 'Test package', body: 'Mock test, test-day car hire and pickup, all included.' },
  { id: 'c', img: 4, t: 'Intensive', body: 'Licence-ready in two focused weeks with priority booking.' },
  { id: 'd', img: 5, t: 'Refresher', body: 'Rebuild confidence on motorways and parking.' },
];

// GSAP Flip records first/last states and inverts the delta — so a thumbnail
// flawlessly animates into a full detail layout even as the grid reflows.
export default function GsapFlip() {
  const [open, setOpen] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<ReturnType<typeof Flip.getState> | null>(null);

  const toggle = (id: string) => {
    if (!rootRef.current) return;
    stateRef.current = Flip.getState(rootRef.current.querySelectorAll('[data-flip]'));
    setOpen((cur) => (cur === id ? null : id));
  };

  useLayoutEffect(() => {
    if (!stateRef.current) return;
    Flip.from(stateRef.current, { duration: 0.55, ease: 'power2.inOut', absolute: true, scale: true, nested: true });
  }, [open]);

  return (
    <div ref={rootRef} className="grid h-[480px] w-full auto-rows-[140px] grid-cols-3 gap-3 p-5" style={{ background: '#06070d' }}>
      {ITEMS.map((it) => {
        const isOpen = open === it.id;
        return (
          <button
            key={it.id}
            data-flip
            onClick={() => toggle(it.id)}
            className={`group relative overflow-hidden rounded-2xl border border-white/10 text-left ${isOpen ? 'col-span-3 row-span-2' : ''} ${open && !isOpen ? 'opacity-40' : ''}`}
          >
            <img src={DRIVE_IMAGES[it.img]} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <div className="text-base font-semibold text-white">{it.t}</div>
              {isOpen && <div className="mt-1 max-w-md text-sm text-white/70">{it.body}</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

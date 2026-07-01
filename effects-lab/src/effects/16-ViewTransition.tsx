import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { DRIVE_IMAGES } from '../assets/images';

const ITEMS = [
  { img: DRIVE_IMAGES[0], title: 'Manual lessons', body: 'Master the clutch, gears and hill starts with calm, structured sessions.' },
  { img: DRIVE_IMAGES[2], title: 'Test package', body: 'A mock test, test-day car hire and door-to-door pickup, all included.' },
  { img: DRIVE_IMAGES[4], title: 'Intensive course', body: 'Daily lessons for two weeks — licence-ready, fast, with priority booking.' },
  { img: DRIVE_IMAGES[5], title: 'Refresher', body: 'Rebuild confidence on motorways and parking after time away from the wheel.' },
];

type VTDoc = Document & { startViewTransition?: (cb: () => void) => void };

export default function ViewTransition() {
  const [selected, setSelected] = useState<number | null>(null);
  const [supported, setSupported] = useState(true);
  useEffect(() => { setSupported(typeof (document as VTDoc).startViewTransition === 'function'); }, []);
  const namedIdx = useRef<number | null>(null);

  const swap = (fn: () => void) => {
    const d = document as VTDoc;
    if (d.startViewTransition) d.startViewTransition(() => flushSync(fn));
    else fn();
  };
  const open = (i: number) => {
    namedIdx.current = i;
    requestAnimationFrame(() => swap(() => setSelected(i)));
  };
  const close = () => {
    swap(() => setSelected(null));
    setTimeout(() => { namedIdx.current = null; }, 400);
  };
  const vtName = (i: number) => (namedIdx.current === i ? ({ viewTransitionName: 'vt-hero' } as const) : undefined);

  return (
    <div className="relative h-[520px] w-full overflow-hidden p-5" style={{ background: 'radial-gradient(120% 120% at 50% 0%, #101626, #06070d)' }}>
      {selected === null ? (
        <div className="grid h-full grid-cols-2 gap-4">
          {ITEMS.map((it, i) => (
            <button key={i} onClick={() => open(i)} className="group relative overflow-hidden rounded-2xl border border-white/10 text-left">
              <img src={it.img} alt="" style={vtName(i)} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-3 left-4 text-base font-semibold text-white">{it.title}</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="absolute inset-5 overflow-hidden rounded-2xl border border-white/15 bg-ink-800">
          <div className="relative h-56">
            <img src={ITEMS[selected].img} alt="" style={{ viewTransitionName: 'vt-hero' }} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-800 to-transparent" />
            <button onClick={close} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70">✕</button>
            <div className="absolute bottom-3 left-5 text-2xl font-bold text-white">{ITEMS[selected].title}</div>
          </div>
          <div className="p-5">
            <p className="text-white/70">{ITEMS[selected].body}</p>
            <button onClick={close} className="mt-4 text-sm font-medium text-accent hover:underline">← Back to all</button>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 left-6 text-xs font-medium text-white/45">
        {supported ? 'Native View Transitions — click a card' : 'View Transitions unsupported here — using a fade fallback'}
      </div>
    </div>
  );
}

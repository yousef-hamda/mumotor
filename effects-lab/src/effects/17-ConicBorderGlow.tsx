import { useRef } from 'react';

const CARDS = [
  { title: 'Manual lessons', body: 'Full clutch control, hill starts and gears.' },
  { title: 'Automatic', body: 'Faster to confident, fewer things to juggle.' },
  { title: 'Test package', body: 'Mock test, car hire and pickup included.' },
  { title: 'Intensive', body: 'Licence-ready in two focused weeks.' },
  { title: 'Refresher', body: 'Shake off the rust and rebuild confidence.' },
  { title: 'Motorway', body: 'Merging, lane discipline and high-speed calm.' },
];

export default function ConicBorderGlow() {
  const cards = useRef<HTMLDivElement[]>([]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    for (const card of cards.current) {
      if (!card) continue;
      const r = card.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      const dist = Math.hypot(dx, dy);
      const glow = Math.max(0, 1 - dist / 360);
      card.style.setProperty('--angle', `${angle}deg`);
      card.style.setProperty('--glow', `${glow}`);
    }
  };
  const onLeave = () => cards.current.forEach((c) => c && c.style.setProperty('--glow', '0'));

  return (
    <div
      className="flex h-[440px] w-full items-center p-6"
      style={{ background: 'radial-gradient(120% 120% at 50% 0%, #0d1320, #06070d)' }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3">
        {CARDS.map((c, i) => (
          <div
            key={c.title}
            ref={(el) => { if (el) cards.current[i] = el; }}
            className="glow-card rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <div className="text-base font-semibold text-white">{c.title}</div>
            <div className="mt-1.5 text-sm text-white/50">{c.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

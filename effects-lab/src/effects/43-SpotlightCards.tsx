const CARDS = [
  { t: 'WhatsApp booking', b: 'Students message you and pick a slot in seconds.' },
  { t: 'Auto reminders', b: 'No-shows drop when lessons remind themselves.' },
  { t: 'Progress tracking', b: 'Every manoeuvre logged, visible to the learner.' },
  { t: 'Reviews on tap', b: 'Happy passes turn into 5-star social proof.' },
  { t: 'Areas covered', b: 'Show exactly where you teach, on a map.' },
  { t: 'Online payments', b: 'Packages paid up front, no chasing cash.' },
];

function SpotCard({ t, b }: { t: string; b: string }) {
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    e.currentTarget.style.setProperty('--a', '1');
  };
  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.setProperty('--a', '0');
  return (
    <div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5"
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(220px circle at var(--mx,50%) var(--my,50%), rgba(94,168,242,0.18), transparent 60%)', opacity: 'var(--a,0)', transition: 'opacity 0.3s' }} />
      <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ border: '1px solid transparent', background: 'radial-gradient(180px circle at var(--mx,50%) var(--my,50%), rgba(94,168,242,0.6), transparent 60%) border-box', WebkitMask: 'linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', opacity: 'var(--a,0)', transition: 'opacity 0.3s' } as React.CSSProperties} />
      <div className="relative text-base font-semibold text-white">{t}</div>
      <div className="relative mt-1.5 text-sm text-white/50">{b}</div>
    </div>
  );
}

export default function SpotlightCards() {
  return (
    <div className="flex h-[440px] w-full items-center p-6" style={{ background: 'radial-gradient(120% 120% at 50% 0%, #0c1220, #06070d)' }}>
      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3">
        {CARDS.map((c) => <SpotCard key={c.t} {...c} />)}
      </div>
    </div>
  );
}

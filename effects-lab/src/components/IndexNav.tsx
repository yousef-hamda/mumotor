import { useEffect, useState } from 'react';
import { EFFECTS, TIER_ORDER, byTier } from '../data/effects';

/** Sticky left index of all effects; highlights the one in view. */
export function IndexNav() {
  const [active, setActive] = useState(EFFECTS[0]?.id);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) setActive(vis.target.id);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5] },
    );
    EFFECTS.forEach((e) => {
      const el = document.getElementById(e.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <nav className="hidden lg:block">
      <div className="sticky top-0 flex h-screen flex-col gap-1 overflow-y-auto px-4 py-8">
        <div className="px-3 pb-3">
          <div className="text-sm font-semibold tracking-tight text-white">Effects Lab</div>
          <div className="text-[11px] uppercase tracking-widest text-white/40">{EFFECTS.length} effects · 3 tiers</div>
        </div>
        {TIER_ORDER.map((tier) => {
          const items = byTier(tier);
          if (!items.length) return null;
          return (
            <div key={tier} className="mb-1">
              <a href={`#tier-${tier}`} className="block px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-white/35 hover:text-white/60">
                Tier {tier}
              </a>
              {items.map((e) => (
                <a
                  key={e.id}
                  href={`#${e.id}`}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] transition-colors ${
                    active === e.id ? 'bg-white/[0.07] text-white' : 'text-white/45 hover:bg-white/[0.04] hover:text-white/80'
                  }`}
                >
                  <span className="font-mono text-[11px] text-white/40">{String(e.rank).padStart(2, '0')}</span>
                  <span className="truncate">{e.short}</span>
                  <span className="ml-auto text-[10px] text-white/30">{e.score}</span>
                </a>
              ))}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

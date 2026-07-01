import { EFFECTS, TIER_ORDER, byTier } from './data/effects';
import { EffectStage } from './components/EffectStage';
import { IndexNav } from './components/IndexNav';
import { TierHeader } from './components/TierHeader';

export default function App() {
  return (
    <div className="relative z-10 mx-auto grid max-w-[1500px] grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)]">
      <IndexNav />
      <main>
        {/* Hero */}
        <header className="px-5 pt-20 pb-10 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="chip mb-5">Showcase · pick your favourites</div>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
              Creative UI effects,
              <br />
              <span className="bg-gradient-to-r from-accent via-white to-accent2 bg-clip-text text-transparent">
                running live.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/55">
              All {EFFECTS.length} creative effects from the research, grouped into three tiers and ranked within
              each. Every one runs in its own stage with a name and a short explanation. Scroll through, play with
              them, and tell me which to bring into mumotor.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {TIER_ORDER.map((t) => (
                <a key={t} href={`#tier-${t}`} className="chip hover:bg-white/10">
                  Jump to Tier {t} <span className="text-white/40">({byTier(t).length})</span>
                </a>
              ))}
            </div>
            <p className="mt-4 text-[13px] text-white/35">
              Tip: most effects respond to your cursor or scroll. They all respect{' '}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-white/60">prefers-reduced-motion</code>, pause off-screen, and load as you scroll.
            </p>
          </div>
        </header>

        {TIER_ORDER.map((tier) => {
          const items = byTier(tier);
          if (!items.length) return null;
          return (
            <div key={tier}>
              <TierHeader tier={tier} count={items.length} />
              <div className="divide-y divide-white/[0.06]">
                {items.map((meta) => {
                  const C = meta.Component;
                  return (
                    <EffectStage key={meta.id} meta={meta}>
                      <C />
                    </EffectStage>
                  );
                })}
              </div>
            </div>
          );
        })}

        <footer className="px-5 py-16 sm:px-8">
          <div className="mx-auto max-w-5xl text-sm text-white/40">
            That's all {EFFECTS.length} effects across three tiers. Tell me which ones you want and I'll wire them
            into the real mumotor templates behind the reduced-motion gate.
          </div>
        </footer>
      </main>
    </div>
  );
}

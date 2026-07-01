export type Tier = 'S' | 'A' | 'B';

export const TIER_META: Record<Tier, { title: string; range: string; ethos: string }> = {
  S: { title: 'Tier S — Showpieces', range: '90–96', ethos: 'The signature, "how did they do that" moments. Reserve for one hero per page.' },
  A: { title: 'Tier A — Premium & distinctive', range: '84–90', ethos: 'High-craft, expensive-feeling work — strong differentiators without a research budget.' },
  B: { title: 'Tier B — High-craft, ship-ready', range: '80–84', ethos: 'Refined, low-risk polish you can layer in widely. The everyday upgrade kit.' },
};

export function TierHeader({ tier, count }: { tier: Tier; count: number }) {
  const m = TIER_META[tier];
  return (
    <div id={`tier-${tier}`} className="scroll-mt-4 border-y border-white/10 bg-white/[0.02] px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{m.title}</h2>
          <span className="chip">score {m.range}</span>
          <span className="chip">{count} effects</span>
        </div>
        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-white/50">{m.ethos}</p>
      </div>
    </div>
  );
}

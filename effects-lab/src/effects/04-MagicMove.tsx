import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DRIVE_IMAGES } from '../assets/images';

type Pkg = { id: string; title: string; price: string; img: string; blurb: string; features: string[] };

const PACKAGES: Pkg[] = [
  { id: 'starter', title: 'Starter · 10 lessons', price: '₪1,290', img: DRIVE_IMAGES[0], blurb: 'Perfect for nervous first-timers.', features: ['10 × 90-min lessons', 'Manual or automatic', 'Free progress tracking', 'Flexible scheduling'] },
  { id: 'pass', title: 'Pass · 20 lessons', price: '₪2,390', img: DRIVE_IMAGES[2], blurb: 'Our most popular, test-ready plan.', features: ['20 × 90-min lessons', 'Mock test included', 'Test-day car hire', 'Pickup & drop-off'] },
  { id: 'intensive', title: 'Intensive · 2 weeks', price: '₪2,990', img: DRIVE_IMAGES[4], blurb: 'Licence-ready, fast.', features: ['Daily lessons for 2 weeks', 'Priority test booking', 'Theory crash course', 'Pass guarantee'] },
  { id: 'refresher', title: 'Refresher · 5 lessons', price: '₪690', img: DRIVE_IMAGES[5], blurb: 'Shake off the rust.', features: ['5 × 60-min lessons', 'Motorway confidence', 'Parking mastery', 'No commitment'] },
];

const spring = { type: 'spring' as const, stiffness: 320, damping: 34 };

export default function MagicMove() {
  const [selected, setSelected] = useState<Pkg | null>(null);

  return (
    <div className="relative h-[560px] w-full overflow-hidden p-5" style={{ background: 'radial-gradient(120% 120% at 50% 0%, #101626, #06070d)' }}>
      <div className="grid h-full grid-cols-2 gap-4">
        {PACKAGES.map((p) => (
          <motion.button
            key={p.id}
            layoutId={`card-${p.id}`}
            onClick={() => setSelected(p)}
            style={{ borderRadius: 18 }}
            animate={{ opacity: selected?.id === p.id ? 0 : 1 }}
            className="group relative overflow-hidden border border-white/10 text-left"
            whileHover={{ y: -3 }}
            transition={spring}
          >
            <motion.img layoutId={`img-${p.id}`} src={p.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <motion.div layoutId={`title-${p.id}`} className="text-lg font-bold text-white">{p.title}</motion.div>
              <div className="mt-0.5 text-sm text-accent">{p.price}</div>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />
            <motion.div
              layoutId={`card-${selected.id}`}
              style={{ borderRadius: 22 }}
              transition={spring}
              className="absolute inset-x-5 top-1/2 z-30 -translate-y-1/2 overflow-hidden border border-white/15 bg-ink-800 shadow-2xl"
            >
              <div className="relative h-44">
                <motion.img layoutId={`img-${selected.id}`} src={selected.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-800 via-black/20 to-transparent" />
                <button
                  onClick={() => setSelected(null)}
                  className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white/90 backdrop-blur hover:bg-black/70"
                  aria-label="Close"
                >
                  ✕
                </button>
                <motion.div layoutId={`title-${selected.id}`} className="absolute bottom-3 left-4 text-2xl font-bold text-white">
                  {selected.title}
                </motion.div>
              </div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="p-5">
                <div className="flex items-baseline justify-between">
                  <p className="text-white/65">{selected.blurb}</p>
                  <div className="text-xl font-bold text-accent">{selected.price}</div>
                </div>
                <ul className="mt-4 grid grid-cols-2 gap-2">
                  {selected.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/75">
                      <span className="text-accent">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button className="mt-5 w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-black hover:opacity-90">
                  Book this package
                </button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

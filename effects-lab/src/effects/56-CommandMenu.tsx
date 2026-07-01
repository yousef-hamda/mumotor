import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const COMMANDS = [
  { icon: '📅', label: 'Book a lesson', hint: 'B' },
  { icon: '🚗', label: 'Choose manual or automatic', hint: 'M' },
  { icon: '📦', label: 'View packages & pricing', hint: 'P' },
  { icon: '📍', label: 'Areas we cover', hint: 'A' },
  { icon: '⭐', label: 'Read reviews', hint: 'R' },
  { icon: '💬', label: 'Message on WhatsApp', hint: 'W' },
  { icon: '🎓', label: 'Mock test booking', hint: 'T' },
  { icon: '☎️', label: 'Call the instructor', hint: 'C' },
];

// A ⌘K palette where results re-rank with layout animation as you type and a
// highlight pill morphs (layoutId) to follow the selected row — search that
// feels like it thinks (Linear / Raycast).
export default function CommandMenu() {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const results = useMemo(
    () => COMMANDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())),
    [q],
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
  };

  return (
    <div className="grid h-[440px] w-full place-items-center px-6" style={{ background: 'radial-gradient(120% 120% at 50% 20%, #0e1326, #06070d)' }}>
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md overflow-hidden rounded-2xl border border-white/12 bg-ink-800/95 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
          <span className="text-white/40">⌘K</span>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setSel(0); }}
            onKeyDown={onKey}
            placeholder="Type a command or search…"
            className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {results.map((c, i) => (
            <motion.button
              key={c.label}
              layout
              onMouseEnter={() => setSel(i)}
              className="relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm"
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            >
              {sel === i && <motion.div layoutId="cmdk-active" className="absolute inset-0 rounded-lg bg-white/[0.08]" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
              <span className="relative">{c.icon}</span>
              <span className={`relative ${sel === i ? 'text-white' : 'text-white/70'}`}>{c.label}</span>
              <span className="relative ml-auto rounded border border-white/10 px-1.5 text-[11px] text-white/40">{c.hint}</span>
            </motion.button>
          ))}
          {!results.length && <div className="px-3 py-6 text-center text-sm text-white/40">No commands found</div>}
        </div>
      </motion.div>
    </div>
  );
}

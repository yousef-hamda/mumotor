import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type Toast = { id: number; title: string; body: string };
const MESSAGES = [
  { title: 'New booking', body: 'Maya booked Tue 14:30 — Manual.' },
  { title: 'Payment received', body: '₪2,390 · Pass package.' },
  { title: '5-star review', body: '“Calmest instructor ever.” — Yossi' },
  { title: 'Reminder sent', body: 'Tomorrow’s lesson reminder delivered.' },
  { title: 'Test passed 🎉', body: 'Dana passed first time!' },
];

// Stacked toasts behave like a deck: new ones push in, older ones scale back in
// 3D depth, and hovering expands the whole stack into a readable list.
export default function ToastStack() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [expanded, setExpanded] = useState(false);
  const nid = useRef(0);
  const mi = useRef(0);

  const add = () => {
    const m = MESSAGES[mi.current++ % MESSAGES.length];
    const id = ++nid.current;
    setToasts((t) => [{ id, ...m }, ...t].slice(0, 6));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  };
  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <div className="relative h-[440px] w-full" style={{ background: 'radial-gradient(120% 120% at 50% 0%, #0c1220, #06070d)' }}>
      <div className="grid h-full place-items-center">
        <button onClick={add} className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-black hover:opacity-90">Trigger a notification</button>
      </div>
      <div
        className="absolute bottom-5 right-5 w-80"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <AnimatePresence>
          {toasts.map((t, i) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{
                opacity: i > 3 ? 0 : 1,
                y: expanded ? -i * 76 : -i * 14,
                scale: expanded ? 1 : 1 - i * 0.05,
              }}
              exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              style={{ zIndex: 100 - i }}
              className="absolute bottom-0 right-0 w-80 rounded-2xl border border-white/12 bg-ink-800/95 p-4 shadow-2xl backdrop-blur"
            >
              <div className="flex items-start justify-between">
                <div className="text-sm font-semibold text-white">{t.title}</div>
                <button onClick={() => dismiss(t.id)} className="text-white/40 hover:text-white">✕</button>
              </div>
              <div className="mt-0.5 text-xs text-white/55">{t.body}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="pointer-events-none absolute bottom-5 left-5 text-xs font-medium text-white/45">Add a few, then hover the stack to expand</div>
    </div>
  );
}

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Mounts its children only while within ~800px of the viewport, and UNMOUNTS
 * them again once far away. This bounds the number of concurrent WebGL contexts
 * (the browser caps at ~16) and keeps the 59-effect page light. A fixed-height
 * placeholder preserves scroll position so nothing jumps.
 */
export function LazyStage({ h, children }: { h: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setActive(entries[0]?.isIntersecting ?? false),
      { rootMargin: '800px 0px 800px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ minHeight: h }}>
      {active ? (
        children
      ) : (
        <div
          className="grid h-full w-full place-items-center"
          style={{ minHeight: h, background: 'linear-gradient(180deg,#0b0d12,#080a0f)' }}
        >
          <div className="flex items-center gap-2 text-xs text-white/25">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/40" />
            scroll to load
          </div>
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode, type RefObject } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { usePrefersReducedMotion } from '../components/motion';

/** Canonical in-page section ids — every template uses these for anchor nav. */
export const SECTION_IDS = {
  hero: 'hero',
  stats: 'stats',
  packages: 'packages',
  about: 'about',
  areas: 'areas',
  reviews: 'reviews',
  faq: 'faq',
  book: 'book',
  contact: 'contact',
} as const;

export type SectionId = (typeof SECTION_IDS)[keyof typeof SECTION_IDS];

/** Smooth-scroll to a section by id (works on native window scroll). */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Track which section is currently in view (scroll-spy) so nav can highlight it.
 * Returns the active section id.
 */
export function useScrollSpy(ids: string[], rootMargin = '-45% 0px -50% 0px'): string {
  const [active, setActive] = useState(ids[0] ?? '');
  const key = ids.join(',');
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin, threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, rootMargin]);
  return active;
}

/**
 * Inject a template's Google Fonts stylesheet on mount and remove on unmount,
 * so each template's bespoke typography stays scoped and never leaks into the app.
 */
export function useTemplateFonts(hrefs: string[]) {
  const key = hrefs.join('|');
  useEffect(() => {
    const pre1 = document.createElement('link');
    pre1.rel = 'preconnect';
    pre1.href = 'https://fonts.googleapis.com';
    const pre2 = document.createElement('link');
    pre2.rel = 'preconnect';
    pre2.href = 'https://fonts.gstatic.com';
    pre2.crossOrigin = 'anonymous';
    const links = hrefs.map((href) => {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = href;
      return l;
    });
    [pre1, pre2, ...links].forEach((l) => document.head.appendChild(l));
    return () => {
      [pre1, pre2, ...links].forEach((l) => l.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/** Framer fade/rise entrance that honors reduced-motion. Look-neutral. */
export function Reveal({
  children,
  className,
  style,
  delay = 0,
  y = 22,
  x = 0,
  once = true,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  y?: number;
  x?: number;
  once?: boolean;
  as?: ElementType;
}) {
  const reduced = usePrefersReducedMotion();
  // Resolve the motion component from the proxy (motion.div/span/...) for the
  // common string-tag case; only fall back to motion.create() for components.
  const M = (typeof as === 'string' ? (motion as never)[as] : motion.create(as)) as ElementType;
  if (reduced)
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  return (
    <M
      className={className}
      style={style}
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </M>
  );
}

/** Count up a number once it scrolls into view. Honors reduced-motion. */
export function useCountUp(value: number, inView: boolean, duration = 1100) {
  const [n, setN] = useState(0);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setN(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, reduced]);
  return n;
}

// ── 3D / scroll helpers (look-neutral, reduced-motion safe) ─────────────────

/**
 * Pointer-driven 3D tilt for a card. Attach `ref` + the handlers to a
 * `motion.div`, and bind `rotateX`/`rotateY` to its `style` (with a
 * `transformPerspective`). No tilt under reduced-motion or on touch.
 */
export function useMouseTilt(maxDeg = 8): {
  ref: RefObject<HTMLDivElement>;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
} {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 150, damping: 18 });
  const rotateY = useSpring(ry, { stiffness: 150, damping: 18 });
  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (reduced) return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      rx.set(-py * maxDeg * 2);
      ry.set(px * maxDeg * 2);
    },
    [reduced, maxDeg, rx, ry]
  );
  const onMouseLeave = useCallback(() => {
    rx.set(0);
    ry.set(0);
  }, [rx, ry]);
  return { ref, rotateX, rotateY, onMouseMove, onMouseLeave };
}

/**
 * Scroll-linked vertical parallax for a layer. Attach `ref` to the element
 * whose scroll progress drives it, bind `y` to a `motion` child's style.
 * Distance collapses to 0 under reduced-motion.
 */
export function useScrollParallax(
  distance = 80,
  offset: [string, string] = ['start end', 'end start']
): { ref: RefObject<HTMLDivElement>; y: MotionValue<number>; progress: MotionValue<number> } {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { scrollYProgress } = useScroll({ target: ref, offset: offset as any });
  const d = reduced ? 0 : distance;
  const yRaw = useTransform(scrollYProgress, [0, 1], [d, -d]);
  const y = useSpring(yRaw, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return { ref, y, progress: scrollYProgress };
}

/**
 * Run a GSAP + ScrollTrigger setup inside a cleaned-up `gsap.context`
 * (auto-reverts all tweens/triggers on unmount). GSAP is dynamically imported
 * so it only loads for templates that use it. No-op under reduced-motion.
 */
export function useGsapScrollTrigger(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setup: (api: { gsap: any; ScrollTrigger: any }) => void,
  deps: unknown[] = []
) {
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (reduced) return;
    let killed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;
    (async () => {
      const gsap = (await import('gsap')).default;
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      if (killed) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => setup({ gsap, ScrollTrigger }));
    })();
    return () => {
      killed = true;
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export { usePrefersReducedMotion };

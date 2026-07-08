import { createContext, useCallback, useContext, useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode, type RefObject } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { usePrefersReducedMotion } from '../components/motion';

/**
 * True when a template renders inside Customize (editing) mode. Provided by
 * CustomizeMode via <EditingProvider>; defaults to false everywhere else
 * (live preview, published sites). Templates use it to force-expand collapsible
 * regions (e.g. FAQ answers) so every part stays clickable/editable.
 */
const EditingContext = createContext(false);
export const EditingProvider = EditingContext.Provider;
export function useIsEditing(): boolean {
  return useContext(EditingContext);
}

/** Localized "instructor's reply" label shown above a teacher's public reply to
 *  a review. Falls back to English for any unknown locale. */
export function reviewReplyLabel(locale?: string): string {
  return locale === 'he' ? 'תגובת המדריך' : locale === 'ar' ? 'رد المدرّب' : "Instructor's reply";
}

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
  ...rest
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
  // Forward extra (data-*) attributes so Customize's data-edit-item works on the wrapper.
  if (reduced)
    return (
      <div className={className} style={style} {...rest}>
        {children}
      </div>
    );
  return (
    <M
      className={className}
      style={style}
      {...rest}
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

/**
 * SCROLL-LINKED 3D tilt — the element continuously tilts back→flat (and scales
 * 0.92→1, fades in) as it scrolls through the viewport, exactly like the app's
 * `components/motion.tsx` ScrollTilt (`offset: ['start 0.95','center 0.55']`).
 * Unlike framer's window-only `useScroll`, this detects the nearest scrollable
 * ancestor and reads `getBoundingClientRect` each scroll frame, so the scrub
 * works in window scroll AND inner containers (builder preview / Customize).
 * Reduced-motion → renders flat, no listeners.
 */
export function EnterTilt({
  children,
  className,
  maxTilt = 14,
  perspective = 1000,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const p = useMotionValue(reduced ? 1 : 0);
  const rotateX = useSpring(useTransform(p, [0, 1], [maxTilt, 0]), { stiffness: 90, damping: 22 });
  const scale = useSpring(useTransform(p, [0, 1], [0.92, 1]), { stiffness: 90, damping: 22 });
  const opacity = useTransform(p, [0, 0.6], [0.4, 1]);

  useEffect(() => {
    if (reduced) { p.set(1); return; }
    const el = ref.current;
    if (!el) return;
    // Nearest ancestor that GENUINELY scrolls (overflow allows it AND content
    // overflows). A container that merely declares `overflow-y:auto` but lets
    // the window do the scrolling (e.g. the template root on /templates/:slug)
    // must be skipped, else the tilt freezes. Re-resolved per frame — content
    // can become scrollable after images/fonts load.
    const findScroller = (): HTMLElement | null => {
      let sp: HTMLElement | null = el.parentElement;
      while (sp && sp !== document.body && sp !== document.documentElement) {
        const oy = getComputedStyle(sp).overflowY;
        if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && sp.scrollHeight > sp.clientHeight + 1) return sp;
        sp = sp.parentElement;
      }
      return null; // the window scrolls
    };
    let raf = 0;
    const compute = () => {
      raf = 0;
      const sp = findScroller();
      const rect = el.getBoundingClientRect();
      const vTop = sp ? sp.getBoundingClientRect().top : 0;
      const vH = sp ? sp.clientHeight : window.innerHeight;
      // progress 0 when element top is at 95% of the viewport, 1 when its centre reaches 55%
      const d0 = vTop + 0.95 * vH - rect.top;
      const span = 0.4 * vH + rect.height / 2;
      p.set(Math.max(0, Math.min(1, d0 / Math.max(1, span))));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(compute); };
    compute();
    // Capture-phase window listener hears scroll from the window AND from any
    // inner scroll container (builder preview / Customize), whichever moves.
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, maxTilt]);

  if (reduced) return <div className={className}>{children}</div>;
  return (
    <div ref={ref} className={className} style={{ perspective }}>
      <motion.div style={{ rotateX, scale, opacity, transformStyle: 'preserve-3d', willChange: 'transform' }}>
        {children}
      </motion.div>
    </div>
  );
}

export { usePrefersReducedMotion };

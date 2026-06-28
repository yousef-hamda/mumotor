import { useEffect, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { motion } from 'framer-motion';
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

export { usePrefersReducedMotion };

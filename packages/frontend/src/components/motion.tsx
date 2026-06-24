import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  type MotionStyle,
} from 'framer-motion';
import { cn } from '../lib/utils';

/** True if the user prefers reduced motion. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
}

/** Observe an element; returns true once it enters the viewport (one-shot). */
export function useInView<T extends HTMLElement = HTMLDivElement>(rootMargin = '0px 0px -10% 0px') {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);
  return { ref, inView };
}

/** Fade + rise into view on scroll. Respects reduced motion. (CSS-based, drop-in.) */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: ElementType;
}) {
  const { ref, inView } = useInView();
  return (
    <Tag ref={ref as never} className={cn('reveal', inView && 'in', className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

/** Spring fade-up using framer-motion. Use for hero/section content. */
export function FadeUp({
  children,
  delay = 0,
  y = 24,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Staggered children container. Wrap items in <Stagger.Item>. */
export function Stagger({ children, className, gap = 0.08 }: { children: ReactNode; className?: string; gap?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}
Stagger.Item = function StaggerItem({ children, className, y = 22 }: { children: ReactNode; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      variants={{ hidden: { opacity: 0, y }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } }}
    >
      {children}
    </motion.div>
  );
};

/** Interactive 3D tilt card that reacts to the pointer. Falls back to static when reduced motion. */
export function Tilt({
  children,
  className,
  max = 9,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 180, damping: 18 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 180, damping: 18 });
  const glareX = useTransform(px, [0, 1], ['0%', '100%']);

  if (reduced) return <div className={className}>{children}</div>;

  function onMove(e: React.PointerEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  }
  function reset() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d', transformPerspective: 900 } as MotionStyle}
      className={cn('relative', className)}
    >
      {children}
      {glare && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 hover:opacity-100"
          style={{ background: useTransform(glareX, (x) => `radial-gradient(420px circle at ${x} 0%, rgba(255,255,255,0.35), transparent 45%)`) }}
        />
      )}
    </motion.div>
  );
}

/** Magnetic wrapper — the element drifts toward the pointer. Great for CTAs. */
export function Magnetic({ children, className, strength = 0.4 }: { children: ReactNode; className?: string; strength?: number }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 16 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 16 });
  if (reduced) return <div className={cn('inline-flex', className)}>{children}</div>;
  function onMove(e: React.PointerEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }
  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x, y }}
      className={cn('inline-flex', className)}
    >
      {children}
    </motion.div>
  );
}

/** Infinite horizontal marquee. Children are duplicated for a seamless loop. */
export function Marquee({ children, className, speed = 32, reverse = false }: { children: ReactNode; className?: string; speed?: number; reverse?: boolean }) {
  return (
    <div className={cn('group relative flex overflow-hidden', className)}>
      <div
        className="flex shrink-0 items-center gap-10 pe-10"
        style={{ animation: `marquee ${speed}s linear infinite`, animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        {children}
      </div>
      <div
        aria-hidden
        className="flex shrink-0 items-center gap-10 pe-10"
        style={{ animation: `marquee ${speed}s linear infinite`, animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        {children}
      </div>
    </div>
  );
}

/** Scroll-linked parallax. Wrap any decorative element. */
export function Parallax({ children, className, distance = 80 }: { children: ReactNode; className?: string; distance?: number }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={reduced ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}

/** Animated number count-up when scrolled into view. */
export function CountUp({ value, suffix = '', prefix = '', duration = 1100 }: { value: number; suffix?: string; prefix?: string; duration?: number }) {
  const { ref, inView } = useInView();
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
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, reduced]);
  return (
    <span ref={ref as never}>
      {prefix}
      {n.toLocaleString()}
      {suffix}
    </span>
  );
}

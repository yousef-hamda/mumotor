import { useEffect, useState } from 'react';

/**
 * Device-adaptive hooks (June 2026 responsive pass).
 *
 * Everything here reacts to the ACTUAL device automatically — width, pointer type,
 * hover capability — via `window.matchMedia`. There is deliberately NO user-facing
 * "mobile / desktop" toggle: the layout adapts to whatever device the site is opened
 * on. CSS media queries do the heavy lifting; these hooks are for the few places where
 * JS behaviour must branch (e.g. tap-to-edit vs hover-to-edit in Customize).
 *
 * All hooks are SSR-safe (guard `window`) and clean up their listeners.
 */

/** Core primitive: subscribe to a media query, re-render when its match changes. */
export function useMediaQuery(query: string): boolean {
  const read = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false;

  const [matches, setMatches] = useState(read);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange(); // sync in case it changed between render and effect
    // Safari <14 only supports the deprecated addListener/removeListener.
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, [query]);

  return matches;
}

export type Breakpoint = 'phone' | 'tablet' | 'desktop';

/**
 * Current viewport bucket (matches the Tailwind contract used across the app):
 *   phone  < 640px  ·  tablet 640–1023px  ·  desktop ≥ 1024px
 */
export function useBreakpoint(): Breakpoint {
  const tabletUp = useMediaQuery('(min-width: 640px)');
  const desktopUp = useMediaQuery('(min-width: 1024px)');
  if (desktopUp) return 'desktop';
  if (tabletUp) return 'tablet';
  return 'phone';
}

/** True below the Tailwind `sm` breakpoint (< 640px). */
export function useIsPhone(): boolean {
  return !useMediaQuery('(min-width: 640px)');
}

/** True below the Tailwind `lg` breakpoint (< 1024px) — phone OR tablet. */
export function useIsCompact(): boolean {
  return !useMediaQuery('(min-width: 1024px)');
}

/** Coarse pointer = finger / stylus is the primary input (phones, most tablets). */
export function usePointerCoarse(): boolean {
  return useMediaQuery('(pointer: coarse)');
}

/**
 * Touch-first device that cannot reliably hover. Drives tap-vs-hover affordances
 * (e.g. Customize reveals per-item controls on tap here instead of on mouse-move).
 */
export function useIsTouch(): boolean {
  return useMediaQuery('(hover: none), (pointer: coarse)');
}

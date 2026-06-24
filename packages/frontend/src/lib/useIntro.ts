import { useCallback, useEffect, useState } from 'react';

/**
 * Drives the cinematic intro gate. First visit in a session shows the
 * "Start engine" gate; afterwards (or with reduced-motion) it skips straight
 * to the revealed site. Phase: gate → driving → revealed.
 */
export type IntroPhase = 'gate' | 'driving' | 'revealed';

const SEEN_KEY = 'mm_intro_seen';

export function useIntro() {
  // Start hidden-but-ready; decide on mount to avoid SSR/flash issues.
  const [phase, setPhase] = useState<IntroPhase>('gate');
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === '1';
    } catch {
      /* private mode */
    }
    setReduced(prefersReduced);
    if (prefersReduced || seen) setPhase('revealed');
    setReady(true);
  }, []);

  const start = useCallback(() => setPhase('driving'), []);

  const finish = useCallback(() => {
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* noop */
    }
    setPhase('revealed');
  }, []);

  return { phase, reduced, ready, start, finish, skip: finish };
}

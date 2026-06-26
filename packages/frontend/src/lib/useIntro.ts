import { useEffect, useState } from 'react';

/**
 * The cinematic "start engine" intro gate has been removed in favour of a
 * clean, immediate landing experience. This hook is kept (and intentionally
 * tiny) so any remaining importers keep compiling; it only reports the user's
 * reduced-motion preference and never gates or hides the page.
 */
export function useIntro() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);

  return { reduced };
}

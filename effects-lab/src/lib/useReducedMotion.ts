import { useEffect, useState } from 'react';

/** True when the user prefers reduced motion. Live-updates if the OS setting changes. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** True on touch / no-hover devices — used to disable pointer-driven effects. */
export function useIsTouch(): boolean {
  const [touch, setTouch] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia('(hover: none)').matches,
  );
  useEffect(() => {
    const mq = matchMedia('(hover: none)');
    const on = () => setTouch(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return touch;
}

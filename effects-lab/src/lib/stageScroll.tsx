import { createContext, useContext } from 'react';
import type { MotionValue } from 'framer-motion';

/**
 * Per-effect "local scroll": when the pointer is over an effect frame, wheel
 * events drive THIS context (a 0..1 progress + a decaying velocity) instead of
 * the page. Scroll-driven effects read it via useScrollProgress() / useStageScroll()
 * so you can scrub them in place without the whole page moving.
 */
export type StageScroll = {
  /** 0..1 accumulated wheel progress for the hovered frame. */
  progress: number;
  /** True once the user has wheel-scrolled this frame (so reveal effects switch
   *  from "reveal on enter view" to "scrub by frame scroll"). */
  touched: boolean;
  /** Signed, decaying wheel velocity (for velocity-reactive effects). */
  velocityMV: MotionValue<number>;
  velocityRef: { current: number };
};

export const StageScrollContext = createContext<StageScroll | null>(null);
export const useStageScroll = () => useContext(StageScrollContext);

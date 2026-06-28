import { useCallback, useState } from 'react';
import type { Customization } from '../../templates/customize/overrides';

export interface HistoryApi {
  current: Customization;
  set: (next: Customization) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
}

interface State {
  stack: Customization[];
  idx: number;
}

/** Undo/redo history for the customization overrides. */
export function useHistory(initial: Customization): HistoryApi {
  const [{ stack, idx }, setState] = useState<State>({ stack: [initial ?? {}], idx: 0 });

  const set = useCallback((next: Customization) => {
    setState((s) => {
      const base = s.stack.slice(0, s.idx + 1);
      const stackNext = [...base, next];
      return { stack: stackNext, idx: stackNext.length - 1 };
    });
  }, []);

  const undo = useCallback(() => setState((s) => ({ ...s, idx: Math.max(0, s.idx - 1) })), []);
  const redo = useCallback(() => setState((s) => ({ ...s, idx: Math.min(s.stack.length - 1, s.idx + 1) })), []);
  const reset = useCallback(
    () =>
      setState((s) => {
        const stackNext = [...s.stack.slice(0, s.idx + 1), {} as Customization];
        return { stack: stackNext, idx: stackNext.length - 1 };
      }),
    []
  );

  return {
    current: stack[idx] ?? {},
    set,
    undo,
    redo,
    reset,
    canUndo: idx > 0,
    canRedo: idx < stack.length - 1,
    undoCount: idx,
    redoCount: stack.length - 1 - idx,
  };
}

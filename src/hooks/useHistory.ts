import { useCallback, useRef, useState } from 'react';

const MAX_HISTORY = 60;

/**
 * Generic undo/redo stack. Settings objects are small (a couple dozen
 * numbers/strings) so we store full snapshots rather than diffs — simpler,
 * and cheap at this size per the "compact representation" goal.
 *
 * `commit` pushes a new history entry immediately (use for discrete actions:
 * preset picks, toggles). `liveUpdate` mutates the *current* entry without
 * growing history (use while a slider is being dragged), and `commitLive`
 * finalizes that entry into history once the drag ends — this keeps history
 * from filling up with one entry per pixel of slider movement.
 */
export function useHistory<T>(initial: T) {
  const [present, setPresent] = useState(initial);
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);

  const commit = useCallback((next: T) => {
    setPast((p) => [...p, present].slice(-MAX_HISTORY));
    setFuture([]);
    setPresent(next);
  }, [present]);

  const liveUpdate = useCallback((next: T) => {
    setPresent(next);
  }, []);

  const commitLive = useCallback((baseline: T) => {
    setPast((p) => [...p, baseline].slice(-MAX_HISTORY));
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      setFuture((f) => [present, ...f]);
      setPresent(previous);
      return p.slice(0, -1);
    });
  }, [present]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setPast((p) => [...p, present]);
      setPresent(next);
      return f.slice(1);
    });
  }, [present]);

  const reset = useCallback((value: T) => {
    setPast([]);
    setFuture([]);
    setPresent(value);
  }, []);

  return {
    value: present,
    commit,
    liveUpdate,
    commitLive,
    undo,
    redo,
    reset,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
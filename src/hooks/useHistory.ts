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
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const [, forceRender] = useState(0);

  const commit = useCallback((next: T) => {
    past.current = [...past.current, present].slice(-MAX_HISTORY);
    future.current = [];
    setPresent(next);
  }, [present]);

  const liveUpdate = useCallback((next: T) => {
    setPresent(next);
  }, []);

  const commitLive = useCallback((baseline: T) => {
    past.current = [...past.current, baseline].slice(-MAX_HISTORY);
    future.current = [];
    forceRender((n) => n + 1);
  }, []);

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    const previous = past.current[past.current.length - 1];
    past.current = past.current.slice(0, -1);
    future.current = [present, ...future.current];
    setPresent(previous);
  }, [present]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    const next = future.current[0];
    future.current = future.current.slice(1);
    past.current = [...past.current, present];
    setPresent(next);
  }, [present]);

  const reset = useCallback((value: T) => {
    past.current = [];
    future.current = [];
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
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
import { useEffect } from 'react';

export interface ShortcutDef {
  key: string; // e.g. 'o', 's', 'z', '+', '-', '0', 'f'
  meta?: boolean; // Cmd on Mac / Ctrl on Windows-Linux, checked via metaKey || ctrlKey
  shift?: boolean;
  handler: () => void;
  /** Allow firing even while a text input/select has focus (rare — most shortcuts should NOT do this). */
  allowInInputs?: boolean;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

export function useKeyboardShortcuts(shortcuts: ShortcutDef[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const typing = isTypingTarget(e.target);
      for (const s of shortcuts) {
        const metaOk = s.meta ? e.metaKey || e.ctrlKey : !e.metaKey && !e.ctrlKey;
        const shiftOk = s.shift ? e.shiftKey : !e.shiftKey;
        if (e.key.toLowerCase() === s.key.toLowerCase() && metaOk && shiftOk) {
          if (typing && !s.allowInInputs) continue;
          e.preventDefault();
          s.handler();
          return;
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcuts, enabled]);
}
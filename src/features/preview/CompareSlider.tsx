import { useCallback, useRef, useState, type ReactNode } from 'react';
import { GripVertical } from 'lucide-react';

interface CompareSliderProps {
  before: ReactNode;
  after: ReactNode;
}

export function CompareSlider({ before, after }: CompareSliderProps) {
  const [percent, setPercent] = useState(50); // % of width showing "after" (left side)
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPercent(Math.min(100, Math.max(0, pct)));
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full select-none"
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        updateFromClientX(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && updateFromClientX(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
    >
      <div className="absolute inset-0">{before}</div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}>
        {after}
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 flex w-0 items-center justify-center"
        style={{ left: `${percent}%` }}
      >
        <div className="h-full w-px bg-phosphor/80" />
        <div className="pointer-events-auto absolute flex h-8 w-8 -translate-x-1/2 cursor-ew-resize items-center justify-center rounded-full border border-phosphor/70 bg-ink-900 text-phosphor shadow-lg">
          <GripVertical size={14} />
        </div>
      </div>
      <span className="pointer-events-none absolute left-2 top-2 rounded bg-ink-950/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-paper-300">
        Pixel Art
      </span>
      <span className="pointer-events-none absolute right-2 top-2 rounded bg-ink-950/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-paper-300">
        Original
      </span>
    </div>
  );
}
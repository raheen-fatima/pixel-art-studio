import type { ReactNode } from 'react';

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded bg-ink-950 px-2 py-1 text-[11px] text-paper-100 opacity-0 shadow-lg ring-1 ring-ink-600 transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
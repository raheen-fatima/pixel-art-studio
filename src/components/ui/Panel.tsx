import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface PanelProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  eyebrow?: string;
}

export function Panel({ title, children, defaultOpen = true, eyebrow }: PanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-ink-800">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-ink-900/60"
      >
        <span>
          {eyebrow && <span className="mr-2 font-mono text-[10px] uppercase tracking-wider text-paper-500">{eyebrow}</span>}
          <span className="text-sm font-semibold text-paper-100">{title}</span>
        </span>
        <ChevronDown size={15} className={`text-paper-500 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="space-y-4 px-4 pb-4">{children}</div>}
    </section>
  );
}
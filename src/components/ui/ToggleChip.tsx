interface ToggleChipProps {
  label: string;
  pressed: boolean;
  onChange: (pressed: boolean) => void;
}

export function ToggleChip({ label, pressed, onChange }: ToggleChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onChange(!pressed)}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-phosphor ${
        pressed
          ? 'border-phosphor/50 bg-phosphor/15 text-phosphor'
          : 'border-ink-600 bg-ink-800 text-paper-300 hover:border-ink-500'
      }`}
    >
      {label}
    </button>
  );
}
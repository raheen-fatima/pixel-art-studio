import { useId } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function Select({ label, value, options, onChange, disabled }: SelectProps) {
  const id = useId();
  return (
    <div className={disabled ? 'opacity-40' : ''}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-paper-300">
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-ink-600 bg-ink-800 px-2.5 py-1.5 text-sm text-paper-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-phosphor"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
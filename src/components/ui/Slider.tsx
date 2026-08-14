import { useId } from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
  /** Fired once when the drag/keyboard interaction ends — use for history commits. */
  onCommit?: (value: number) => void;
  /** Fired once at the start of a drag/keyboard interaction — use to snapshot a history baseline. */
  onDragStart?: () => void;
  hint?: string;
}

export function Slider({ label, value, min, max, step = 1, unit = '', disabled, onChange, onCommit, onDragStart, hint }: SliderProps) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={disabled ? 'opacity-40' : ''}>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-medium text-paper-300" title={hint}>
          {label}
        </label>
        <span className="font-mono text-[11px] tabular-nums text-phosphor">
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseDown={() => onDragStart?.()}
        onTouchStart={() => onDragStart?.()}
        onKeyDown={() => onDragStart?.()}
        onMouseUp={() => onCommit?.(value)}
        onTouchEnd={() => onCommit?.(value)}
        onKeyUp={() => onCommit?.(value)}
        className="slider-track w-full"
        style={{ ['--fill-pct' as string]: `${pct}%` }}
      />
    </div>
  );
}
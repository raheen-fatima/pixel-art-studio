import { Plus, X } from 'lucide-react';
import type { RGB } from '../../types';
import { rgbToHex, hexToRgb } from '../../utils/color';

interface PaletteGridProps {
  colors: RGB[];
  editable: boolean;
  onChange?: (colors: RGB[]) => void;
}

export function PaletteGrid({ colors, editable, onChange }: PaletteGridProps) {
  const update = (i: number, hex: string) => {
    if (!onChange) return;
    const next = [...colors];
    next[i] = hexToRgb(hex);
    onChange(next);
  };
  const remove = (i: number) => {
    if (!onChange) return;
    onChange(colors.filter((_, idx) => idx !== i));
  };
  const add = () => {
    if (!onChange) return;
    onChange([...colors, { r: 255, g: 255, b: 255 }]);
  };

  return (
    <div className="flex flex-wrap gap-1.5" role="list" aria-label="Palette colors">
      {colors.map((c, i) => (
        <div key={i} role="listitem" className="group relative">
          {editable ? (
            <label className="block h-7 w-7 cursor-pointer rounded-md ring-1 ring-ink-600" style={{ backgroundColor: rgbToHex(c) }}>
              <input
                type="color"
                value={rgbToHex(c)}
                onChange={(e) => update(i, e.target.value)}
                className="sr-only"
                aria-label={`Palette color ${i + 1}`}
              />
            </label>
          ) : (
            <div className="h-7 w-7 rounded-md ring-1 ring-ink-600" style={{ backgroundColor: rgbToHex(c) }} title={rgbToHex(c)} />
          )}
          {editable && colors.length > 2 && (
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove color ${i + 1}`}
              className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-danger text-white group-hover:flex"
            >
              <X size={10} />
            </button>
          )}
        </div>
      ))}
      {editable && (
        <button
          type="button"
          onClick={add}
          aria-label="Add color"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-ink-600 text-paper-500 hover:border-phosphor hover:text-phosphor"
        >
          <Plus size={13} />
        </button>
      )}
    </div>
  );
}
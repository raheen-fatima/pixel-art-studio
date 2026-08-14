import { PALETTE_PRESETS } from '../../image-processing/palettes';
import { rgbToHex } from '../../utils/color';
import type { PresetId } from '../../types';

interface PresetSelectorProps {
  activePreset: PresetId;
  onSelect: (id: PresetId) => void;
}

export function PresetSelector({ activePreset, onSelect }: PresetSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {PALETTE_PRESETS.map((preset) => {
        const isActive = preset.id === activePreset;
        const swatches = preset.colors?.slice(0, 4) ?? [];
        return (
          <button
            key={preset.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(preset.id)}
            className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 transition-colors duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-phosphor ${
              isActive ? 'border-phosphor/60 bg-phosphor/10' : 'border-ink-700 bg-ink-900/60 hover:border-ink-600'
            }`}
          >
            <span className="flex h-4 gap-0.5">
              {swatches.length > 0 ? (
                swatches.map((c, i) => (
                  <span key={i} className="h-4 w-2 rounded-[2px]" style={{ backgroundColor: rgbToHex(c) }} />
                ))
              ) : (
                <span className="bg-checker bg-checker-sm h-4 w-8 rounded-[2px] bg-ink-700" />
              )}
            </span>
            <span className={`text-[11px] font-medium ${isActive ? 'text-phosphor' : 'text-paper-300'}`}>{preset.label}</span>
          </button>
        );
      })}
    </div>
  );
}
import { useRef } from 'react';
import { Panel } from '../../components/ui/Panel';
import { Slider } from '../../components/ui/Slider';
import { Select } from '../../components/ui/Select';
import { ToggleChip } from '../../components/ui/ToggleChip';
import { PresetSelector } from './PresetSelector';
import { PaletteGrid } from './PaletteGrid';
import { getPreset } from '../../image-processing/palettes';
import type { DitherMode, EditorSettings, PresetId, RGB } from '../../types';

interface ControlsPanelProps {
  settings: EditorSettings;
  activePalette: RGB[];
  onLive: (next: EditorSettings) => void;
  onCommit: (next: EditorSettings) => void;
  onCommitLiveBaseline: (baseline: EditorSettings) => void;
}

const DITHER_OPTIONS: { value: DitherMode; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'bayer', label: 'Ordered (Bayer)' },
  { value: 'floyd-steinberg', label: 'Floyd–Steinberg' },
];

export function ControlsPanel({ settings, activePalette, onLive, onCommit, onCommitLiveBaseline }: ControlsPanelProps) {
  // Groups rapid slider-drag input into a single undo step: the baseline is
  // captured once at drag start and only pushed to history when the drag
  // ends, instead of on every intermediate value.
  const dragBaseline = useRef<EditorSettings | null>(null);
  const beginDrag = () => {
    if (dragBaseline.current === null) dragBaseline.current = settings;
  };
  const endDrag = () => {
    if (dragBaseline.current) {
      onCommitLiveBaseline(dragBaseline.current);
      dragBaseline.current = null;
    }
  };

  const preset = getPreset(settings.presetId);
  const isFixedPalette = settings.paletteMode === 'preset' && !!preset.colors;
  const isCustomPalette = settings.paletteMode === 'custom';

  const selectPreset = (id: PresetId) => {
    const p = getPreset(id);
    onCommit({
      ...settings,
      presetId: id,
      paletteMode: id === 'original' ? 'original' : id === 'custom' ? 'custom' : 'preset',
      customPalette: id === 'custom' && settings.customPalette.length === 0
        ? [{ r: 20, g: 20, b: 24 }, { r: 126, g: 231, b: 135 }, { r: 241, g: 239, b: 233 }]
        : settings.customPalette,
      maxColors: p.suggestedColorCount ?? settings.maxColors,
    });
  };

  return (
    <div>
      <Panel title="Pixelation" eyebrow="01" defaultOpen>
        <Slider
          label="Pixel Size"
          value={settings.pixelSize}
          min={1}
          max={64}
          unit="px"
          hint="How many source pixels are merged into one pixel-art block"
          onChange={(v) => onLive({ ...settings, pixelSize: v })}
          onDragStart={beginDrag}
          onCommit={endDrag}
        />
      </Panel>

      <Panel title="Colors" eyebrow="02" defaultOpen>
        <PresetSelector activePreset={settings.presetId} onSelect={selectPreset} />

        {!isFixedPalette && (
          <Slider
            label="Max Colors"
            value={settings.maxColors}
            min={2}
            max={256}
            hint="Palette size generated from the image via median-cut quantization"
            onChange={(v) => onLive({ ...settings, maxColors: v })}
            onDragStart={beginDrag}
            onCommit={endDrag}
          />
        )}

        <div>
          <p className="mb-1.5 text-xs font-medium text-paper-300">
            {isCustomPalette ? 'Custom Palette' : 'Active Palette'}
          </p>
          <PaletteGrid
            colors={isCustomPalette ? settings.customPalette : activePalette}
            editable={isCustomPalette}
            onChange={(colors) => onCommit({ ...settings, customPalette: colors })}
          />
        </div>
      </Panel>

      <Panel title="Adjustments" eyebrow="03" defaultOpen={false}>
        {([
          ['Brightness', 'brightness', -100, 100] as const,
          ['Contrast', 'contrast', -100, 100] as const,
          ['Saturation', 'saturation', -100, 100] as const,
          ['Hue', 'hue', -180, 180] as const,
          ['Exposure', 'exposure', -100, 100] as const,
          ['Sharpness', 'sharpness', 0, 100] as const,
        ]).map(([label, key, min, max]) => (
          <Slider
            key={key}
            label={label}
            value={settings[key]}
            min={min}
            max={max}
            onChange={(v) => onLive({ ...settings, [key]: v })}
            onDragStart={beginDrag}
            onCommit={endDrag}
          />
        ))}
      </Panel>

      <Panel title="Dithering" eyebrow="04" defaultOpen={false}>
        <Select
          label="Algorithm"
          value={settings.dither}
          options={DITHER_OPTIONS}
          onChange={(v) => onCommit({ ...settings, dither: v as DitherMode })}
        />
        <Slider
          label="Strength"
          value={settings.ditherStrength}
          min={0}
          max={100}
          unit="%"
          disabled={settings.dither === 'none'}
          onChange={(v) => onLive({ ...settings, ditherStrength: v })}
          onDragStart={beginDrag}
          onCommit={endDrag}
        />
      </Panel>

      <Panel title="Style" eyebrow="05" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          <ToggleChip label="Hard Edges" pressed={settings.hardEdges} onChange={(v) => onCommit({ ...settings, hardEdges: v })} />
          <ToggleChip label="High Contrast" pressed={settings.highContrast} onChange={(v) => onCommit({ ...settings, highContrast: v })} />
          <ToggleChip label="Retro Grading" pressed={settings.retroGrading} onChange={(v) => onCommit({ ...settings, retroGrading: v })} />
        </div>
        <p className="text-[11px] leading-relaxed text-paper-500">
          Hard Edges thresholds transparency to fully solid or clear, for a crisp cutout look instead of soft
          antialiased fringes.
        </p>
      </Panel>
    </div>
  );
}
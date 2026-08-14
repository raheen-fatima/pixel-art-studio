import { Download, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import type { ExportFormat, ExportScale, ProcessedResult } from '../../types';

interface ExportPanelProps {
  result: ProcessedResult | null;
  pixelSize: number;
  format: ExportFormat;
  scale: ExportScale;
  onFormatChange: (format: ExportFormat) => void;
  onScaleChange: (scale: ExportScale) => void;
  onExport: () => void;
  isExporting: boolean;
  error: string | null;
}

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: 'png', label: 'PNG — lossless, supports transparency' },
  { value: 'webp', label: 'WebP — smaller file size' },
];

const SCALE_OPTIONS: { value: ExportScale; label: string }[] = [
  { value: 1, label: '1× — current resolution' },
  { value: 2, label: '2×' },
  { value: 4, label: '4×' },
  { value: 8, label: '8×' },
];

export function ExportPanel({
  result,
  pixelSize,
  format,
  scale,
  onFormatChange,
  onScaleChange,
  onExport,
  isExporting,
  error,
}: ExportPanelProps) {
  return (
    <div className="space-y-3 border-t border-ink-800 p-4">
      <Select label="Format" value={format} options={FORMAT_OPTIONS} onChange={(v) => onFormatChange(v as ExportFormat)} />
      <Select
        label="Resolution"
        value={String(scale)}
        options={SCALE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
        onChange={(v) => onScaleChange(Number(v) as ExportScale)}
      />
      <Button
        variant="primary"
        className="w-full"
        disabled={!result || isExporting}
        onClick={onExport}
        icon={isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      >
        {isExporting ? 'Exporting…' : 'Export Image'}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      {result && (
        <p className="font-mono text-[10px] text-paper-500">
          Output: {result.gridWidth * Math.max(1, Math.round(pixelSize * scale))}×
          {result.gridHeight * Math.max(1, Math.round(pixelSize * scale))}px
        </p>
      )}
    </div>
  );
}

export async function renderExportCanvas(result: ProcessedResult, pixelSize: number, scale: ExportScale): Promise<HTMLCanvasElement> {
  // "Current resolution" restores roughly the source image's dimensions
  // (grid cell size = pixelSize); each additional x multiplies that further.
  // Both stages use nearest-neighbor (no smoothing), so no interpolation is
  // ever introduced — the whole point of exporting pixel art.
  const perCellSize = Math.max(1, Math.round(pixelSize * scale));

  const tmp = document.createElement('canvas');
  tmp.width = result.gridWidth;
  tmp.height = result.gridHeight;
  const tctx = tmp.getContext('2d');
  if (!tctx) throw new Error('Canvas unavailable in this browser.');
  tctx.putImageData(result.gridData, 0, 0);

  const out = document.createElement('canvas');
  out.width = result.gridWidth * perCellSize;
  out.height = result.gridHeight * perCellSize;
  const octx = out.getContext('2d');
  if (!octx) throw new Error('Canvas unavailable in this browser.');
  octx.imageSmoothingEnabled = false;
  octx.drawImage(tmp, 0, 0, out.width, out.height);
  return out;
}

export function exportFileName(sourceName: string, result: ProcessedResult, format: ExportFormat): string {
  const withoutExt = sourceName.replace(/\.[^./]+$/, '');
  const clean = withoutExt.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'pixel-art';
  return `${clean}-${result.gridWidth}x${result.gridHeight}.${format}`;
}
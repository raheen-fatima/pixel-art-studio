import type { EditorSettings, RGB } from '../types';
import { computeGridDimensions, downsampleToGrid } from './resize';
import { applyColorAdjustments, applySharpness, applyHardEdges } from './adjust';
import { medianCutPalette, samplePixelsForPalette } from './quantize';
import { quantizeFlat, quantizeBayer, quantizeFloydSteinberg } from './dither';
import { getPreset } from './palettes';

export interface PipelineOutput {
  gridData: ImageData;
  gridWidth: number;
  gridHeight: number;
  paletteUsed: RGB[];
}

/**
 * Full conversion pipeline, pure and framework-free so it can run identically
 * on the main thread (small live-preview passes) or inside the Web Worker
 * (full-quality passes) without any adaptation.
 *
 *   source ImageData
 *     -> box-filter downsample to pixel grid
 *     -> brightness/contrast/saturation/hue/exposure/sharpness
 *     -> palette build (fixed preset, custom swatches, or median-cut)
 *     -> quantize (+ optional dithering)
 *     -> hard-edge alpha threshold (optional)
 */
export function runPipeline(source: ImageData, settings: EditorSettings): PipelineOutput {
  const { gridWidth, gridHeight } = computeGridDimensions(source.width, source.height, settings.pixelSize);
  const grid = downsampleToGrid(source, gridWidth, gridHeight);

  applyColorAdjustments(grid, settings);
  applySharpness(grid, settings.sharpness);

  const palette = buildPalette(grid, settings);

  switch (settings.dither) {
    case 'bayer':
      quantizeBayer(grid, palette, settings.ditherStrength);
      break;
    case 'floyd-steinberg':
      quantizeFloydSteinberg(grid, palette, settings.ditherStrength);
      break;
    default:
      quantizeFlat(grid, palette);
      break;
  }

  if (settings.hardEdges) {
    applyHardEdges(grid);
  }

  return { gridData: grid, gridWidth, gridHeight, paletteUsed: palette };
}

function buildPalette(grid: ImageData, settings: EditorSettings): RGB[] {
  if (settings.paletteMode === 'custom' && settings.customPalette.length > 0) {
    return settings.customPalette;
  }

  const preset = getPreset(settings.presetId);
  if (settings.paletteMode === 'preset' && preset.colors) {
    return preset.colors;
  }

  // Derived palette: median-cut over the grid's own colors.
  const samples = samplePixelsForPalette(grid.data);
  const target = settings.paletteMode === 'preset' ? preset.suggestedColorCount ?? settings.maxColors : settings.maxColors;
  return medianCutPalette(samples, target);
}
// ---------------------------------------------------------------------------
// Core domain types shared between the UI, the processing pipeline, and the
// worker. Keeping these framework-agnostic means image-processing.ts and
// workers/*.ts never need to import React.
// ---------------------------------------------------------------------------

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export type DitherMode = 'none' | 'bayer' | 'floyd-steinberg';

export type PaletteMode = 'original' | 'preset' | 'custom';

export type PresetId =
  | 'original'
  | 'gameboy'
  | 'nes'
  | 'arcade'
  | 'monochrome'
  | 'retro'
  | 'bit8'
  | 'bit16'
  | 'custom';

export interface PalettePreset {
  id: PresetId;
  label: string;
  /** Fixed color list, or undefined when colors should be derived (median-cut). */
  colors?: RGB[];
  /** Suggested max-color count when this preset drives median-cut instead. */
  suggestedColorCount?: number;
}

/** Every knob in the editor. Kept flat and JSON-serializable for history + workers. */
export interface EditorSettings {
  // Pixelation
  pixelSize: number; // source pixels averaged into one output "pixel"

  // Color
  paletteMode: PaletteMode;
  presetId: PresetId;
  maxColors: number; // used when paletteMode !== 'preset' with fixed colors
  customPalette: RGB[];

  // Adjustments
  brightness: number; // -100..100
  contrast: number; // -100..100
  saturation: number; // -100..100
  hue: number; // -180..180
  sharpness: number; // 0..100
  exposure: number; // -100..100

  // Dithering
  dither: DitherMode;
  ditherStrength: number; // 0..100, only used for bayer/floyd-steinberg

  // Style
  hardEdges: boolean; // threshold alpha to 0/255 instead of smooth falloff
  highContrast: boolean;
  retroGrading: boolean;
}

export const DEFAULT_SETTINGS: EditorSettings = {
  pixelSize: 6,
  paletteMode: 'original',
  presetId: 'original',
  maxColors: 32,
  customPalette: [],
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  sharpness: 0,
  exposure: 0,
  dither: 'none',
  ditherStrength: 50,
  hardEdges: false,
  highContrast: false,
  retroGrading: false,
};

export interface SourceImage {
  bitmap: ImageBitmap;
  width: number;
  height: number;
  name: string;
  hasAlpha: boolean;
}

export interface ProcessedResult {
  /** Low-res quantized pixel grid — the actual "pixel art". */
  gridData: ImageData;
  gridWidth: number;
  gridHeight: number;
  /** Palette actually used to render this result (for swatches / export metadata). */
  paletteUsed: RGB[];
  durationMs: number;
}

export type AppPhase =
  | 'empty'
  | 'loading-file'
  | 'loading-url'
  | 'camera-permission'
  | 'camera-live'
  | 'ready'
  | 'processing'
  | 'error';

export interface AppError {
  title: string;
  detail: string;
}

export type ExportFormat = 'png' | 'webp';
export type ExportScale = 1 | 2 | 4 | 8;

// Messages exchanged with the pixelate worker.
export interface WorkerRequest {
  type: 'process';
  requestId: number;
  buffer: ArrayBuffer;
  width: number;
  height: number;
  settings: EditorSettings;
}

export interface WorkerSuccessResponse {
  type: 'result';
  requestId: number;
  buffer: ArrayBuffer;
  gridWidth: number;
  gridHeight: number;
  paletteUsed: RGB[];
  durationMs: number;
}

export interface WorkerErrorResponse {
  type: 'error';
  requestId: number;
  message: string;
}

export type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse;
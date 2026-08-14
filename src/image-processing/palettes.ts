import type { PalettePreset, RGB } from '../types';

const hex = (h: string): RGB => ({
  r: parseInt(h.slice(0, 2), 16),
  g: parseInt(h.slice(2, 4), 16),
  b: parseInt(h.slice(4, 6), 16),
});

// Game Boy — the original 4-shade DMG "soup" green LCD palette.
const GAMEBOY: RGB[] = ['0f380f', '306230', '8bac0f', '9bbc0f'].map(hex);

// NES — a practical, widely-used 16-color subset of the full NES palette,
// chosen to span its distinct hues rather than the full 54-entry table
// (many of which are near-duplicates on real hardware).
const NES: RGB[] = [
  '000000',
  'fcfcfc',
  'f8f8f8',
  'bcbcbc',
  '7c7c7c',
  'a40000',
  'f83800',
  'f87858',
  'fca044',
  'f8b800',
  'b8f818',
  '00b800',
  '58d854',
  '00e8d8',
  '78d8f8',
  '0058f8',
].map(hex);

// Arcade — punchy, high-saturation CRT-cabinet palette.
const ARCADE: RGB[] = [
  '000000',
  'ffffff',
  'ff004d',
  'ff7700',
  'ffec27',
  '00e436',
  '29adff',
  '83769c',
  'ff77a8',
  '7e2553',
  '008751',
  'ab5236',
  '5f574f',
  'c2c3c7',
  '1d2b53',
  '6a2ee8',
].map(hex);

// 16-shade neutral monochrome ramp.
const MONOCHROME: RGB[] = Array.from({ length: 16 }, (_, i) => {
  const v = Math.round((i / 15) * 255);
  return { r: v, g: v, b: v };
});

// Retro — warm, faded 16-color "sun-bleached VHS" palette.
const RETRO: RGB[] = [
  '2c1e31',
  '4a3050',
  '7a4d63',
  'b57057',
  'e0946f',
  'f2b872',
  'f7dca0',
  'fff6d9',
  '2f4858',
  '357a75',
  '5cae7a',
  '9fd68c',
  '5b3a4e',
  '904e55',
  'c97b7b',
  'e8a598',
].map(hex);

export const PALETTE_PRESETS: PalettePreset[] = [
  { id: 'original', label: 'Original', suggestedColorCount: 64 },
  { id: 'gameboy', label: 'Game Boy', colors: GAMEBOY },
  { id: 'nes', label: 'NES', colors: NES },
  { id: 'arcade', label: 'Arcade', colors: ARCADE },
  { id: 'monochrome', label: 'Monochrome', colors: MONOCHROME },
  { id: 'retro', label: 'Retro', colors: RETRO },
  { id: 'bit8', label: '8-bit', suggestedColorCount: 256 },
  // True 16-bit color (65,536 shades) is indistinguishable from "original" at
  // pixel-art grid sizes, so this preset targets a curated 256-color budget —
  // enough range to read as "16-bit era" without just being a no-op.
  { id: 'bit16', label: '16-bit', suggestedColorCount: 256 },
  { id: 'custom', label: 'Custom' },
];

export function getPreset(id: string): PalettePreset {
  return PALETTE_PRESETS.find((p) => p.id === id) ?? PALETTE_PRESETS[0];
}
import type { RGB } from '../types';
import { nearestColor } from './quantize';

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

/**
 * Quantizes `grid` in place against `palette`, without dithering — every
 * pixel independently snaps to its nearest palette color.
 */
export function quantizeFlat(grid: ImageData, palette: RGB[]): void {
  const d = grid.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 4) continue; // leave near-transparent pixels alone
    const c = nearestColor({ r: d[i], g: d[i + 1], b: d[i + 2] }, palette);
    d[i] = c.r;
    d[i + 1] = c.g;
    d[i + 2] = c.b;
  }
}

/**
 * Ordered (Bayer) dithering: perturbs each pixel by a fixed per-position
 * threshold *before* snapping to the palette. Cheap, and produces the
 * classic regular crosshatch pattern rather than error-diffusion's organic
 * noise — a deliberate aesthetic choice available alongside Floyd–Steinberg.
 */
export function quantizeBayer(grid: ImageData, palette: RGB[], strength: number): void {
  const { width, data } = grid;
  // strength 0..100 -> spread of ~0..48 levels, matches typical 4x4 Bayer use
  const spread = (strength / 100) * 48;
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 4) continue;
      const threshold = (BAYER_4X4[y % 4][x % 4] / 16 - 0.5) * spread;
      const perturbed: RGB = {
        r: clamp255(data[i] + threshold),
        g: clamp255(data[i + 1] + threshold),
        b: clamp255(data[i + 2] + threshold),
      };
      const c = nearestColor(perturbed, palette);
      data[i] = c.r;
      data[i + 1] = c.g;
      data[i + 2] = c.b;
    }
  }
}

/**
 * Floyd–Steinberg error diffusion: quantizes each pixel, then pushes the
 * quantization error forward into unprocessed neighbors (7/16, 3/16, 5/16,
 * 1/16). Produces organic, film-grain-like dithering that reads as "more
 * colors than are really there" — the classic look for limited palettes.
 */
export function quantizeFloydSteinberg(grid: ImageData, palette: RGB[], strength: number): void {
  const { width, height, data } = grid;
  const mix = strength / 100;
  // Work in float buffers so accumulated error doesn't clip prematurely.
  const r = new Float32Array(width * height);
  const g = new Float32Array(width * height);
  const b = new Float32Array(width * height);
  const a = new Float32Array(width * height);
  for (let p = 0; p < width * height; p++) {
    r[p] = data[p * 4];
    g[p] = data[p * 4 + 1];
    b[p] = data[p * 4 + 2];
    a[p] = data[p * 4 + 3];
  }

  const addError = (ex: number, ey: number, er: number, eg: number, eb: number, factor: number) => {
    if (ex < 0 || ex >= width || ey < 0 || ey >= height) return; // guard against row wraparound at edges
    const idx = ey * width + ex;
    r[idx] += er * factor * mix;
    g[idx] += eg * factor * mix;
    b[idx] += eb * factor * mix;
  };

  for (let y = 0; y < height; y++) {
    const leftToRight = y % 2 === 0; // serpentine scan avoids directional bias
    for (let xi = 0; xi < width; xi++) {
      const x = leftToRight ? xi : width - 1 - xi;
      const p = y * width + x;
      if (a[p] < 4) continue;

      const old: RGB = { r: clamp255(r[p]), g: clamp255(g[p]), b: clamp255(b[p]) };
      const c = nearestColor(old, palette);
      const er = old.r - c.r;
      const eg = old.g - c.g;
      const eb = old.b - c.b;

      r[p] = c.r;
      g[p] = c.g;
      b[p] = c.b;

      const nextX = leftToRight ? x + 1 : x - 1;
      const prevX = leftToRight ? x - 1 : x + 1;
      addError(nextX, y, er, eg, eb, 7 / 16);
      addError(prevX, y + 1, er, eg, eb, 3 / 16);
      addError(x, y + 1, er, eg, eb, 5 / 16);
      addError(nextX, y + 1, er, eg, eb, 1 / 16);
    }
  }

  for (let p = 0; p < width * height; p++) {
    data[p * 4] = clamp255(r[p]);
    data[p * 4 + 1] = clamp255(g[p]);
    data[p * 4 + 2] = clamp255(b[p]);
  }
}
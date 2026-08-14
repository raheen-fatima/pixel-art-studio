import type { RGB } from '../types';

// ---------------------------------------------------------------------------
// Color quantization.
//
// Two paths:
//  1. Fixed palette (a hardware preset, or a user's custom swatches) — every
//     pixel just needs the nearest match, done here with a small perceptual
//     distance so mid-tones don't get flattened toward primaries.
//  2. Derived palette ("Original" / "8-bit" / "16-bit" modes) — we build a
//     bespoke N-color palette *from the image itself* via median-cut, which
//     keeps far more of the image's actual character than a fixed grid
//     quantization (e.g. naive 3-3-2 bit truncation) would.
// ---------------------------------------------------------------------------

/** Perceptually-weighted squared distance (cheap luma-weighted RGB, not full Lab — fast enough for real-time sliders). */
export function colorDistanceSq(a: RGB, b: RGB): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return 0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db;
}

export function nearestColor(target: RGB, palette: RGB[]): RGB {
  let best = palette[0];
  let bestDist = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const d = colorDistanceSq(target, palette[i]);
    if (d < bestDist) {
      bestDist = d;
      best = palette[i];
    }
  }
  return best;
}

interface Box {
  pixels: RGB[];
}

function boxRange(box: Box): { channel: 'r' | 'g' | 'b'; min: number; max: number } {
  let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
  for (const p of box.pixels) {
    if (p.r < rMin) rMin = p.r;
    if (p.r > rMax) rMax = p.r;
    if (p.g < gMin) gMin = p.g;
    if (p.g > gMax) gMax = p.g;
    if (p.b < bMin) bMin = p.b;
    if (p.b > bMax) bMax = p.b;
  }
  const rRange = rMax - rMin;
  const gRange = gMax - gMin;
  const bRange = bMax - bMin;
  if (rRange >= gRange && rRange >= bRange) return { channel: 'r', min: rMin, max: rMax };
  if (gRange >= rRange && gRange >= bRange) return { channel: 'g', min: gMin, max: gMax };
  return { channel: 'b', min: bMin, max: bMax };
}

function averageColor(pixels: RGB[]): RGB {
  let r = 0, g = 0, b = 0;
  for (const p of pixels) {
    r += p.r;
    g += p.g;
    b += p.b;
  }
  const n = pixels.length || 1;
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

/**
 * Median-cut quantization. Recursively splits the color space along its
 * widest axis until `maxColors` boxes exist, then returns each box's average
 * as one palette entry.
 */
export function medianCutPalette(samples: RGB[], maxColors: number): RGB[] {
  if (samples.length === 0) return [{ r: 0, g: 0, b: 0 }];
  const target = Math.max(1, Math.min(maxColors, 256));
  let boxes: Box[] = [{ pixels: samples }];

  while (boxes.length < target) {
    // Split the box with the most pixels (keeps boxes balanced, which tends
    // to produce more visually-even palettes than always splitting the
    // widest-range box).
    let splitIdx = 0;
    let maxSize = -1;
    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].pixels.length > maxSize && boxes[i].pixels.length > 1) {
        maxSize = boxes[i].pixels.length;
        splitIdx = i;
      }
    }
    if (maxSize <= 1) break; // nothing left worth splitting

    const box = boxes[splitIdx];
    const { channel } = boxRange(box);
    const sorted = [...box.pixels].sort((a, b) => a[channel] - b[channel]);
    const mid = Math.floor(sorted.length / 2);
    const boxA: Box = { pixels: sorted.slice(0, mid) };
    const boxB: Box = { pixels: sorted.slice(mid) };
    boxes.splice(splitIdx, 1, boxA, boxB);
  }

  return boxes.filter((b) => b.pixels.length > 0).map((b) => averageColor(b.pixels));
}

/** Downsamples the pixel set for palette building so median-cut stays fast on large grids. */
export function samplePixelsForPalette(data: Uint8ClampedArray, maxSamples = 4000): RGB[] {
  const pixelCount = data.length / 4;
  const stride = Math.max(1, Math.floor(pixelCount / maxSamples));
  const samples: RGB[] = [];
  for (let i = 0; i < pixelCount; i += stride) {
    const idx = i * 4;
    if (data[idx + 3] < 8) continue; // skip fully transparent
    samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
  }
  return samples.length > 0 ? samples : [{ r: 0, g: 0, b: 0 }];
}
import type { EditorSettings } from '../types';

// ---------------------------------------------------------------------------
// Tonal adjustments. All operate on the *downsampled grid*, not the full
// source image — this is both a performance win (grids are tiny, e.g.
// 64x48) and the correct order of operations: pixel art adjustments should
// affect the final small palette of blocks, not get half-destroyed by the
// box-filter averaging that happens afterward.
// ---------------------------------------------------------------------------

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = l * 255;
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    hue2rgb(p, q, h + 1 / 3) * 255,
    hue2rgb(p, q, h) * 255,
    hue2rgb(p, q, h - 1 / 3) * 255,
  ];
}

/** Applies brightness/contrast/exposure/saturation/hue in one pass over the grid. */
export function applyColorAdjustments(grid: ImageData, settings: EditorSettings): void {
  const { brightness, contrast, saturation, hue, exposure, highContrast, retroGrading } = settings;

  const effectiveContrast = contrast + (highContrast ? 25 : 0);
  const effectiveSaturation = saturation + (highContrast ? 10 : 0);

  const hasBrightness = brightness !== 0;
  const hasContrast = effectiveContrast !== 0;
  const hasExposure = exposure !== 0;
  const hasSaturation = effectiveSaturation !== 0;
  const hasHue = hue !== 0;
  if (!hasBrightness && !hasContrast && !hasExposure && !hasSaturation && !hasHue && !retroGrading) {
    return;
  }

  const contrastFactor = (259 * (effectiveContrast + 255)) / (255 * (259 - effectiveContrast));
  const exposureFactor = Math.pow(2, exposure / 50);

  const d = grid.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 1) continue;
    let r = d[i], g = d[i + 1], b = d[i + 2];

    if (hasExposure) {
      r = clamp255(r * exposureFactor);
      g = clamp255(g * exposureFactor);
      b = clamp255(b * exposureFactor);
    }
    if (hasBrightness) {
      r = clamp255(r + brightness * 1.6);
      g = clamp255(g + brightness * 1.6);
      b = clamp255(b + brightness * 1.6);
    }
    if (hasContrast) {
      r = clamp255(contrastFactor * (r - 128) + 128);
      g = clamp255(contrastFactor * (g - 128) + 128);
      b = clamp255(contrastFactor * (b - 128) + 128);
    }
    if (hasSaturation || hasHue) {
      let [h, s, l] = rgbToHsl(r, g, b);
      if (hasHue) h = ((h + hue / 360) % 1 + 1) % 1;
      if (hasSaturation) s = Math.max(0, Math.min(1, s * (1 + effectiveSaturation / 100)));
      [r, g, b] = hslToRgb(h, s, l);
    }
    if (retroGrading) {
      // Subtle split-tone: warm the highlights, cool the shadows — a fast
      // approximation of a duotone LUT rather than a true color-grading
      // curve, tuned to read as "faded cartridge box art".
      const luma = (r * 0.3 + g * 0.59 + b * 0.11) / 255;
      r = clamp255(r + (1 - luma) * -6 + luma * 10);
      g = clamp255(g + (1 - luma) * -2 + luma * 4);
      b = clamp255(b + (1 - luma) * 10 - luma * 8);
    }

    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }
}

/** Simple unsharp mask (grid minus blurred grid, added back) — cheap because the grid is tiny. */
export function applySharpness(grid: ImageData, amount: number): void {
  if (amount <= 0) return;
  const { width, height, data } = grid;
  const amt = amount / 100;
  const src = new Uint8ClampedArray(data); // snapshot to read neighbors from
  const idx = (x: number, y: number) => (y * width + x) * 4;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x, y);
      if (src[i + 3] < 1) continue;
      const x0 = Math.max(0, x - 1), x1 = Math.min(width - 1, x + 1);
      const y0 = Math.max(0, y - 1), y1 = Math.min(height - 1, y + 1);
      for (let c = 0; c < 3; c++) {
        const center = src[i + c];
        const blur =
          (src[idx(x0, y0) + c] + src[idx(x, y0) + c] + src[idx(x1, y0) + c] +
           src[idx(x0, y) + c] + center + src[idx(x1, y) + c] +
           src[idx(x0, y1) + c] + src[idx(x, y1) + c] + src[idx(x1, y1) + c]) / 9;
        data[i + c] = clamp255(center + (center - blur) * amt * 2);
      }
    }
  }
}

/** Thresholds alpha to fully opaque/transparent for a crisp cutout look, vs. the smooth default falloff. */
export function applyHardEdges(grid: ImageData): void {
  const d = grid.data;
  for (let i = 3; i < d.length; i += 4) {
    d[i] = d[i] < 128 ? 0 : 255;
  }
}
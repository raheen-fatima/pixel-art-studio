// ---------------------------------------------------------------------------
// Downsampling: source image -> low-res pixel grid.
//
// A naive `ctx.scale + drawImage` downsample (or worse, dropping every Nth
// pixel) aliases badly — thin lines and small text disappear or shimmer.
// We instead do a single-pass **area/box average**: every source pixel is
// accumulated into exactly one destination cell, weighted by alpha so
// transparent fringes don't muddy opaque colors. This is O(W*H) regardless
// of the destination grid size, and gives much cleaner results than
// point-sampling — closer to what a real pixel-art downscale should look
// like.
// ---------------------------------------------------------------------------

export interface GridDimensions {
  gridWidth: number;
  gridHeight: number;
}

export function computeGridDimensions(
  sourceWidth: number,
  sourceHeight: number,
  pixelSize: number
): GridDimensions {
  const size = Math.max(1, pixelSize);
  const gridWidth = Math.max(1, Math.round(sourceWidth / size));
  const gridHeight = Math.max(1, Math.round(sourceHeight / size));
  return { gridWidth, gridHeight };
}

export function downsampleToGrid(
  src: ImageData,
  gridWidth: number,
  gridHeight: number
): ImageData {
  const { width: sw, height: sh, data: sd } = src;
  const sumR = new Float64Array(gridWidth * gridHeight);
  const sumG = new Float64Array(gridWidth * gridHeight);
  const sumB = new Float64Array(gridWidth * gridHeight);
  const sumA = new Float64Array(gridWidth * gridHeight);
  const weight = new Float64Array(gridWidth * gridHeight);
  const count = new Float64Array(gridWidth * gridHeight);

  for (let y = 0; y < sh; y++) {
    const gy = Math.min(gridHeight - 1, Math.floor((y / sh) * gridHeight));
    const rowBase = y * sw;
    for (let x = 0; x < sw; x++) {
      const gx = Math.min(gridWidth - 1, Math.floor((x / sw) * gridWidth));
      const idx = (rowBase + x) * 4;
      const a = sd[idx + 3] / 255;
      const cell = gy * gridWidth + gx;
      // Weight color contribution by alpha so transparent pixels don't
      // darken/lighten opaque neighbors averaged into the same cell.
      sumR[cell] += sd[idx] * a;
      sumG[cell] += sd[idx + 1] * a;
      sumB[cell] += sd[idx + 2] * a;
      sumA[cell] += sd[idx + 3];
      weight[cell] += a;
      count[cell] += 1;
    }
  }

  const out = new ImageData(gridWidth, gridHeight);
  const od = out.data;
  for (let cell = 0; cell < gridWidth * gridHeight; cell++) {
    const idx = cell * 4;
    const w = weight[cell];
    const n = count[cell] || 1;
    if (w > 0.0001) {
      od[idx] = clamp255(sumR[cell] / w);
      od[idx + 1] = clamp255(sumG[cell] / w);
      od[idx + 2] = clamp255(sumB[cell] / w);
    }
    od[idx + 3] = clamp255(sumA[cell] / n);
  }
  return out;
}

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}
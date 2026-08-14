// Longest-edge cap applied to any decoded source image before it ever touches
// the pipeline. Without this, a 12000x8000 phone photo would allocate ~380MB
// for a single ImageData buffer and can lock up or crash the tab — the cap
// keeps memory bounded while staying far above what a pixel-art grid needs
// (even the finest "pixel size" setting needs far fewer source pixels than
// this to look correct).
export const MAX_WORKING_DIMENSION = 1600;

export interface DecodedImage {
  imageData: ImageData;
  width: number;
  height: number;
  hasAlpha: boolean;
}

export class ImageLoadError extends Error {
  constructor(public title: string, detail: string) {
    super(detail);
  }
}

function scaleToFit(width: number, height: number, maxDim: number) {
  if (width <= maxDim && height <= maxDim) return { width, height };
  const scale = maxDim / Math.max(width, height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Decodes a File/Blob into memory-capped ImageData via an offscreen canvas. */
export async function decodeImageFile(file: File | Blob): Promise<DecodedImage> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ImageLoadError('Unable to read image', 'This file appears to be corrupted or is not a supported image format.');
  }
  return decodeBitmap(bitmap);
}

/** Decodes a same-origin/CORS-enabled remote URL into memory-capped ImageData. */
export async function decodeImageUrl(url: string): Promise<DecodedImage> {
  let response: Response;
  try {
    response = await fetch(url, { mode: 'cors' });
  } catch {
    throw new ImageLoadError(
      'Could not load image',
      'The remote server may block cross-origin requests. Try downloading the image and uploading it instead.'
    );
  }
  if (!response.ok) {
    throw new ImageLoadError('Could not load image', `The server responded with status ${response.status}.`);
  }
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) {
    throw new ImageLoadError('Not an image', 'That URL did not return an image file.');
  }
  try {
    const bitmap = await createImageBitmap(blob);
    return decodeBitmap(bitmap);
  } catch {
    throw new ImageLoadError('Unable to decode image', 'The file at that URL is not a supported image format.');
  }
}

function decodeBitmap(bitmap: ImageBitmap): DecodedImage {
  const { width, height } = scaleToFit(bitmap.width, bitmap.height, MAX_WORKING_DIMENSION);
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new ImageLoadError('Rendering unavailable', 'This browser does not support the canvas features this app needs.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  bitmap.close();

  let hasAlpha = false;
  const d = imageData.data;
  for (let i = 3; i < d.length; i += 4 * 37) {
    // sparse sample — full-buffer alpha scan is unnecessary for a UI hint
    if (d[i] < 255) { hasAlpha = true; break; }
  }
  return { imageData, width, height, hasAlpha };
}

/** Draws a small pixel-grid ImageData onto a canvas at `scale`x with hard (nearest-neighbor) edges. */
export function drawGridScaled(
  canvas: HTMLCanvasElement,
  grid: ImageData,
  scale: number
): void {
  canvas.width = Math.max(1, Math.round(grid.width * scale));
  canvas.height = Math.max(1, Math.round(grid.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  // Draw the small grid onto a same-size offscreen canvas first (drawImage
  // can't blit ImageData directly at a different size), then scale that up.
  const tmp = document.createElement('canvas');
  tmp.width = grid.width;
  tmp.height = grid.height;
  const tctx = tmp.getContext('2d');
  if (!tctx) return;
  tctx.putImageData(grid, 0, 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
}
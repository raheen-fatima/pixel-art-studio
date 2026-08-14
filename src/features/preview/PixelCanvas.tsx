import { useEffect, useRef } from 'react';

interface PixelCanvasProps {
  imageData: ImageData;
  /** Rendered CSS size — independent of the canvas's native pixel resolution. */
  displayWidth: number;
  displayHeight: number;
  crisp?: boolean;
  label?: string;
}

/**
 * Draws `imageData` at its native resolution (no scaling on the canvas
 * bitmap itself), then lets CSS scale the element up or down for display.
 * `image-rendering: pixelated` makes that CSS scale use nearest-neighbor,
 * so a tiny pixel-art grid stays perfectly crisp at any zoom level without
 * re-rendering the canvas — zoom is purely a compositor operation.
 */
export function PixelCanvas({ imageData, displayWidth, displayHeight, crisp = true, label }: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.width !== imageData.width) canvas.width = imageData.width;
    if (canvas.height !== imageData.height) canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx?.putImageData(imageData, 0, 0);
  }, [imageData]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={label}
      style={{
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
        imageRendering: crisp ? 'pixelated' : 'auto',
      }}
    />
  );
}
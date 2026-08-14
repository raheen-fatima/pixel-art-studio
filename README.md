# Pixel Art Studio

Converts any image into high-quality pixel art, entirely client-side. No image data ever leaves the browser.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL. For camera capture to work, load the app over `https://` or `localhost` — browsers block `getUserMedia` on plain HTTP.

```bash
npm run build     # type-check + production build to dist/
npm run preview   # serve the production build locally
```

## How the conversion works

```
source image
  -> box-filter downsample to a small pixel grid   (image-processing/resize.ts)
  -> brightness/contrast/saturation/hue/exposure    (image-processing/adjust.ts)
  -> sharpen (unsharp mask)                         (image-processing/adjust.ts)
  -> build palette: preset / custom / median-cut     (image-processing/quantize.ts)
  -> quantize, optionally dithered                   (image-processing/dither.ts)
  -> optional hard alpha threshold                   (image-processing/adjust.ts)
```

All of the above (`image-processing/pipeline.ts`) is pure TypeScript with no DOM or React dependency, so it runs identically on the main thread and inside `workers/pixelate.worker.ts`. The worker does the real work; the main thread only decodes the source image and draws the resulting small grid to a `<canvas>`, letting the browser's own nearest-neighbor CSS scaling (`image-rendering: pixelated`) handle zoom — so zooming in/out is a compositor operation, not a re-render.

Large images are downscaled to a working resolution cap (1600px longest edge) before entering the pipeline, to keep memory bounded on phone-camera-sized photos.

## Structure

```
src/
├── components/ui/       Reusable primitives (Slider, Button, Select, Panel, ...)
├── features/
│   ├── image-input/     Drag-and-drop, file picker, URL loader, empty state
│   ├── camera/           getUserMedia capture flow
│   ├── editor/            Controls sidebar (pixelation, colors, adjustments, dithering, style)
│   ├── preview/           Zoom/pan canvas, before/after/split compare
│   └── export/            Format + resolution export
├── image-processing/     Pure pipeline (see above)
├── workers/               Web Worker wrapping the pipeline
├── hooks/                 useImagePipeline, useHistory (undo/redo), useZoomPan, useKeyboardShortcuts
├── utils/                 canvas decode/scale helpers, color conversion, download
└── types/                 Shared types, including the worker message protocol
```

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| Cmd/Ctrl+O | Open image |
| Cmd/Ctrl+S | Export |
| Cmd/Ctrl+Z | Undo |
| Cmd/Ctrl+Shift+Z | Redo |
| F | Fit preview to screen |
| + / - | Zoom in / out |
| 0 | Reset zoom |

## Known limitations

- **Camera in a sandboxed iframe preview** (e.g. an embedded demo): browsers block `getUserMedia` inside cross-origin iframes without an explicit `allow="camera"` permission. Running the app directly (`npm run dev`, or any normal deployment) is unaffected.
- True 16-bit color (65,536 shades) is visually indistinguishable from "Original" at pixel-art grid sizes, so the "16-bit" preset targets a curated 256-color budget instead of literally implementing 16-bit color depth.
- Median-cut palette generation samples up to 4,000 pixels from the grid for speed; this is imperceptible at typical grid sizes but means two images with identical colors in different proportions can very rarely produce a slightly different derived palette.
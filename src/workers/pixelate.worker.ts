/// <reference lib="webworker" />
import { runPipeline } from '../image-processing/pipeline';
import type { WorkerRequest, WorkerResponse } from '../types';

// Keeping image processing entirely off the main thread is what lets sliders
// stay responsive at 60fps while a full-quality quantize/dither pass (which
// can take tens of milliseconds on a big grid) runs in parallel. Only the
// *latest* request is ever processed — stale in-flight work is simply
// superseded, never queued, so the UI never falls behind a burst of slider
// input.

let latestRequestId = 0;

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  if (msg.type !== 'process') return;
  latestRequestId = msg.requestId;
  const myId = msg.requestId;

  try {
    const start = performance.now();
    const pixels = new Uint8ClampedArray(msg.buffer);
    const source = new ImageData(pixels, msg.width, msg.height);

    const result = runPipeline(source, msg.settings);

    // A newer request arrived while we worked — drop this result silently.
    if (myId !== latestRequestId) return;

    const durationMs = performance.now() - start;
    const response: WorkerResponse = {
      type: 'result',
      requestId: myId,
      buffer: result.gridData.data.buffer,
      gridWidth: result.gridWidth,
      gridHeight: result.gridHeight,
      paletteUsed: result.paletteUsed,
      durationMs,
    };
    (self as unknown as Worker).postMessage(response, [response.buffer]);
  } catch (err) {
    const response: WorkerResponse = {
      type: 'error',
      requestId: myId,
      message: err instanceof Error ? err.message : 'Unknown processing error',
    };
    (self as unknown as Worker).postMessage(response);
  }
};
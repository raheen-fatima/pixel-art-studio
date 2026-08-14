import { useEffect, useRef, useState } from 'react';
import type { EditorSettings, ProcessedResult, WorkerRequest, WorkerResponse } from '../types';

/**
 * Bridges the React tree to the pixelate Web Worker.
 *
 * Rapid slider drags can fire many settings updates per second; sending one
 * worker message per update would queue up stale work. Instead, requests are
 * coalesced with requestAnimationFrame — at most one in-flight message per
 * frame, always carrying the *latest* settings — and the worker itself also
 * drops any result whose requestId has been superseded. Between the two,
 * the UI always converges on the current settings without ever processing
 * a backlog of outdated frames.
 */
export function useImagePipeline(source: ImageData | null, settings: EditorSettings) {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ source: ImageData; settings: EditorSettings } | null>(null);

  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL('../workers/pixelate.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      if (msg.requestId !== requestIdRef.current) return; // superseded
      setIsProcessing(false);
      if (msg.type === 'result') {
        setError(null);
        setResult({
          gridData: new ImageData(new Uint8ClampedArray(msg.buffer), msg.gridWidth, msg.gridHeight),
          gridWidth: msg.gridWidth,
          gridHeight: msg.gridHeight,
          paletteUsed: msg.paletteUsed,
          durationMs: msg.durationMs,
        });
      } else {
        setError(msg.message);
      }
    };
    worker.onerror = (e) => {
      setIsProcessing(false);
      setError(e.message || 'The processing worker crashed unexpectedly.');
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (!source) {
      setResult(null);
      return;
    }
    pendingRef.current = { source, settings };
    if (rafRef.current !== null) return; // a flush is already scheduled for this frame

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const pending = pendingRef.current;
      const worker = workerRef.current;
      if (!pending || !worker) return;

      const id = ++requestIdRef.current;
      setIsProcessing(true);
      // Copy the pixel buffer — the original ImageData must survive to be
      // reused on the next settings change, but postMessage transfer
      // detaches whatever buffer is sent.
      const copy = new Uint8ClampedArray(pending.source.data);
      const request: WorkerRequest = {
        type: 'process',
        requestId: id,
        buffer: copy.buffer,
        width: pending.source.width,
        height: pending.source.height,
        settings: pending.settings,
      };
      worker.postMessage(request, [request.buffer]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, settings]);

  return { result, isProcessing, error };
}
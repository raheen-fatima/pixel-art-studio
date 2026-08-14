import { useCallback, useRef, useState } from 'react';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 32;

export function useZoomPan(containerRef: React.RefObject<HTMLElement>) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

  const zoomIn = useCallback(() => setZoom((z) => clampZoom(z * 1.25)), []);
  const zoomOut = useCallback(() => setZoom((z) => clampZoom(z / 1.25)), []);
  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const fitToScreen = useCallback(
    (contentWidth: number, contentHeight: number) => {
      const el = containerRef.current;
      if (!el || contentWidth === 0 || contentHeight === 0) return;
      const padding = 48;
      const availW = el.clientWidth - padding;
      const availH = el.clientHeight - padding;
      const scale = Math.min(availW / contentWidth, availH / contentHeight, MAX_ZOOM);
      setZoom(clampZoom(scale > 0 ? scale : 1));
      setPan({ x: 0, y: 0 });
    },
    [containerRef]
  );

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return; // let normal page/container scroll happen otherwise
    e.preventDefault();
    setZoom((z) => clampZoom(z * (e.deltaY < 0 ? 1.1 : 0.9)));
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as Element).setPointerCapture?.(e.pointerId);
      dragState.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
      setIsPanning(true);
    },
    [pan]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPan({ x: dragState.current.panX + dx, y: dragState.current.panY + dy });
  }, []);

  const onPointerUp = useCallback(() => {
    dragState.current = null;
    setIsPanning(false);
  }, []);

  return { zoom, pan, isPanning, zoomIn, zoomOut, resetZoom, fitToScreen, onWheel, onPointerDown, onPointerMove, onPointerUp };
}
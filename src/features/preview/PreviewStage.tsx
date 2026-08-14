import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Columns2,
  Eye,
  EyeOff,
  Expand,
  Loader2,
} from 'lucide-react';
import { PixelCanvas } from './PixelCanvas';
import { CompareSlider } from './CompareSlider';
import { Tooltip } from '../../components/ui/Tooltip';
import { useZoomPan } from '../../hooks/useZoomPan';
import type { ProcessedResult } from '../../types';

type ViewMode = 'after' | 'before' | 'split';

interface PreviewStageProps {
  original: ImageData;
  result: ProcessedResult | null;
  isProcessing: boolean;
}

export interface PreviewStageHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToScreen: () => void;
}

export const PreviewStage = forwardRef<PreviewStageHandle, PreviewStageProps>(function PreviewStage(
  { original, result, isProcessing },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('after');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const zp = useZoomPan(containerRef);
  const hasFitOnce = useRef(false);

  useImperativeHandle(ref, () => ({
    zoomIn: zp.zoomIn,
    zoomOut: zp.zoomOut,
    resetZoom: zp.resetZoom,
    fitToScreen: () => zp.fitToScreen(original.width, original.height),
  }));

  useEffect(() => {
    if (!hasFitOnce.current && original) {
      zp.fitToScreen(original.width, original.height);
      hasFitOnce.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [original]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      stageRef.current?.requestFullscreen().catch(() => {
        /* fullscreen not permitted in this context — silently ignore, controls still work */
      });
    }
  };

  const displayWidth = original.width * zp.zoom;
  const displayHeight = original.height * zp.zoom;

  const originalLayer = <PixelCanvas imageData={original} displayWidth={displayWidth} displayHeight={displayHeight} crisp={false} label="Original image" />;
  const afterLayer = result ? (
    <PixelCanvas imageData={result.gridData} displayWidth={displayWidth} displayHeight={displayHeight} label="Pixel art result" />
  ) : (
    <div style={{ width: displayWidth, height: displayHeight }} className="flex items-center justify-center text-paper-500">
      <Loader2 size={22} className="animate-spin" />
    </div>
  );

  return (
    <div ref={stageRef} className="flex h-full flex-col bg-ink-950">
      <div className="flex items-center justify-between gap-2 border-b border-ink-800 px-3 py-2">
        <div className="flex items-center gap-1 rounded-md bg-ink-900 p-0.5">
          <ViewModeButton active={viewMode === 'before'} label="Before" icon={<EyeOff size={13} />} onClick={() => setViewMode('before')} shortcut="Original" />
          <ViewModeButton active={viewMode === 'after'} label="After" icon={<Eye size={13} />} onClick={() => setViewMode('after')} shortcut="Pixel art" />
          <ViewModeButton active={viewMode === 'split'} label="Split" icon={<Columns2 size={13} />} onClick={() => setViewMode('split')} shortcut="Compare" />
        </div>

        <div className="flex items-center gap-1">
          {isProcessing && (
            <span className="mr-1 flex items-center gap-1.5 font-mono text-[10px] text-paper-500">
              <Loader2 size={11} className="animate-spin" /> rendering
            </span>
          )}
          <Tooltip label="Zoom out (-)">
            <IconButton onClick={zp.zoomOut} icon={<ZoomOut size={14} />} />
          </Tooltip>
          <span className="min-w-[3.5rem] text-center font-mono text-[11px] tabular-nums text-paper-300">
            {Math.round(zp.zoom * 100)}%
          </span>
          <Tooltip label="Zoom in (+)">
            <IconButton onClick={zp.zoomIn} icon={<ZoomIn size={14} />} />
          </Tooltip>
          <Tooltip label="Fit to screen (F)">
            <IconButton onClick={() => zp.fitToScreen(original.width, original.height)} icon={<Maximize2 size={14} />} />
          </Tooltip>
          <Tooltip label="Reset zoom (0)">
            <IconButton onClick={zp.resetZoom} icon={<RotateCcw size={14} />} />
          </Tooltip>
          <Tooltip label="Fullscreen">
            <IconButton onClick={toggleFullscreen} icon={<Expand size={14} />} active={isFullscreen} />
          </Tooltip>
        </div>
      </div>

      <div
        ref={containerRef}
        onWheel={zp.onWheel}
        onPointerDown={zp.onPointerDown}
        onPointerMove={zp.onPointerMove}
        onPointerUp={zp.onPointerUp}
        className={`bg-checker bg-checker-sm relative flex-1 overflow-hidden bg-ink-900 ${zp.isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{ transform: `translate(-50%, -50%) translate(${zp.pan.x}px, ${zp.pan.y}px)` }}
        >
          <div style={{ width: displayWidth, height: displayHeight }} className="shadow-2xl">
            {viewMode === 'split' ? (
              <CompareSlider before={originalLayer} after={afterLayer} />
            ) : viewMode === 'before' ? (
              originalLayer
            ) : (
              afterLayer
            )}
          </div>
        </div>
      </div>

      {result && (
        <div className="flex items-center justify-between border-t border-ink-800 px-3 py-1.5 font-mono text-[10px] text-paper-500">
          <span>
            {result.gridWidth}×{result.gridHeight} grid · {result.paletteUsed.length} colors
          </span>
          <span>{result.durationMs.toFixed(1)}ms</span>
        </div>
      )}
    </div>
  );
});

function IconButton({ onClick, icon, active }: { onClick: () => void; icon: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-100 ${
        active ? 'bg-phosphor/15 text-phosphor' : 'text-paper-300 hover:bg-ink-800'
      }`}
    >
      {icon}
    </button>
  );
}

function ViewModeButton({
  active,
  label,
  icon,
  onClick,
  shortcut,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  shortcut: string;
}) {
  return (
    <Tooltip label={shortcut}>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors duration-100 ${
          active ? 'bg-phosphor/15 text-phosphor' : 'text-paper-300 hover:text-paper-100'
        }`}
      >
        {icon}
        {label}
      </button>
    </Tooltip>
  );
}
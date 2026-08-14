import { useCallback, useEffect, useRef, useState } from 'react';
import { Undo2, Redo2, ImagePlus, PanelLeftClose, PanelLeftOpen, AlertTriangle } from 'lucide-react';
import { EmptyState } from './features/image-input/EmptyState';
import { CameraCapture } from './features/camera/CameraCapture';
import { ControlsPanel } from './features/editor/ControlsPanel';
import { PreviewStage, type PreviewStageHandle } from './features/preview/PreviewStage';
import { ExportPanel, exportFileName, renderExportCanvas } from './features/export/ExportPanel';
import { Button } from './components/ui/Button';
import { Tooltip } from './components/ui/Tooltip';
import { useHistory } from './hooks/useHistory';
import { useImagePipeline } from './hooks/useImagePipeline';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { decodeImageFile, decodeImageUrl, ImageLoadError, type DecodedImage } from './utils/canvas';
import { canvasToBlob, downloadBlob } from './utils/download';
import { DEFAULT_SETTINGS, type ExportFormat, type ExportScale } from './types';

export default function App() {
  const [sourceImage, setSourceImage] = useState<DecodedImage | null>(null);
  const [fileName, setFileName] = useState('pixel-art');
  const [showCamera, setShowCamera] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const settings = useHistory(DEFAULT_SETTINGS);
  const pipeline = useImagePipeline(sourceImage?.imageData ?? null, settings.value);

  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [exportScale, setExportScale] = useState<ExportScale>(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<PreviewStageHandle>(null);

  const handleFile = useCallback(async (file: File) => {
    setIsLoadingImage(true);
    setLoadError(null);
    try {
      const decoded = await decodeImageFile(file);
      setSourceImage(decoded);
      setFileName(file.name);
      settings.reset(DEFAULT_SETTINGS);
      setShowCamera(false);
    } catch (e) {
      setLoadError(e instanceof ImageLoadError ? e.message : 'Unable to load that image.');
    } finally {
      setIsLoadingImage(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUrl = useCallback(async (url: string) => {
    setIsLoadingImage(true);
    setLoadError(null);
    try {
      const decoded = await decodeImageUrl(url);
      setSourceImage(decoded);
      setFileName(url.split('/').pop() || 'image-from-url');
      settings.reset(DEFAULT_SETTINGS);
    } catch (e) {
      setLoadError(e instanceof ImageLoadError ? e.message : 'Unable to load that URL.');
    } finally {
      setIsLoadingImage(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewImage = useCallback(() => {
    setSourceImage(null);
    setLoadError(null);
    setShowCamera(false);
  }, []);

  const handleExport = useCallback(async () => {
    if (!pipeline.result) return;
    setIsExporting(true);
    setExportError(null);
    try {
      const canvas = await renderExportCanvas(pipeline.result, settings.value.pixelSize, exportScale);
      const mime = exportFormat === 'png' ? 'image/png' : 'image/webp';
      const blob = await canvasToBlob(canvas, mime, exportFormat === 'webp' ? 0.92 : undefined);
      downloadBlob(blob, exportFileName(fileName, pipeline.result, exportFormat));
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Export failed unexpectedly.');
    } finally {
      setIsExporting(false);
    }
  }, [pipeline.result, settings.value.pixelSize, exportScale, exportFormat, fileName]);

  useKeyboardShortcuts(
    [
      { key: 'o', meta: true, handler: () => fileInputRef.current?.click() },
      { key: 's', meta: true, handler: () => void handleExport() },
      { key: 'z', meta: true, handler: () => settings.undo() },
      { key: 'z', meta: true, shift: true, handler: () => settings.redo() },
      { key: 'f', handler: () => previewRef.current?.fitToScreen() },
      { key: '+', handler: () => previewRef.current?.zoomIn() },
      { key: '=', handler: () => previewRef.current?.zoomIn() },
      { key: '-', handler: () => previewRef.current?.zoomOut() },
      { key: '0', handler: () => previewRef.current?.resetZoom() },
    ],
    !!sourceImage
  );

  // Source image state is small (ImageData) and GC'd normally on swap; no
  // explicit object URLs are created for it, only for exports/downloads,
  // which downloadBlob revokes after the browser has had time to use them.
  useEffect(() => {
    return () => setSourceImage(null);
  }, []);

  const view: 'empty' | 'camera' | 'editor' = sourceImage ? 'editor' : showCamera ? 'camera' : 'empty';

  return (
    <div className="flex h-[100dvh] flex-col bg-ink-950 text-paper-100">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = '';
        }}
      />

      <header className="flex h-12 shrink-0 items-center justify-between border-b border-ink-800 px-3">
        <div className="flex items-center gap-2">
          {view === 'editor' && (
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="hidden h-7 w-7 items-center justify-center rounded-md text-paper-400 hover:bg-ink-800 md:flex"
              aria-label={sidebarOpen ? 'Collapse controls' : 'Expand controls'}
            >
              {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded-sm bg-phosphor" style={{ boxShadow: '3px 0 0 0 #4f9d58, 0 3px 0 0 #a8f5ae' }} />
            <span className="font-mono text-[13px] font-medium tracking-tight text-paper-100">Pixel Art Studio</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {view === 'editor' && (
            <>
              <Tooltip label="Undo (Cmd+Z)">
                <IconBtn onClick={settings.undo} disabled={!settings.canUndo}>
                  <Undo2 size={14} />
                </IconBtn>
              </Tooltip>
              <Tooltip label="Redo (Cmd+Shift+Z)">
                <IconBtn onClick={settings.redo} disabled={!settings.canRedo}>
                  <Redo2 size={14} />
                </IconBtn>
              </Tooltip>
              <div className="mx-1 h-4 w-px bg-ink-700" />
              <Button size="sm" variant="ghost" icon={<ImagePlus size={13} />} onClick={handleNewImage}>
                New Image
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col md:flex-row">
        {view === 'empty' && (
          <EmptyState
            onFile={handleFile}
            onUrl={handleUrl}
            onCamera={() => setShowCamera(true)}
            isUrlLoading={isLoadingImage}
            errorMessage={loadError}
          />
        )}

        {view === 'camera' && <CameraCapture onCapture={handleFile} onCancel={() => setShowCamera(false)} />}

        {view === 'editor' && sourceImage && (
          <>
            {sidebarOpen && (
              <aside className="flex max-h-[45vh] shrink-0 flex-col overflow-y-auto border-ink-800 md:h-full md:max-h-none md:w-80 md:border-r lg:w-96">
                <div className="flex-1 overflow-y-auto">
                  <ControlsPanel
                    settings={settings.value}
                    activePalette={pipeline.result?.paletteUsed ?? []}
                    onLive={settings.liveUpdate}
                    onCommit={settings.commit}
                    onCommitLiveBaseline={settings.commitLive}
                  />
                </div>
                <ExportPanel
                  result={pipeline.result}
                  pixelSize={settings.value.pixelSize}
                  format={exportFormat}
                  scale={exportScale}
                  onFormatChange={setExportFormat}
                  onScaleChange={setExportScale}
                  onExport={handleExport}
                  isExporting={isExporting}
                  error={exportError}
                />
              </aside>
            )}
            <div className="min-h-0 flex-1">
              <PreviewStage ref={previewRef} original={sourceImage.imageData} result={pipeline.result} isProcessing={pipeline.isProcessing} />
            </div>
          </>
        )}
      </main>

      {pipeline.error && (
        <div role="alert" className="flex items-center gap-2 border-t border-danger/30 bg-danger/10 px-4 py-2 text-xs text-danger">
          <AlertTriangle size={13} className="shrink-0" />
          <span className="flex-1">Processing failed: {pipeline.error}</span>
          <button onClick={() => window.location.reload()} className="text-paper-300 underline hover:text-paper-100">
            Reload
          </button>
        </div>
      )}

      {isLoadingImage && view === 'empty' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 px-5 py-3 text-sm text-paper-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-phosphor" />
            Loading image…
          </div>
        </div>
      )}
    </div>
  );
}

function IconBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-md text-paper-300 hover:bg-ink-800 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
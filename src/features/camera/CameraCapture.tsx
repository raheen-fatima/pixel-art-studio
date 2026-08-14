import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

type CameraState = 'requesting' | 'live' | 'denied' | 'unavailable';

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>('requesting');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unavailable');
      return;
    }

    setState('requesting');
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setState('live');
        navigator.mediaDevices.enumerateDevices().then((devices) => {
          if (!cancelled) setHasMultipleCameras(devices.filter((d) => d.kind === 'videoinput').length > 1);
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setState(err?.name === 'NotFoundError' ? 'unavailable' : 'denied');
      });

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facingMode, stopStream]);

  useEffect(() => () => stopStream(), [stopStream]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (facingMode === 'user') {
      // Undo the preview mirroring so the saved photo reads correctly
      // (text, handedness, etc.) rather than matching the "selfie mirror"
      // shown on screen.
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      onCapture(new File([blob], `camera-capture-${Date.now()}.png`, { type: 'image/png' }));
    }, 'image/png');
  };

  return (
    <div className="flex h-full flex-col items-center justify-center bg-ink-950 p-6">
      <div className="relative flex w-full max-w-xl flex-col items-center overflow-hidden rounded-2xl border border-ink-700 bg-ink-900">
        <div className="relative aspect-video w-full bg-black">
          {state === 'live' && (
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} />
          )}
          {state === 'requesting' && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-paper-500">
              <Camera size={28} className="animate-pulse" />
              <p className="text-sm">Requesting camera access…</p>
            </div>
          )}
          {state === 'denied' && (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center text-paper-300">
              <AlertTriangle size={28} className="text-amber" />
              <p className="text-sm font-medium">Camera access was denied</p>
              <p className="text-xs text-paper-500">
                Allow camera access in your browser's site settings, then try again.
              </p>
            </div>
          )}
          {state === 'unavailable' && (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center text-paper-300">
              <AlertTriangle size={28} className="text-amber" />
              <p className="text-sm font-medium">No camera found</p>
              <p className="text-xs text-paper-500">This device or browser doesn't expose a usable camera.</p>
            </div>
          )}
        </div>

        <div className="flex w-full items-center justify-between gap-3 border-t border-ink-800 p-3">
          <Button variant="ghost" icon={<X size={15} />} onClick={onCancel}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            {hasMultipleCameras && state === 'live' && (
              <Button
                variant="secondary"
                icon={<RefreshCw size={14} />}
                onClick={() => setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))}
                aria-label="Switch camera"
              >
                Flip
              </Button>
            )}
            <Button variant="primary" icon={<Camera size={15} />} onClick={capture} disabled={state !== 'live'}>
              Capture
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
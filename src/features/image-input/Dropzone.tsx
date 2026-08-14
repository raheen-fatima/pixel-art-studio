import { useCallback, useRef, useState, type DragEvent, type ReactNode } from 'react';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp', 'image/avif'];

interface DropzoneProps {
  onFile: (file: File) => void;
  onInvalidFile: (reason: string) => void;
  children: (opts: { isDragging: boolean; openPicker: () => void }) => ReactNode;
  className?: string;
}

export function Dropzone({ onFile, onInvalidFile, children, className = '' }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndEmit = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!ACCEPTED_TYPES.includes(file.type)) {
        onInvalidFile(`"${file.name}" is a ${file.type || 'unknown'} file. Try PNG, JPG, WebP, GIF, BMP, or AVIF instead.`);
        return;
      }
      const maxBytes = 60 * 1024 * 1024; // 60MB — generous, decode step still caps working resolution
      if (file.size > maxBytes) {
        onInvalidFile(`"${file.name}" is too large (${Math.round(file.size / 1024 / 1024)}MB). Try a file under 60MB.`);
        return;
      }
      onFile(file);
    },
    [onFile, onInvalidFile]
  );

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
  };
  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    dragDepth.current += 1;
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  };
  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    validateAndEmit(e.dataTransfer.files[0]);
  };

  return (
    <div
      className={className}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="sr-only"
        onChange={(e) => {
          validateAndEmit(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {children({ isDragging, openPicker: () => inputRef.current?.click() })}
    </div>
  );
}
import { useState } from 'react';
import { UploadCloud, Link2, Camera, ImageOff } from 'lucide-react';
import { Dropzone } from './Dropzone';
import { UrlLoader } from './UrlLoader';
import { Button } from '../../components/ui/Button';

interface EmptyStateProps {
  onFile: (file: File) => void;
  onUrl: (url: string) => void;
  onCamera: () => void;
  isUrlLoading: boolean;
  errorMessage?: string | null;
}

export function EmptyState({ onFile, onUrl, onCamera, isUrlLoading, errorMessage }: EmptyStateProps) {
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [invalidFileMsg, setInvalidFileMsg] = useState<string | null>(null);

  return (
    <Dropzone
      className="flex h-full items-center justify-center"
      onFile={(f) => {
        setInvalidFileMsg(null);
        onFile(f);
      }}
      onInvalidFile={setInvalidFileMsg}
    >
      {({ isDragging, openPicker }) => (
        <div
          className={`mx-6 flex w-full max-w-lg flex-col items-center rounded-2xl border-2 border-dashed px-8 py-14 text-center transition-colors duration-150 ${
            isDragging ? 'border-phosphor bg-phosphor/5' : 'border-ink-700 bg-ink-900/40'
          }`}
        >
          {isDragging ? (
            <UploadCloud size={36} className="mb-4 text-phosphor" />
          ) : (
            <ImageOff size={32} className="mb-4 text-paper-500" />
          )}
          <p className="mb-1 text-base font-medium text-paper-100">
            {isDragging ? 'Drop it' : 'Drop an image here'}
          </p>
          <p className="mb-6 text-sm text-paper-500">PNG, JPG, WebP, GIF, BMP, or AVIF</p>

          {showUrlForm ? (
            <UrlLoader onSubmit={onUrl} isLoading={isUrlLoading} onCancel={() => setShowUrlForm(false)} />
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button variant="primary" icon={<UploadCloud size={15} />} onClick={openPicker}>
                Upload Image
              </Button>
              <Button variant="secondary" icon={<Link2 size={15} />} onClick={() => setShowUrlForm(true)}>
                Paste URL
              </Button>
              <Button variant="secondary" icon={<Camera size={15} />} onClick={onCamera}>
                Use Camera
              </Button>
            </div>
          )}

          {(invalidFileMsg || errorMessage) && (
            <p role="alert" className="mt-5 max-w-sm text-sm text-danger">
              {invalidFileMsg || errorMessage}
            </p>
          )}
        </div>
      )}
    </Dropzone>
  );
}
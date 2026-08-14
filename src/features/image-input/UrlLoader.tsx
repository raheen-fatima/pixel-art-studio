import { useState, type FormEvent } from 'react';
import { Link2, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface UrlLoaderProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  onCancel: () => void;
}

export function UrlLoader({ onSubmit, isLoading, onCancel }: UrlLoaderProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
    } catch {
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md items-center gap-2">
      <div className="flex flex-1 items-center gap-2 rounded-md border border-ink-600 bg-ink-800 px-3 py-2">
        <Link2 size={15} className="shrink-0 text-paper-500" />
        <input
          autoFocus
          type="url"
          inputMode="url"
          placeholder="https://example.com/image.png"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          className="w-full bg-transparent text-sm text-paper-100 placeholder:text-paper-500 focus:outline-none"
        />
      </div>
      <Button type="submit" variant="primary" disabled={isLoading || !url.trim()} icon={isLoading ? <Loader2 size={14} className="animate-spin" /> : undefined}>
        {isLoading ? 'Loading' : 'Load'}
      </Button>
      <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
        Cancel
      </Button>
    </form>
  );
}
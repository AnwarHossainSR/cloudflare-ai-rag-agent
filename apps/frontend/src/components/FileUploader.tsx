import { ChangeEvent, DragEvent, useState } from 'react';
import { useUploadDocument } from '../api/documents';
import { LoadingState } from './LoadingState';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'application/pdf',
  'application/octet-stream',
]);
const SUPPORTED_LABELS = ['TXT', 'MD', 'PDF'];

interface FileUploaderProps {
  onUploaded?: () => void;
}

export function FileUploader({ onUploaded }: FileUploaderProps) {
  const upload = useUploadDocument();
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function pick(file?: File) {
    if (!file) return;
    setError(null);
    if (file.size > MAX_SIZE) {
      setError('File too large. Upload a txt, md, or pdf file under 10MB.');
      return;
    }
    if (!isAllowed(file)) {
      setError('Unsupported file type. Upload a txt, md, or pdf file.');
      return;
    }
    await upload.mutateAsync(file);
    onUploaded?.();
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    void pick(event.dataTransfer.files[0]);
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    void pick(event.target.files?.[0]);
    event.target.value = '';
  }

  return (
    <section className="ui-card p-6">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-6 py-14 text-center transition focus-within:ring-2 focus-within:ring-accent ${
          isDragging ? 'border-accent bg-accent/5' : 'border-line bg-paper hover:border-accent/50'
        }`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-panel2 text-xl text-accent" aria-hidden="true">
          ↑
        </span>
        <span className="mt-3 text-base font-semibold text-ink">Drop a document here</span>
        <span className="text-sm text-secondary">or click to browse your files</span>
        <div className="mt-3 flex items-center gap-1.5">
          {SUPPORTED_LABELS.map((label) => (
            <span
              key={label}
              className="rounded-full bg-panel2 px-2 py-0.5 font-mono text-[11px] font-medium text-muted"
            >
              {label}
            </span>
          ))}
          <span className="ml-1 text-xs text-muted">max 10MB</span>
        </div>
        <span className="ui-button-primary mt-5">Choose document</span>
        <input
          aria-label="Choose document"
          className="sr-only"
          type="file"
          accept=".txt,.md,.markdown,.pdf,text/plain,text/markdown,application/pdf"
          onChange={onChange}
        />
      </label>
      {upload.isPending ? <LoadingState className="mt-4 text-secondary" label="Uploading" /> : null}
      {error ? <p className="mt-4 text-sm font-medium text-danger">{error}</p> : null}
      {upload.isError ? (
        <p className="mt-4 text-sm font-medium text-danger">Upload failed. Try again.</p>
      ) : null}
    </section>
  );
}

function isAllowed(file: File) {
  return ALLOWED_TYPES.has(file.type) || /\.(txt|md|markdown|pdf)$/i.test(file.name);
}

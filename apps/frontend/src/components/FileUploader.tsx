import { ChangeEvent, DragEvent, useState } from 'react';
import { useUploadDocument } from '../api/documents';
import { LoadingState } from './LoadingState';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['text/plain', 'text/markdown', 'application/octet-stream']);

interface FileUploaderProps {
  onUploaded?: () => void;
}

export function FileUploader({ onUploaded }: FileUploaderProps) {
  const upload = useUploadDocument();
  const [error, setError] = useState<string | null>(null);

  async function pick(file?: File) {
    if (!file) return;
    setError(null);
    if (file.size > MAX_SIZE) {
      setError('File too large. Upload a txt or md file under 10MB.');
      return;
    }
    if (!isAllowed(file)) {
      setError('Unsupported file type. Upload a txt or md file.');
      return;
    }
    await upload.mutateAsync(file);
    onUploaded?.();
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    void pick(event.dataTransfer.files[0]);
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    void pick(event.target.files?.[0]);
    event.target.value = '';
  }

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-cyan-700 bg-[#eef3f1] px-5 py-10 text-center focus-within:ring-2 focus-within:ring-cyan-500"
      >
        <span className="text-base font-semibold text-slate-950">Drop a document here</span>
        <span className="mt-1 text-sm text-slate-600">txt or md, max 10MB</span>
        <span className="mt-4 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
          Choose document
        </span>
        <input
          aria-label="Choose document"
          className="sr-only"
          type="file"
          accept=".txt,.md,.markdown,text/plain,text/markdown"
          onChange={onChange}
        />
      </label>
      {upload.isPending ? <LoadingState className="mt-3 text-slate-600" label="Uploading" /> : null}
      {error ? <p className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
      {upload.isError ? (
        <p className="mt-3 text-sm font-medium text-red-700">Upload failed. Try again.</p>
      ) : null}
    </section>
  );
}

function isAllowed(file: File) {
  return ALLOWED_TYPES.has(file.type) || /\.(txt|md|markdown)$/i.test(file.name);
}

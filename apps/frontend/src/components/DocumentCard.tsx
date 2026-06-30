import { DocumentRecord, useDeleteDocument, useReindexDocument } from '../api/documents';
import { StatusBadge } from './StatusBadge';

interface DocumentCardProps {
  document: DocumentRecord;
}

const TYPE_LABELS: Record<string, string> = {
  'text/plain': 'TXT',
  'text/markdown': 'MD',
  'application/pdf': 'PDF',
};

export function DocumentCard({ document }: DocumentCardProps) {
  const remove = useDeleteDocument();
  const reindex = useReindexDocument();
  const chunkLabel = `${document.chunkCount} ${document.chunkCount === 1 ? 'chunk' : 'chunks'}`;
  const typeLabel = TYPE_LABELS[document.mimeType] ?? 'FILE';

  function deleteDocument() {
    if (window.confirm(`Delete ${document.filename}?`)) remove.mutate(document.id);
  }

  return (
    <article className="ui-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-panel2 font-mono text-[11px] font-semibold text-secondary">
            {typeLabel}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-ink">{document.filename}</h2>
            <p className="mt-0.5 font-mono text-xs text-muted">
              {formatBytes(document.sizeBytes)} · {chunkLabel}
              {document.createdAt ? ` · ${formatRelativeTime(document.createdAt)}` : ''}
            </p>
          </div>
        </div>
        <StatusBadge label={document.status} />
      </div>
      <p className="mt-3 text-sm text-secondary">
        {document.status === 'ready' ? 'Ready for chat' : 'Not ready for chat yet'}
      </p>
      {document.error ? <p className="mt-2 text-sm font-medium text-danger">{document.error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => reindex.mutate(document.id)}
          disabled={reindex.isPending || document.status !== 'ready' || document.chunkCount === 0}
          className="ui-button-secondary"
        >
          Re-index
        </button>
        <button
          type="button"
          onClick={deleteDocument}
          disabled={remove.isPending}
          className="ui-button-secondary hover:border-danger/40 hover:text-danger"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

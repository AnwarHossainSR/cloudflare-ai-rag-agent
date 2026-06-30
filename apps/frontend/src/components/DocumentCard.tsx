import { DocumentRecord, useDeleteDocument, useReindexDocument } from '../api/documents';
import { StatusBadge } from './StatusBadge';

interface DocumentCardProps {
  document: DocumentRecord;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const remove = useDeleteDocument();
  const reindex = useReindexDocument();
  const chunkLabel = `${document.chunkCount} ${document.chunkCount === 1 ? 'chunk' : 'chunks'}`;

  function deleteDocument() {
    if (window.confirm(`Delete ${document.filename}?`)) remove.mutate(document.id);
  }

  return (
    <article className="ui-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-ink">{document.filename}</h2>
          <p className="mt-1 font-mono text-xs text-muted">
            {formatBytes(document.sizeBytes)} · {chunkLabel}
          </p>
        </div>
        <StatusBadge label={document.status} />
      </div>
      <p className="mt-3 text-sm text-muted">
        {document.status === 'ready' ? 'Ready for chat' : 'Not ready for chat yet'}
      </p>
      {document.error ? <p className="mt-2 text-sm text-red-700">{document.error}</p> : null}
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
          className="ui-button-secondary"
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

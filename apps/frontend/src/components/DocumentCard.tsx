import { DocumentRecord, DocumentStatus, useDeleteDocument } from '../api/documents';

interface DocumentCardProps {
  document: DocumentRecord;
}

const statusStyles: Record<DocumentStatus, string> = {
  pending: 'bg-amber-50 text-amber-800',
  processing: 'bg-cyan-50 text-cyan-800',
  ready: 'bg-emerald-50 text-emerald-800',
  failed: 'bg-red-50 text-red-800',
};

export function DocumentCard({ document }: DocumentCardProps) {
  const remove = useDeleteDocument();

  return (
    <article className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-slate-950">{document.filename}</h2>
          <p className="mt-1 text-sm text-slate-500">{formatBytes(document.sizeBytes)}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[document.status]}`}
        >
          {document.status}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-600">
        {document.status === 'ready' ? 'Ready for chat' : 'Not ready for chat yet'}
      </p>
      {document.error ? <p className="mt-2 text-sm text-red-700">{document.error}</p> : null}
      <button
        type="button"
        onClick={() => remove.mutate(document.id)}
        disabled={remove.isPending}
        className="mt-4 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60"
      >
        Delete
      </button>
    </article>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

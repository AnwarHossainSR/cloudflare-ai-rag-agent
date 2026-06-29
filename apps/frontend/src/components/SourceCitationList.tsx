import { SourceCitation } from '../api/rag';
import { EmptyState } from './EmptyState';

interface SourceCitationListProps {
  citations: SourceCitation[];
}

export function SourceCitationList({ citations }: SourceCitationListProps) {
  if (!citations.length) {
    return <EmptyState title="No sources" body="The answer did not include retrieved citations." />;
  }

  return (
    <ul className="mt-3 space-y-2">
      {citations.map((citation) => (
        <li
          key={`${citation.documentId}-${citation.chunkIndex}`}
          className="rounded-lg border border-slate-200 bg-slate-50 p-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-950">
              {citation.documentName} #{citation.chunkIndex}
            </span>
            <span className="font-mono text-xs text-slate-500">
              {(citation.score * 100).toFixed(0)}%
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{citation.snippet}</p>
        </li>
      ))}
    </ul>
  );
}

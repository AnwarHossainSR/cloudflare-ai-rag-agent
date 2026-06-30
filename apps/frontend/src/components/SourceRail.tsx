import { SourceCitation } from '../api/rag';

interface SourceRailProps {
  citations: SourceCitation[];
}

export function SourceRail({ citations }: SourceRailProps) {
  if (!citations.length) {
    return (
      <aside className="rounded-md border border-dashed border-line bg-panel p-4">
        <h2 className="text-sm font-semibold text-ink">No sources yet</h2>
        <p className="mt-1 text-sm text-muted">Ask from uploaded documents to see chunk citations.</p>
      </aside>
    );
  }

  return (
    <aside aria-label="Sources" className="space-y-2">
      {citations.map((citation) => (
        <article
          className="rounded-md border border-line bg-panel p-3"
          key={`${citation.documentId}-${citation.chunkIndex}`}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="truncate text-sm font-semibold text-ink">
              {citation.documentName} #{citation.chunkIndex}
            </h3>
            <span className="font-mono text-xs text-muted">{(citation.score * 100).toFixed(0)}%</span>
          </div>
          <p className="mt-2 line-clamp-3 text-sm leading-5 text-muted">{citation.snippet}</p>
        </article>
      ))}
    </aside>
  );
}

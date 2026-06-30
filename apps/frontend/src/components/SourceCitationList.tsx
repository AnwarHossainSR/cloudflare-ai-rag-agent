import { SourceCitation } from '../api/rag';
import { SourceRail } from './SourceRail';

interface SourceCitationListProps {
  citations: SourceCitation[];
}

export function SourceCitationList({ citations }: SourceCitationListProps) {
  return (
    <div className="mt-3 border-t border-line pt-3">
      <SourceRail citations={citations} />
    </div>
  );
}

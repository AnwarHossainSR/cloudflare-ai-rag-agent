import { DocumentStatus } from '../api/documents';
import { Confidence } from '../api/rag';

type StatusBadgeKind = DocumentStatus | Confidence;

interface StatusBadgeProps {
  label: StatusBadgeKind;
}

const styles: Record<StatusBadgeKind, string> = {
  pending: 'bg-warning/10 text-warning ring-warning/20',
  processing: 'bg-cyan-700/10 text-cyan-800 ring-cyan-700/20',
  ready: 'bg-verified/10 text-verified ring-verified/20',
  failed: 'bg-danger/10 text-danger ring-danger/20',
  High: 'bg-verified/10 text-verified ring-verified/20',
  Medium: 'bg-warning/10 text-warning ring-warning/20',
  Low: 'bg-danger/10 text-danger ring-danger/20',
};

export function StatusBadge({ label }: StatusBadgeProps) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[label]}`}>
      {label}
    </span>
  );
}

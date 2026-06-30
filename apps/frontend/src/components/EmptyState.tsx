import { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  body?: string;
  action?: ReactNode;
}

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line bg-panel px-6 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-panel2 text-lg text-muted" aria-hidden="true">
        ◇
      </span>
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {body ? <p className="mt-1 max-w-sm text-sm text-secondary">{body}</p> : null}
      </div>
      {action}
    </section>
  );
}

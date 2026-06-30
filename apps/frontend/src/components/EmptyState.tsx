interface EmptyStateProps {
  title: string;
  body?: string;
}

export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <section className="rounded-md border border-dashed border-line bg-panel p-5">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {body ? <p className="mt-1 text-sm text-muted">{body}</p> : null}
    </section>
  );
}

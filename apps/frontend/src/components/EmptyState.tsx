interface EmptyStateProps {
  title: string;
  body?: string;
}

export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {body ? <p className="mt-1 text-sm text-slate-500">{body}</p> : null}
    </section>
  );
}

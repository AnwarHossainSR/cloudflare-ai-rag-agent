interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label = 'Loading', className = 'text-muted' }: LoadingStateProps) {
  return (
    <div className={`inline-flex items-center gap-2 text-sm ${className}`} role="status">
      <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500" />
      {label}
    </div>
  );
}

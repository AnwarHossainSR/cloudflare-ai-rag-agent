import { AgentStep } from '../api/agents';

interface AgentStepTimelineProps {
  steps: AgentStep[];
}

function friendlyStepName(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatLatency(latencyMs: number | null): string {
  return latencyMs === null ? '—' : `${latencyMs}ms`;
}

export function AgentStepTimeline({ steps }: AgentStepTimelineProps) {
  if (!steps.length) {
    return <p className="text-sm text-muted">No steps recorded for this run.</p>;
  }

  return (
    <ol className="space-y-3">
      {steps.map((step, index) => {
        const isRetry = step.name === 'retryRetrieval';
        return (
          <li className="ui-card" key={step.id}>
            <div className="flex items-center gap-4">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs ${
                  isRetry ? 'bg-warning/10 text-warning' : 'bg-panel2 text-muted'
                }`}
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-ink">{friendlyStepName(step.name)}</p>
                  {isRetry ? (
                    <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning ring-1 ring-warning/20">
                      Retry
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 font-mono text-xs text-muted">{formatLatency(step.latencyMs)}</p>
              </div>
            </div>
            <details className="mt-3 border-t border-line pt-3">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted">
                Input / Output
              </summary>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="ui-eyebrow text-muted">Input</p>
                  <pre className="mt-1 max-h-64 overflow-auto rounded-md bg-panel2 p-3 text-xs text-secondary">
                    {JSON.stringify(step.input, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="ui-eyebrow text-muted">Output</p>
                  <pre className="mt-1 max-h-64 overflow-auto rounded-md bg-panel2 p-3 text-xs text-secondary">
                    {JSON.stringify(step.output, null, 2)}
                  </pre>
                </div>
              </div>
            </details>
          </li>
        );
      })}
    </ol>
  );
}

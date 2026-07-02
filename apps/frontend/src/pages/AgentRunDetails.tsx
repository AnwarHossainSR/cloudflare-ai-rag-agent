import { Link, useParams } from 'react-router-dom';
import { useAgentRun } from '../api/agents';
import { AgentStepTimeline } from '../components/AgentStepTimeline';
import { AppShell } from '../components/AppShell';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { StatusBadge } from '../components/StatusBadge';
import { learningHints } from '../content/learningHints';
import { useAuthStore } from '../stores/auth';

export function AgentRunDetails() {
  const { runId } = useParams();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const run = useAgentRun(runId);

  return (
    <AppShell
      onLogout={logout}
      title="Agent run"
      userEmail={user?.email}
      eyebrow="Agents"
      description={`Run ${runId ?? ''}`}
      learning={learningHints.agentRun}
      actions={
        <Link className="ui-button-secondary" to="/agents">
          Back to agents
        </Link>
      }
    >
      {run.isLoading ? (
        <LoadingState label="Loading run" />
      ) : run.isError || !run.data ? (
        <EmptyState
          title="Run not found"
          body="This agent run doesn't exist, or you don't have access to it."
        />
      ) : (
        <div className="space-y-5">
          <section className="ui-card flex flex-wrap items-center justify-between gap-3">
            <div>
              <StatusBadge label={run.data.status === 'failed' ? 'failed' : 'completed'} />
              <p className="mt-2 text-sm text-secondary">{run.data.question}</p>
            </div>
            <div className="flex gap-6 text-xs text-muted">
              <div>
                <p className="ui-eyebrow">Retries</p>
                <p className="mt-0.5 font-mono text-ink">{run.data.retryCount}</p>
              </div>
              <div>
                <p className="ui-eyebrow">Started</p>
                <p className="mt-0.5 font-mono text-ink">
                  {new Date(run.data.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="ui-eyebrow">Confidence</p>
                <p className="mt-0.5 font-mono text-ink">
                  {run.data.confidence ? <StatusBadge label={run.data.confidence} /> : '—'}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Step timeline</h2>
            <AgentStepTimeline steps={run.data.steps} />
          </section>

          <section className="ui-card">
            <h2 className="text-sm font-semibold text-ink">Final output</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-secondary">
              {run.data.finalAnswer ?? 'No output yet — this run produced no final answer.'}
            </p>
          </section>
        </div>
      )}
    </AppShell>
  );
}

import { Link } from 'react-router-dom';
import { useAgentRuns } from '../api/agents';
import { AppShell } from '../components/AppShell';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { StatusBadge } from '../components/StatusBadge';
import { useAuthStore } from '../stores/auth';

export function AgentRuns() {
  const runs = useAgentRuns();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <AppShell
      onLogout={logout}
      title="Agents"
      userEmail={user?.email}
      eyebrow="Agentic RAG"
      description="Run history for the multi-step LangGraph agent, including retries and final confidence."
      actions={
        <Link className="ui-button-primary" to="/chat">
          Start agent run
        </Link>
      }
    >
      {runs.isLoading ? <LoadingState label="Loading agent runs" /> : null}

      {!runs.isLoading && !runs.data?.length ? (
        <EmptyState
          title="No agent runs yet"
          body="Open chat, turn on agent mode, and ask a question to create a run timeline."
          action={
            <Link className="ui-button-primary" to="/chat">
              Open chat
            </Link>
          }
        />
      ) : null}

      {runs.data?.length ? (
        <ul className="ui-panel divide-y divide-line">
          {runs.data.map((run) => (
            <li className="flex flex-wrap items-center justify-between gap-4 px-4 py-3" key={run.id}>
              <div className="min-w-0">
                <Link className="truncate text-sm font-semibold text-ink hover:text-accent focus-ring" to={`/agents/${run.id}`}>
                  {run.question}
                </Link>
                <p className="mt-1 text-xs text-muted">
                  {new Date(run.createdAt).toLocaleString()} | {run.retryCount} retries
                </p>
              </div>
              <div className="flex items-center gap-2">
                {run.confidence ? <StatusBadge label={run.confidence} /> : null}
                <StatusBadge label={run.status === 'failed' ? 'failed' : 'completed'} />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </AppShell>
  );
}

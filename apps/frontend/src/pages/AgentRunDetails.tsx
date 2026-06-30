import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { useAuthStore } from '../stores/auth';

const PLANNED_STEPS = ['Retrieve', 'Reason', 'Verify', 'Answer'];

export function AgentRunDetails() {
  const { runId } = useParams();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <AppShell
      onLogout={logout}
      title="Agent run"
      userEmail={user?.email}
      eyebrow="Agents"
      description={`Run ${runId ?? ''}`}
      actions={
        <Link className="ui-button-secondary" to="/agents">
          Back to agents
        </Link>
      }
    >
      <div className="space-y-5">
        <section className="ui-card flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="rounded-full bg-panel2 px-2.5 py-1 text-xs font-semibold text-muted ring-1 ring-line">
              Not started
            </span>
            <p className="mt-2 text-sm text-secondary">
              Agent runs aren't wired up yet — the LangGraph loop lands in Milestone 3.
            </p>
          </div>
          <div className="flex gap-6 text-xs text-muted">
            <div>
              <p className="ui-eyebrow">Retries</p>
              <p className="mt-0.5 font-mono text-ink">—</p>
            </div>
            <div>
              <p className="ui-eyebrow">Started</p>
              <p className="mt-0.5 font-mono text-ink">—</p>
            </div>
            <div>
              <p className="ui-eyebrow">Finished</p>
              <p className="mt-0.5 font-mono text-ink">—</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Step timeline</h2>
          <ol className="space-y-3">
            {PLANNED_STEPS.map((step, index) => (
              <li className="ui-card flex items-center gap-4 opacity-60" key={step}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel2 font-mono text-xs text-muted">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">{step}</p>
                  <p className="text-xs text-muted">Pending — arrives in Milestone 3</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="ui-card">
          <h2 className="text-sm font-semibold text-ink">Final output</h2>
          <p className="mt-2 text-sm text-secondary">No output yet — this run hasn't executed.</p>
        </section>
      </div>
    </AppShell>
  );
}

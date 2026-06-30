import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSessions } from '../api/chat';
import { useDocuments } from '../api/documents';
import { AppShell } from '../components/AppShell';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';
import { useAuthStore } from '../stores/auth';

interface StatCardProps {
  label: string;
  value: ReactNode;
  helper: string;
}

function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="ui-card">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-xs text-secondary">{helper}</p>
    </div>
  );
}

interface QuickActionProps {
  to: string;
  title: string;
  description: string;
}

function QuickAction({ to, title, description }: QuickActionProps) {
  return (
    <Link className="ui-card group flex items-center justify-between gap-4 focus-ring" to={to}>
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="mt-1 block text-xs text-secondary">{description}</span>
      </span>
      <span className="text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const documents = useDocuments();
  const sessions = useSessions();

  const docs = documents.data ?? [];
  const chatSessions = sessions.data ?? [];
  const readyDocs = docs.filter((doc) => doc.status === 'ready').length;
  const totalChunks = docs.reduce((sum, doc) => sum + (doc.chunkCount ?? 0), 0);
  const recentDocs = [...docs]
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, 4);

  const name = user?.email?.split('@')[0] ?? 'there';

  return (
    <AppShell onLogout={logout} title="Overview" userEmail={user?.email}>
      <div className="space-y-7">
        <section className="ui-panel relative overflow-hidden bg-gradient-to-br from-accent/15 via-panel to-panel p-7">
          <div className="relative max-w-2xl">
            <p className="ui-eyebrow">Workspace</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Welcome back, {name}</h1>
            <p className="mt-2 text-sm text-secondary">
              Upload technical docs, then ask grounded questions answered only from your sources — with citations and
              an inspectable agent loop.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="ui-button-primary" to="/documents/upload">
                Upload documents
              </Link>
              <Link className="ui-button-secondary" to="/chat">
                Start chat
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Documents" value={docs.length} helper={`${readyDocs} ready`} />
          <StatCard label="Chat sessions" value={chatSessions.length} helper="conversations" />
          <StatCard label="Agent runs" value="—" helper="Arrives in M3" />
          <StatCard label="Indexed chunks" value={totalChunks} helper="across documents" />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Quick actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction to="/documents" title="Browse documents" description="Search and manage your knowledge base" />
            <QuickAction to="/chat" title="Open chat" description="Ask grounded questions with citations" />
            <QuickAction to="/agents" title="Run an agent" description="Inspect the multi-step agent loop" />
            <QuickAction to="/settings" title="Open settings" description="Models, theme, and retrieval" />
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Recent documents</h2>
            <Link className="text-xs font-medium text-accent hover:brightness-110 focus-ring" to="/documents">
              View all
            </Link>
          </div>
          {recentDocs.length === 0 ? (
            <EmptyState
              title="No documents yet"
              body="Upload a txt, md, or pdf file to start grounded chat with citations."
            />
          ) : (
            <ul className="ui-panel divide-y divide-line">
              {recentDocs.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{doc.filename}</p>
                    <p className="text-xs text-muted">{doc.chunkCount} chunks</p>
                  </div>
                  <StatusBadge label={doc.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

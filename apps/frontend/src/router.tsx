import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { EmptyState } from './components/EmptyState';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AgentRunDetails } from './pages/AgentRunDetails';
import { Chat } from './pages/Chat';
import { Dashboard } from './pages/Dashboard';
import { DocumentsList } from './pages/DocumentsList';
import { Login } from './pages/Login';
import { Settings } from './pages/Settings';
import { UploadDocuments } from './pages/UploadDocuments';
import { useAuthStore } from './stores/auth';

const PLANNED_STEPS = ['Retrieve', 'Reason', 'Verify', 'Answer'];

function TimelinePlaceholder({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <AppShell onLogout={logout} title={title} userEmail={user?.email} eyebrow={eyebrow}>
      <div className="space-y-5">
        <EmptyState title={`No ${title.toLowerCase()} yet`} body={body} />
        <section aria-hidden="true">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Preview</h2>
          <ol className="space-y-3 opacity-50">
            {PLANNED_STEPS.map((step, index) => (
              <li className="ui-card flex items-center gap-4" key={step}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel2 font-mono text-xs text-muted">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">{step}</p>
                  <span className="rounded-full bg-panel2 px-2 py-0.5 text-xs text-muted ring-1 ring-line">
                    Pending
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </AppShell>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route index element={<Dashboard />} />
        <Route path="/documents/upload" element={<UploadDocuments />} />
        <Route path="/documents" element={<DocumentsList />} />
        <Route path="/chat" element={<Chat />} />
        <Route
          path="/agents"
          element={
            <TimelinePlaceholder
              body="Agent runs and their step-by-step timelines arrive in Milestone 3."
              eyebrow="Agents"
              title="Agents"
            />
          }
        />
        <Route path="/agents/:runId" element={<AgentRunDetails />} />
        <Route
          path="/sessions"
          element={
            <TimelinePlaceholder
              body="A history of agent sessions arrives alongside the agentic loop in Milestone 3."
              eyebrow="Agents"
              title="Sessions"
            />
          }
        />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

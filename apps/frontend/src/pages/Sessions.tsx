import { Link } from 'react-router-dom';
import { useSessions } from '../api/chat';
import { AppShell } from '../components/AppShell';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { learningHints } from '../content/learningHints';
import { useAuthStore } from '../stores/auth';

export function Sessions() {
  const sessions = useSessions();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <AppShell
      onLogout={logout}
      title="Sessions"
      userEmail={user?.email}
      eyebrow="Chat history"
      description="Browse saved conversations and jump back into any session."
      learning={learningHints.sessions}
      actions={
        <Link className="ui-button-primary" to="/chat">
          New chat
        </Link>
      }
    >
      {sessions.isLoading ? <LoadingState label="Loading sessions" /> : null}

      {!sessions.isLoading && !sessions.data?.length ? (
        <EmptyState
          title="No sessions yet"
          body="Start a chat to save a conversation here."
          action={
            <Link className="ui-button-primary" to="/chat">
              Open chat
            </Link>
          }
        />
      ) : null}

      {sessions.data?.length ? (
        <ul className="ui-panel divide-y divide-line">
          {sessions.data.map((session) => (
            <li className="flex items-center justify-between gap-4 px-4 py-3" key={session.id}>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{session.title}</p>
                <p className="mt-1 font-mono text-xs text-muted">
                  {new Date(session.createdAt).toLocaleString()}
                </p>
              </div>
              <Link className="ui-button-secondary" to={`/chat?session=${session.id}`}>
                Open
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </AppShell>
  );
}

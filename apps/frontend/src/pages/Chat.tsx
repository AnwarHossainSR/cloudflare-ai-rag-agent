import { useSearchParams } from 'react-router-dom';
import { useCreateSession, useSessions } from '../api/chat';
import { ChatWindow } from '../components/ChatWindow';
import { AppShell } from '../components/AppShell';
import { useAuthStore } from '../stores/auth';
import { LoadingState } from '../components/LoadingState';

export function Chat() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const sessions = useSessions();
  const createSession = useCreateSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('session') ?? sessions.data?.[0]?.id;

  async function startChat() {
    const session = await createSession.mutateAsync();
    setSearchParams({ session: session.id });
  }

  return (
    <AppShell onLogout={logout} title="Chat" userEmail={user?.email}>
      <div className="space-y-6">
        <header className="border-b border-line pb-5">
          <p className="font-mono text-xs uppercase text-cyan-700">Grounded RAG</p>
          <h1 className="mt-1 text-2xl font-semibold">Chat</h1>
        </header>
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <aside className="ui-panel p-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-ink">Chats</h2>
              <button
                className="ui-button-secondary"
                disabled={createSession.isPending}
                onClick={startChat}
                type="button"
              >
                New
              </button>
            </div>

            <div className="mt-3 space-y-1">
              {sessions.isLoading ? <LoadingState label="Loading chats" /> : null}
              {sessions.data?.map((session) => (
                <button
                  className={`block w-full rounded-md px-3 py-2 text-left text-sm focus-ring ${
                    session.id === selectedId
                      ? 'bg-cyan-50 font-semibold text-cyan-800'
                      : 'text-muted hover:bg-paper hover:text-ink'
                  }`}
                  key={session.id}
                  onClick={() => setSearchParams({ session: session.id })}
                  type="button"
                >
                  <span className="block truncate">{session.title}</span>
                </button>
              ))}
              {!sessions.isLoading && !sessions.data?.length ? (
                <p className="px-1 py-2 text-sm text-muted">No chats yet.</p>
              ) : null}
            </div>
          </aside>

          <ChatWindow sessionId={selectedId} />
        </div>
      </div>
    </AppShell>
  );
}

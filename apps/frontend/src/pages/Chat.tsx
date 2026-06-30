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
    <AppShell
      onLogout={logout}
      title="Chat"
      userEmail={user?.email}
      eyebrow="AI Copilot"
      description="Ask grounded questions, answered from your indexed knowledge base with citations."
      actions={
        <button className="ui-button-primary" disabled={createSession.isPending} onClick={startChat} type="button">
          New chat
        </button>
      }
    >
      <div className="grid h-[calc(100vh-220px)] min-h-[480px] gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="ui-panel flex flex-col overflow-hidden p-3">
          <h2 className="px-1 text-sm font-semibold uppercase tracking-wider text-muted">Conversations</h2>
          <div className="mt-3 flex-1 space-y-1 overflow-y-auto">
            {sessions.isLoading ? <LoadingState label="Loading chats" /> : null}
            {sessions.data?.map((session) => {
              const isActive = session.id === selectedId;
              return (
                <button
                  className={`block w-full rounded-md border-l-2 px-3 py-2 text-left text-sm transition focus-ring ${
                    isActive
                      ? 'border-accent bg-panel2 font-semibold text-ink'
                      : 'border-transparent text-secondary hover:bg-panel2/60 hover:text-ink'
                  }`}
                  key={session.id}
                  onClick={() => setSearchParams({ session: session.id })}
                  type="button"
                >
                  <span className="block truncate">{session.title}</span>
                </button>
              );
            })}
            {!sessions.isLoading && !sessions.data?.length ? (
              <p className="px-1 py-2 text-sm text-muted">No chats yet — start one to begin.</p>
            ) : null}
          </div>
        </aside>

        <ChatWindow sessionId={selectedId} />
      </div>
    </AppShell>
  );
}

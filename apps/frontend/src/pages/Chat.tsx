import { ChatWindow } from '../components/ChatWindow';
import { AppShell } from '../components/AppShell';
import { useAuthStore } from '../stores/auth';

export function Chat() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <AppShell onLogout={logout} title="Chat" userEmail={user?.email}>
      <div className="space-y-6">
        <header className="border-b border-line pb-5">
          <p className="font-mono text-xs uppercase text-cyan-700">Grounded RAG</p>
          <h1 className="mt-1 text-2xl font-semibold">Chat</h1>
        </header>
        <ChatWindow />
      </div>
    </AppShell>
  );
}

import { ChatWindow } from '../components/ChatWindow';

export function Chat() {
  return (
    <main className="min-h-screen bg-[#eef3f1] px-6 py-8 text-slate-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="border-b border-slate-300 pb-5">
          <p className="font-mono text-xs uppercase tracking-wider text-cyan-700">Grounded RAG</p>
          <h1 className="mt-1 text-3xl font-semibold">Chat</h1>
        </header>
        <ChatWindow />
      </div>
    </main>
  );
}

import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { useAuthStore } from '../stores/auth';

const links = [
  { to: '/documents/upload', label: 'Upload docs' },
  { to: '/documents', label: 'Documents' },
  { to: '/chat', label: 'Chat' },
  { to: '/settings', label: 'Settings' },
];

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <main className="min-h-screen bg-[#eef3f1] text-slate-950">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-300 pb-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-cyan-700">DevDocs AI</p>
            <h1 className="mt-1 text-3xl font-semibold">Copilot workspace</h1>
            <p className="mt-1 text-sm text-slate-600">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            Log out
          </button>
        </header>

        <nav className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold shadow-sm hover:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <EmptyState
          title="No document activity yet"
          body="Upload Markdown or text docs, then ask grounded questions from Chat."
        />
      </div>
    </main>
  );
}

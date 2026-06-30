import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
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
    <AppShell onLogout={logout} title="Dashboard" userEmail={user?.email}>
      <div className="space-y-6">
        <header className="border-b border-line pb-5">
          <p className="font-mono text-xs uppercase text-cyan-700">Workspace</p>
          <h1 className="mt-1 text-2xl font-semibold">Copilot dashboard</h1>
        </header>

        <nav className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {links.map((link) => (
            <Link className="ui-panel block p-4 text-sm font-semibold hover:border-cyan-700 focus-ring" key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>

        <EmptyState title="No document activity yet" body="Upload docs, then ask grounded questions from Chat." />
      </div>
    </AppShell>
  );
}

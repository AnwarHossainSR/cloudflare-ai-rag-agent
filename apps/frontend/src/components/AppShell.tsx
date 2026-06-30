import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/documents', label: 'Documents' },
  { to: '/documents/upload', label: 'Upload' },
  { to: '/chat', label: 'Chat' },
  { to: '/settings', label: 'Settings' },
];

interface AppShellProps {
  children: ReactNode;
  onLogout: () => void;
  title: string;
  userEmail?: string;
}

export function AppShell({ children, onLogout, title, userEmail }: AppShellProps) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-line bg-panel px-4 py-3 lg:hidden">
        <div>
          <p className="font-mono text-xs uppercase text-cyan-700">DevDocs AI</p>
          <p className="text-sm font-semibold">{title}</p>
        </div>
        <button className="ui-button-secondary" onClick={onLogout} type="button">
          Log out
        </button>
      </header>

      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-line bg-panel lg:block">
          <div className="flex h-full flex-col p-4">
            <div className="border-b border-line pb-4">
              <p className="font-mono text-xs uppercase text-cyan-700">DevDocs AI</p>
              <p className="mt-1 text-lg font-semibold">Copilot</p>
              {userEmail ? <p className="mt-1 truncate text-xs text-muted">{userEmail}</p> : null}
            </div>

            <nav aria-label="Primary" className="mt-4 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-2 text-sm font-medium focus-ring ${
                      isActive ? 'bg-cyan-50 text-cyan-800' : 'text-muted hover:bg-paper hover:text-ink'
                    }`
                  }
                  end={item.to === '/'}
                  key={item.to}
                  to={item.to}
                >
                  {({ isActive }) => (
                    <span aria-current={isActive ? 'page' : undefined}>{item.label}</span>
                  )}
                </NavLink>
              ))}
            </nav>

            <button className="ui-button-secondary mt-auto" onClick={onLogout} type="button">
              Log out
            </button>
          </div>
        </aside>

        <main aria-label={title} className="px-4 py-5 lg:px-8 lg:py-7">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

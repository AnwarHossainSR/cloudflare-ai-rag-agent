import { ComponentType, ReactNode, SVGProps } from 'react';
import { NavLink } from 'react-router-dom';
import { useUiStore } from '../stores/ui';

type IconProps = SVGProps<SVGSVGElement>;
type Icon = ComponentType<IconProps>;

function baseIcon(children: ReactNode): Icon {
  return function IconComponent(props: IconProps) {
    return (
      <svg
        aria-hidden="true"
        fill="none"
        height="18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        viewBox="0 0 24 24"
        width="18"
        {...props}
      >
        {children}
      </svg>
    );
  };
}

const IconOverview = baseIcon(
  <>
    <path d="M3 12 12 3l9 9" />
    <path d="M5 10v10h14V10" />
  </>,
);
const IconDocuments = baseIcon(
  <>
    <path d="M7 3h7l4 4v14H7z" />
    <path d="M14 3v4h4" />
    <path d="M9 12h6M9 16h6" />
  </>,
);
const IconUpload = baseIcon(
  <>
    <path d="M12 16V5" />
    <path d="m8 9 4-4 4 4" />
    <path d="M5 19h14" />
  </>,
);
const IconChat = baseIcon(<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12Z" />);
const IconAgents = baseIcon(
  <>
    <rect height="11" rx="2" width="14" x="5" y="8" />
    <path d="M12 8V4M9 13h.01M15 13h.01M9 17h6" />
  </>,
);
const IconSessions = baseIcon(
  <>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l3 2" />
  </>,
);
const IconSettings = baseIcon(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14 2h-4l-.6 2.5a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2L10 22h4l.6-2.5a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5A7 7 0 0 0 19 12Z" />
  </>,
);
const IconSun = baseIcon(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
  </>,
);
const IconMoon = baseIcon(<path d="M21 12.8A8 8 0 1 1 11.2 3 6 6 0 0 0 21 12.8Z" />);
const IconLogout = baseIcon(
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </>,
);

interface NavItemDef {
  to: string;
  label: string;
  icon: Icon;
  end?: boolean;
}

const navGroups: { label: string; items: NavItemDef[] }[] = [
  {
    label: 'Workspace',
    items: [
      { to: '/', label: 'Overview', icon: IconOverview, end: true },
      { to: '/documents', label: 'Documents', icon: IconDocuments, end: true },
      { to: '/documents/upload', label: 'Upload', icon: IconUpload },
      { to: '/chat', label: 'Chat', icon: IconChat },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/agents', label: 'Agents', icon: IconAgents },
      { to: '/sessions', label: 'Sessions', icon: IconSessions },
    ],
  },
];

const utilityItems: NavItemDef[] = [{ to: '/settings', label: 'Settings', icon: IconSettings }];

function NavItem({ item }: { item: NavItemDef }) {
  const Icon = item.icon;
  return (
    <NavLink
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition focus-ring ${
          isActive
            ? "bg-panel2 text-ink before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-accent before:content-['']"
            : 'text-secondary hover:bg-panel2 hover:text-ink'
        }`
      }
      end={item.end}
      to={item.to}
    >
      {({ isActive }) => (
        <>
          <Icon className={isActive ? 'text-accent' : 'text-muted group-hover:text-ink'} />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

function ThemeToggle({ className }: { className?: string }) {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  return (
    <button
      aria-label="Toggle theme"
      className={`ui-button-ghost px-2 ${className ?? ''}`}
      onClick={toggleTheme}
      title="Toggle theme"
      type="button"
    >
      {theme === 'dark' ? <IconSun /> : <IconMoon />}
    </button>
  );
}

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-sm font-bold text-white shadow-sm">
        D
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-tight text-ink">DevDocs AI</p>
        <p className="text-xs text-muted">Copilot</p>
      </div>
    </div>
  );
}

interface AppShellProps {
  children: ReactNode;
  onLogout: () => void;
  title: string;
  userEmail?: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
}

export function AppShell({ children, onLogout, title, userEmail, eyebrow, description, actions }: AppShellProps) {
  const initial = userEmail?.trim().charAt(0).toUpperCase() || '?';
  const hasHeader = Boolean(eyebrow || description || actions);

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Mobile top bar */}
      <header className="flex items-center justify-between gap-3 border-b border-line bg-panel px-4 py-3 lg:hidden">
        <Wordmark />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button aria-label="Log out" className="ui-button-ghost px-2" onClick={onLogout} type="button">
            <IconLogout />
          </button>
        </div>
      </header>

      <div className="grid min-h-screen lg:grid-cols-[264px_1fr]">
        <aside className="hidden border-r border-line bg-panel lg:block">
          <div className="flex h-screen flex-col">
            <div className="px-5 py-5">
              <Wordmark />
            </div>

            <nav aria-label="Primary" className="flex-1 space-y-6 overflow-y-auto px-3">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-3 pb-2 font-mono text-[11px] uppercase tracking-wider text-muted">{group.label}</p>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <NavItem item={item} key={item.to} />
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="space-y-1 border-t border-line px-3 pb-3 pt-3">
              {utilityItems.map((item) => (
                <NavItem item={item} key={item.to} />
              ))}
            </div>

            <div className="border-t border-line px-3 py-3">
              {userEmail ? (
                <div className="mb-2 flex items-center gap-3 rounded-md px-2 py-1.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel2 text-xs font-semibold text-secondary">
                    {initial}
                  </span>
                  <p className="truncate text-xs text-secondary">{userEmail}</p>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <button className="ui-button-secondary flex-1" onClick={onLogout} type="button">
                  <IconLogout />
                  <span>Log out</span>
                </button>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </aside>

        <main aria-label={title} className="px-4 py-5 lg:px-8 lg:py-7">
          <div className="mx-auto max-w-6xl">
            {hasHeader ? (
              <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
                <div>
                  {eyebrow ? <p className="ui-eyebrow">{eyebrow}</p> : null}
                  <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">{title}</h1>
                  {description ? <p className="mt-1.5 max-w-2xl text-sm text-secondary">{description}</p> : null}
                </div>
                {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
              </header>
            ) : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

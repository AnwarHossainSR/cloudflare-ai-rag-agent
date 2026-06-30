import { ReactNode } from 'react';
import { AppShell } from '../components/AppShell';
import { useAuthStore } from '../stores/auth';
import { ThemeMode, useUiStore } from '../stores/ui';

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <section className="ui-card">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {description ? <p className="mt-1 text-sm text-secondary">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
      <span className="text-sm text-secondary">{label}</span>
      <span className="font-mono text-xs text-muted">{value}</span>
    </div>
  );
}

export function Settings() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  return (
    <AppShell
      onLogout={logout}
      title="Settings"
      userEmail={user?.email}
      eyebrow="Workspace"
      description="Manage your profile, appearance, and how DevDocs AI is configured."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Profile" description="Your account on this workspace.">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-lg font-semibold text-accent">
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{user?.email ?? 'Unknown user'}</p>
              <p className="text-xs text-muted">Workspace owner</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Theme preference" description="Choose how DevDocs AI looks on this device.">
          <div className="flex gap-2">
            {(['dark', 'light'] as ThemeMode[]).map((mode) => (
              <button
                className={`flex-1 rounded-md border px-4 py-2.5 text-sm font-medium capitalize transition focus-ring ${
                  theme === mode
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-line text-secondary hover:border-accent/40 hover:text-ink'
                }`}
                key={mode}
                onClick={() => setTheme(mode)}
                type="button"
              >
                {mode}
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Cloudflare AI configuration"
          description="All model calls route through the backend — credentials never reach the browser."
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
            <span className="text-sm font-medium text-ink">Configured server-side</span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Chat and embedding models are set via backend environment variables.
          </p>
        </SectionCard>

        <SectionCard title="Model configuration" description="Read-only — set via backend environment.">
          <FieldRow label="Chat model" value="CLOUDFLARE_CHAT_MODEL" />
          <FieldRow label="Embedding model" value="CLOUDFLARE_EMBEDDING_MODEL" />
        </SectionCard>

        <SectionCard title="Retrieval settings" description="Controls how many chunks ground each answer.">
          <FieldRow label="Top K chunks" value="Default" />
          <FieldRow label="Re-ranking" value="Coming soon" />
        </SectionCard>

        <SectionCard title="Embedding settings" description="How uploaded documents are chunked and indexed.">
          <FieldRow label="Chunking strategy" value="Coming soon" />
          <FieldRow label="Vector store" value="pgvector" />
        </SectionCard>

        <SectionCard title="Security" description="Account and access controls.">
          <FieldRow label="Authentication" value="JWT" />
          <FieldRow label="API tokens" value="Never exposed to browser" />
        </SectionCard>
      </div>
    </AppShell>
  );
}

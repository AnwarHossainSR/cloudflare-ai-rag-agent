import { Link } from 'react-router-dom';
import { useDocuments } from '../api/documents';
import { AppShell } from '../components/AppShell';
import { DocumentCard } from '../components/DocumentCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { useAuthStore } from '../stores/auth';

export function DocumentsList() {
  const documents = useDocuments();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <AppShell onLogout={logout} title="Documents" userEmail={user?.email}>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
          <div>
            <p className="font-mono text-xs uppercase text-cyan-700">Knowledge base</p>
            <h1 className="mt-1 text-2xl font-semibold">Documents</h1>
          </div>
          <Link className="ui-button-primary" to="/documents/upload">
            Upload
          </Link>
        </header>

        {documents.isLoading ? <LoadingState label="Loading documents" /> : null}
        {documents.data?.length === 0 ? (
          <EmptyState title="No documents yet" body="Upload a txt, md, or pdf file to start RAG chat." />
        ) : null}
        <section className="grid gap-3 md:grid-cols-2">
          {documents.data?.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </section>
      </div>
    </AppShell>
  );
}

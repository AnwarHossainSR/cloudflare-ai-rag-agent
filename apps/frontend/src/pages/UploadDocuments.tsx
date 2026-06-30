import { Link } from 'react-router-dom';
import { useDocuments } from '../api/documents';
import { AppShell } from '../components/AppShell';
import { DocumentCard } from '../components/DocumentCard';
import { FileUploader } from '../components/FileUploader';
import { LoadingState } from '../components/LoadingState';
import { useAuthStore } from '../stores/auth';

export function UploadDocuments() {
  const documents = useDocuments();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <AppShell onLogout={logout} title="Upload documents" userEmail={user?.email}>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
          <div>
            <p className="font-mono text-xs uppercase text-cyan-700">Knowledge base</p>
            <h1 className="mt-1 text-2xl font-semibold">Upload documents</h1>
          </div>
          <Link className="text-sm font-semibold text-cyan-800 hover:text-cyan-950" to="/documents">
            View all
          </Link>
        </header>

        <FileUploader />

        <section>
          <h2 className="mb-3 text-lg font-semibold">Recent documents</h2>
          {documents.isLoading ? <LoadingState label="Loading documents" /> : null}
          <div className="grid gap-3 md:grid-cols-2">
            {documents.data?.slice(0, 4).map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

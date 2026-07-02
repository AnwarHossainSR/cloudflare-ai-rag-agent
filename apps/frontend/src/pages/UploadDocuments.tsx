import { Link } from 'react-router-dom';
import { useDocuments } from '../api/documents';
import { AppShell } from '../components/AppShell';
import { DocumentCard } from '../components/DocumentCard';
import { FileUploader } from '../components/FileUploader';
import { LoadingState } from '../components/LoadingState';
import { learningHints } from '../content/learningHints';
import { useAuthStore } from '../stores/auth';

export function UploadDocuments() {
  const documents = useDocuments();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const recent = documents.data?.slice(0, 4) ?? [];

  return (
    <AppShell
      onLogout={logout}
      title="Upload documents"
      userEmail={user?.email}
      eyebrow="Knowledge base"
      description="Add txt, md, or pdf files. They're chunked and embedded automatically."
      learning={learningHints.upload}
      actions={
        <Link className="ui-button-secondary" to="/documents">
          View all documents
        </Link>
      }
    >
      <div className="space-y-7">
        <FileUploader />

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Recent uploads</h2>
          {documents.isLoading ? <LoadingState label="Loading documents" /> : null}
          {!documents.isLoading && recent.length === 0 ? (
            <p className="text-sm text-secondary">Nothing uploaded yet — your first document will show up here.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {recent.map((document) => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

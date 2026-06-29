import { Link } from 'react-router-dom';
import { useDocuments } from '../api/documents';
import { DocumentCard } from '../components/DocumentCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';

export function DocumentsList() {
  const documents = useDocuments();

  return (
    <main className="min-h-screen bg-[#eef3f1] px-6 py-8 text-slate-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-300 pb-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-cyan-700">Knowledge base</p>
            <h1 className="mt-1 text-3xl font-semibold">Documents</h1>
          </div>
          <Link
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            to="/documents/upload"
          >
            Upload
          </Link>
        </header>

        {documents.isLoading ? <LoadingState label="Loading documents" /> : null}
        {documents.data?.length === 0 ? (
          <EmptyState title="No documents yet" body="Upload a txt or md file to start RAG chat." />
        ) : null}
        <section className="grid gap-3 md:grid-cols-2">
          {documents.data?.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </section>
      </div>
    </main>
  );
}

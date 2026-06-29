import { Link } from 'react-router-dom';
import { useDocuments } from '../api/documents';
import { DocumentCard } from '../components/DocumentCard';
import { FileUploader } from '../components/FileUploader';
import { LoadingState } from '../components/LoadingState';

export function UploadDocuments() {
  const documents = useDocuments();

  return (
    <main className="min-h-screen bg-[#eef3f1] px-6 py-8 text-slate-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-300 pb-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-cyan-700">Knowledge base</p>
            <h1 className="mt-1 text-3xl font-semibold">Upload documents</h1>
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
    </main>
  );
}

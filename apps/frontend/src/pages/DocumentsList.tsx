import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DocumentRecord, DocumentStatus, useDocuments } from '../api/documents';
import { AppShell } from '../components/AppShell';
import { DocumentCard } from '../components/DocumentCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { useAuthStore } from '../stores/auth';

type StatusFilter = 'all' | DocumentStatus;
type SortOption = 'newest' | 'oldest' | 'name';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'ready', label: 'Ready' },
  { value: 'processing', label: 'Processing' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name A–Z' },
];

function filterAndSort(docs: DocumentRecord[], search: string, status: StatusFilter, sort: SortOption) {
  const query = search.trim().toLowerCase();
  const filtered = docs.filter((doc) => {
    const matchesSearch = !query || doc.filename.toLowerCase().includes(query);
    const matchesStatus = status === 'all' || doc.status === status;
    return matchesSearch && matchesStatus;
  });

  return [...filtered].sort((a, b) => {
    if (sort === 'name') return a.filename.localeCompare(b.filename);
    const aTime = a.createdAt ?? '';
    const bTime = b.createdAt ?? '';
    return sort === 'newest' ? bTime.localeCompare(aTime) : aTime.localeCompare(bTime);
  });
}

export function DocumentsList() {
  const documents = useDocuments();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortOption>('newest');

  const docs = documents.data ?? [];
  const visible = useMemo(() => filterAndSort(docs, search, status, sort), [docs, search, status, sort]);

  return (
    <AppShell
      onLogout={logout}
      title="Documents"
      userEmail={user?.email}
      eyebrow="Knowledge base"
      description="Search, filter, and manage every document indexed for grounded chat."
      actions={
        <Link className="ui-button-primary" to="/documents/upload">
          Upload
        </Link>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-3">
          <input
            aria-label="Search documents"
            className="ui-input max-w-xs"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename…"
            type="search"
            value={search}
          />
          <select
            aria-label="Filter by status"
            className="ui-input w-auto"
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            value={status}
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Sort documents"
            className="ui-input w-auto"
            onChange={(e) => setSort(e.target.value as SortOption)}
            value={sort}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {documents.isLoading ? <LoadingState label="Loading documents" /> : null}

        {!documents.isLoading && docs.length === 0 ? (
          <EmptyState
            title="No documents yet"
            body="Upload a txt, md, or pdf file to start grounded chat with citations."
            action={
              <Link className="ui-button-primary" to="/documents/upload">
                Upload a document
              </Link>
            }
          />
        ) : null}

        {!documents.isLoading && docs.length > 0 && visible.length === 0 ? (
          <EmptyState title="No matching documents" body="Try a different search term or status filter." />
        ) : null}

        <section className="grid gap-3 md:grid-cols-2">
          {visible.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </section>
      </div>
    </AppShell>
  );
}

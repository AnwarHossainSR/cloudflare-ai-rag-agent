import { Navigate, Route, Routes } from 'react-router-dom';
import { EmptyState } from './components/EmptyState';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Chat } from './pages/Chat';
import { Dashboard } from './pages/Dashboard';
import { DocumentsList } from './pages/DocumentsList';
import { Login } from './pages/Login';
import { UploadDocuments } from './pages/UploadDocuments';

function Placeholder({ title }: { title: string }) {
  return (
    <main className="min-h-screen bg-[#eef3f1] px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <EmptyState title={title} body="This workflow lands in the next milestone task." />
      </div>
    </main>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route index element={<Dashboard />} />
        <Route path="/documents/upload" element={<UploadDocuments />} />
        <Route path="/documents" element={<DocumentsList />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/agents/:runId" element={<Placeholder title="Agent run" />} />
        <Route path="/settings" element={<Placeholder title="Settings" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

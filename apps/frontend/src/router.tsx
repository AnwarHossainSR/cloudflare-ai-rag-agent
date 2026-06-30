import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AgentRunDetails } from './pages/AgentRunDetails';
import { AgentRuns } from './pages/AgentRuns';
import { Chat } from './pages/Chat';
import { Dashboard } from './pages/Dashboard';
import { DocumentsList } from './pages/DocumentsList';
import { Login } from './pages/Login';
import { Sessions } from './pages/Sessions';
import { Settings } from './pages/Settings';
import { UploadDocuments } from './pages/UploadDocuments';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route index element={<Dashboard />} />
        <Route path="/documents/upload" element={<UploadDocuments />} />
        <Route path="/documents" element={<DocumentsList />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/agents" element={<AgentRuns />} />
        <Route path="/agents/:runId" element={<AgentRunDetails />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

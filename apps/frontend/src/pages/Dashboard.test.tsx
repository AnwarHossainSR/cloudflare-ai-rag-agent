import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Dashboard } from './Dashboard';
import { useAuthStore } from '../stores/auth';

vi.mock('../api/documents', () => ({
  useDocuments: () => ({
    isLoading: false,
    data: [
      {
        id: '1',
        filename: 'api.md',
        mimeType: 'text/markdown',
        sizeBytes: 100,
        status: 'ready',
        error: null,
        chunkCount: 3,
        createdAt: '2026-06-01T00:00:00Z',
      },
      {
        id: '2',
        filename: 'guide.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 200,
        status: 'ready',
        error: null,
        chunkCount: 4,
        createdAt: '2026-06-02T00:00:00Z',
      },
    ],
  }),
}));

vi.mock('../api/chat', () => ({
  useSessions: () => ({
    isLoading: false,
    data: [{ id: 's1', title: 'First chat', createdAt: '2026-06-02T00:00:00Z' }],
  }),
}));

describe('Dashboard', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'token', user: { id: 'u1', email: 'dev@example.com' } });
  });

  function renderDashboard() {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );
  }

  it('renders hero call-to-actions', () => {
    renderDashboard();
    expect(screen.getByRole('link', { name: /upload documents/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start chat/i })).toBeInTheDocument();
  });

  it('renders stat cards with real counts', () => {
    renderDashboard();
    expect(screen.getByText('Chat sessions')).toBeInTheDocument();
    expect(screen.getByText('Agent runs')).toBeInTheDocument();
    expect(screen.getByText('Indexed chunks')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument(); // 3 + 4 chunks
    expect(screen.getByText('1')).toBeInTheDocument(); // sessions
  });

  it('renders quick action shortcuts', () => {
    renderDashboard();
    expect(screen.getByRole('link', { name: /browse documents/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open chat/i })).toBeInTheDocument();
  });
});

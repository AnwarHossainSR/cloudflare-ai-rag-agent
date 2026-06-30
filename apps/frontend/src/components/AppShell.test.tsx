import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';
import { SourceRail } from './SourceRail';

const navLabels = ['Overview', 'Documents', 'Upload', 'Chat', 'Agents', 'Sessions', 'Settings'];

function renderShell(path = '/documents') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell userEmail="dev@example.com" onLogout={vi.fn()} title="Documents">
        <p>Document workspace</p>
      </AppShell>
    </MemoryRouter>,
  );
}

describe('AppShell', () => {
  it('renders the DevDocs AI wordmark', () => {
    renderShell();
    expect(screen.getAllByText(/devdocs ai/i).length).toBeGreaterThan(0);
  });

  it('renders all grouped primary navigation links', () => {
    renderShell();
    for (const label of navLabels) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('marks the current route as active', () => {
    renderShell('/documents');
    expect(screen.getByRole('link', { name: 'Documents' })).toHaveAttribute('aria-current', 'page');
  });

  it('exposes account, logout, and theme controls', () => {
    renderShell();
    expect(screen.getByText('dev@example.com')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /log out/i })).not.toHaveLength(0);
    expect(screen.getAllByRole('button', { name: /theme/i })).not.toHaveLength(0);
  });

  it('renders the page workspace as a labelled main region', () => {
    renderShell();
    expect(screen.getByRole('main', { name: /documents/i })).toBeInTheDocument();
    expect(screen.getByText('Document workspace')).toBeInTheDocument();
  });
});

describe('SourceRail', () => {
  it('renders citations with document, score, and snippet', () => {
    render(
      <SourceRail
        citations={[
          {
            documentId: 'doc-1',
            documentName: 'api.md',
            chunkIndex: 2,
            score: 0.93,
            snippet: 'Upload a Markdown document.',
          },
        ]}
      />,
    );

    expect(screen.getByText('api.md #2')).toBeInTheDocument();
    expect(screen.getByText('93%')).toBeInTheDocument();
    expect(screen.getByText('Upload a Markdown document.')).toBeInTheDocument();
  });

  it('renders a useful empty state', () => {
    render(<SourceRail citations={[]} />);

    expect(screen.getByText('No sources yet')).toBeInTheDocument();
  });
});

import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';
import { SourceRail } from './SourceRail';

describe('AppShell', () => {
  it('renders active navigation, account action, and main workspace', () => {
    render(
      <MemoryRouter initialEntries={['/documents']}>
        <AppShell userEmail="dev@example.com" onLogout={vi.fn()} title="Documents">
          <p>Document workspace</p>
        </AppShell>
      </MemoryRouter>,
    );

    expect(screen.getByRole('main', { name: /documents/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /documents/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('button', { name: /log out/i })).not.toHaveLength(0);
    expect(screen.getByText('dev@example.com')).toBeInTheDocument();
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

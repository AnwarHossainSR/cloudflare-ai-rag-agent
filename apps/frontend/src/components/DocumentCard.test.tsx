import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentCard } from './DocumentCard';

const deleteMock = vi.hoisted(() => vi.fn());
const reindexMock = vi.hoisted(() => vi.fn());

vi.mock('../api/documents', () => ({
  useDeleteDocument: () => ({ mutate: deleteMock, isPending: false }),
  useReindexDocument: () => ({ mutate: reindexMock, isPending: false }),
}));

describe('DocumentCard', () => {
  beforeEach(() => {
    deleteMock.mockReset();
    reindexMock.mockReset();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('shows chunk count and supports reindex/delete actions', async () => {
    render(
      <DocumentCard
        document={{
          id: 'doc-1',
          filename: 'guide.md',
          mimeType: 'text/markdown',
          sizeBytes: 1024,
          status: 'ready',
          error: null,
          chunkCount: 3,
        }}
      />,
    );

    expect(screen.getByText(/3 chunks/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /re-index/i }));
    expect(reindexMock).toHaveBeenCalledWith('doc-1');

    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(deleteMock).toHaveBeenCalledWith('doc-1');
  });
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FileUploader } from './FileUploader';

vi.mock('../api/documents', () => ({
  useUploadDocument: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

describe('FileUploader', () => {
  it('rejects files over 10MB before upload', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const onUploaded = vi.fn();
    const largeFile = new File([new Uint8Array(12 * 1024 * 1024)], 'large.md', {
      type: 'text/markdown',
    });

    render(
      <QueryClientProvider client={client}>
        <FileUploader onUploaded={onUploaded} />
      </QueryClientProvider>,
    );

    await userEvent.upload(screen.getByLabelText(/choose document/i), largeFile);

    await waitFor(() => expect(screen.getByText(/file too large/i)).toBeInTheDocument());
    expect(onUploaded).not.toHaveBeenCalled();
  });
});

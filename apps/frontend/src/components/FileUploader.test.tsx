import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileUploader } from './FileUploader';

const uploadMock = vi.hoisted(() => vi.fn());

vi.mock('../api/documents', () => ({
  useUploadDocument: () => ({
    mutateAsync: uploadMock,
    isPending: false,
  }),
}));

describe('FileUploader', () => {
  beforeEach(() => {
    uploadMock.mockReset();
    uploadMock.mockResolvedValue(undefined);
  });

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

  it('allows PDF uploads', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const onUploaded = vi.fn();
    const pdf = new File([new Uint8Array([37, 80, 68, 70])], 'guide.pdf', {
      type: 'application/pdf',
    });

    render(
      <QueryClientProvider client={client}>
        <FileUploader onUploaded={onUploaded} />
      </QueryClientProvider>,
    );

    await userEvent.upload(screen.getByLabelText(/choose document/i), pdf);

    await waitFor(() => expect(uploadMock).toHaveBeenCalledWith(pdf));
    expect(onUploaded).toHaveBeenCalled();
  });
});

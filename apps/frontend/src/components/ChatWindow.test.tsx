import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChatWindow } from './ChatWindow';

vi.mock('../api/rag', () => ({
  useRagQuery: () => ({
    mutateAsync: vi.fn().mockResolvedValue({
      answer: 'Use POST /documents/upload.',
      citations: [
        {
          documentId: 'doc-1',
          documentName: 'api.md',
          chunkIndex: 2,
          score: 0.93,
          snippet: 'Upload a Markdown document.',
        },
      ],
      confidence: 'High',
    }),
    isPending: false,
  }),
}));

describe('ChatWindow', () => {
  it('renders an answer with citations and confidence', async () => {
    render(<ChatWindow />);

    await userEvent.type(screen.getByLabelText(/question/i), 'How do I upload docs?');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(screen.getByText('Use POST /documents/upload.')).toBeInTheDocument());
    expect(screen.getByText('api.md #2')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });
});

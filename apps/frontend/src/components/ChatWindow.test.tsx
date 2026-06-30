import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChatWindow } from './ChatWindow';

const postMessageMock = vi.hoisted(() => vi.fn());

vi.mock('../api/chat', () => ({
  useMessages: () => ({
    data: [
      { id: 'm1', role: 'user', content: 'How do I upload docs?', citations: [] },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Use POST /documents/upload.',
        confidence: 'High',
        citations: [
          {
            documentId: 'doc-1',
            documentName: 'api.md',
            chunkIndex: 2,
            score: 0.93,
            snippet: 'Upload a Markdown document.',
          },
        ],
      },
    ],
    isLoading: false,
  }),
  usePostMessage: () => ({
    mutateAsync: postMessageMock,
    isPending: false,
    isError: false,
  }),
}));

describe('ChatWindow', () => {
  it('renders persisted messages with citations and confidence', () => {
    render(<ChatWindow sessionId="session-1" />);

    expect(screen.getByText('How do I upload docs?')).toBeInTheDocument();
    expect(screen.getByText('Use POST /documents/upload.')).toBeInTheDocument();
    expect(screen.getByText('api.md #2')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('posts a message to the selected session', async () => {
    render(<ChatWindow sessionId="session-1" />);

    await userEvent.clear(screen.getByLabelText(/question/i));
    await userEvent.type(screen.getByLabelText(/question/i), 'What changed?');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(postMessageMock).toHaveBeenCalledWith('What changed?'));
  });
});

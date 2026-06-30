import { NotFoundException } from '@nestjs/common';
import { ChatRole, Confidence } from '@devdocs/shared';
import { ChatService } from './chat.service';
import { RagService } from '../rag/rag.service';

describe('ChatService', () => {
  let sessions: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock; find: jest.Mock };
  let messages: { save: jest.Mock; create: jest.Mock; find: jest.Mock };
  let rag: jest.Mocked<Pick<RagService, 'answer'>>;
  let service: ChatService;

  beforeEach(() => {
    sessions = {
      create: jest.fn((row) => ({ id: 'session-1', ...row })),
      save: jest.fn(async (row) => row),
      find: jest.fn(),
      findOne: jest.fn(async ({ where }) =>
        where.userId === 'user-1' ? { id: where.id, userId: where.userId, title: 'New chat' } : null,
      ),
    };
    messages = {
      create: jest.fn((row) => ({ id: `${row.role}-1`, ...row })),
      save: jest.fn(async (row) => row),
      find: jest.fn(),
    };
    rag = {
      answer: jest.fn(async (_userId: string, _question: string) => ({
        answer: 'Use POST /documents/upload.',
        citations: [
          {
            documentId: 'doc-1',
            documentName: 'api.md',
            chunkIndex: 0,
            score: 0.91,
            snippet: 'Upload with POST /documents/upload.',
          },
        ],
        confidence: Confidence.HIGH,
      })),
    };
    service = new ChatService(sessions as any, messages as any, rag as unknown as RagService);
  });

  it('persists user and assistant messages over RAG', async () => {
    const assistant = await service.postMessage('user-1', 'session-1', 'How do uploads work?');

    expect(messages.create).toHaveBeenNthCalledWith(1, {
      sessionId: 'session-1',
      role: ChatRole.USER,
      content: 'How do uploads work?',
      citations: [],
      confidence: null,
    });
    expect(rag.answer).toHaveBeenCalledWith('user-1', 'How do uploads work?');
    expect(messages.create).toHaveBeenNthCalledWith(2, {
      sessionId: 'session-1',
      role: ChatRole.ASSISTANT,
      content: 'Use POST /documents/upload.',
      citations: expect.any(Array),
      confidence: Confidence.HIGH,
    });
    expect(assistant.role).toBe(ChatRole.ASSISTANT);
    expect(assistant.citations[0].documentName).toBe('api.md');
  });

  it('blocks access to sessions owned by another user', async () => {
    await expect(service.postMessage('user-2', 'session-1', 'Hi')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

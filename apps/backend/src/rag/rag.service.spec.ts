import { Confidence } from '@devdocs/shared';
import { CloudflareAiService } from '../cloudflare-ai/cloudflare-ai.service';
import { RagService } from './rag.service';
import { buildAnswerPrompt, parseConfidence } from './prompts';

const embedding = Array.from({ length: 1024 }, () => 0.01);

describe('RagService', () => {
  let ai: jest.Mocked<Pick<CloudflareAiService, 'embed' | 'chat'>>;
  let repo: { query: jest.Mock };
  let service: RagService;

  beforeEach(() => {
    ai = {
      embed: jest.fn().mockResolvedValue([embedding]),
      chat: jest.fn().mockResolvedValue({ text: 'Answer\n\nConfidence: High' }),
    };
    repo = { query: jest.fn().mockResolvedValue([]) };
    service = new RagService(repo as any, ai as unknown as CloudflareAiService);
  });

  it('retrieves pgvector matches scoped to the user', async () => {
    repo.query.mockResolvedValue([
      {
        documentId: 'doc-1',
        documentName: 'guide.md',
        chunkIndex: 2,
        content: 'Use the upload endpoint.',
        score: 0.91,
      },
    ]);

    const out = await service.retrieve('user-1', 'how upload works?', 5);

    expect(ai.embed).toHaveBeenCalledWith(['how upload works?'], { userId: 'user-1' });
    const [sql, params] = repo.query.mock.calls[0];
    expect(sql).toContain('embedding <=>');
    expect(sql).toContain('ORDER BY');
    expect(sql).toContain('LIMIT');
    expect(params).toEqual([expect.stringMatching(/^\[0\.01/), 'user-1', 5, null]);
    expect(out).toEqual([
      {
        documentId: 'doc-1',
        documentName: 'guide.md',
        chunkIndex: 2,
        content: 'Use the upload endpoint.',
        score: 0.91,
      },
    ]);
  });

  it('limits retrieval to selected document ids when provided', async () => {
    await (service.retrieve as any)('user-1', 'upload docs', 5, ['doc-1', 'doc-2']);

    const [sql, params] = repo.query.mock.calls[0];
    expect(sql).toContain('c.document_id = ANY');
    expect(params).toEqual([
      expect.stringMatching(/^\[0\.01/),
      'user-1',
      5,
      ['doc-1', 'doc-2'],
    ]);
  });

  it('answers with grounded chat output and citations', async () => {
    jest.spyOn(service, 'retrieve').mockResolvedValue([
      {
        documentId: 'doc-1',
        documentName: 'guide.md',
        chunkIndex: 0,
        content: 'Upload docs with POST /documents/upload.',
        score: 0.9,
      },
    ]);

    const out = await service.answer('user-1', 'How do I upload docs?', 8);

    const [messages] = ai.chat.mock.calls[0];
    expect(messages[0].content).toContain(
      'You are DevDocs AI Copilot, a careful technical assistant.',
    );
    expect(messages[0].content).toContain('[Doc: guide.md #0]');
    expect(out.answer).toContain('Answer');
    expect(out.confidence).toBe(Confidence.HIGH);
    expect(out.citations).toEqual([
      {
        documentId: 'doc-1',
        documentName: 'guide.md',
        chunkIndex: 0,
        score: 0.9,
        snippet: 'Upload docs with POST /documents/upload.',
      },
    ]);
  });

  it('passes selected document ids from answer to retrieval', async () => {
    const retrieve = jest.spyOn(service, 'retrieve').mockResolvedValue([]);

    await (service.answer as any)('user-1', 'How do I upload docs?', 8, ['doc-1']);

    expect(retrieve).toHaveBeenCalledWith('user-1', 'How do I upload docs?', 8, ['doc-1']);
  });

  it('does not call chat when no context is retrieved', async () => {
    jest.spyOn(service, 'retrieve').mockResolvedValue([]);

    const out = await service.answer('user-1', 'unknown?', 6);

    expect(ai.chat).not.toHaveBeenCalled();
    expect(out.confidence).toBe(Confidence.LOW);
    expect(out.citations).toEqual([]);
    expect(out.answer).toMatch(/documents do not contain enough information/i);
  });
});

describe('rag prompts', () => {
  it('builds the required answer prompt and parses confidence', () => {
    const messages = buildAnswerPrompt('[Doc: a.md #0]\nDetails', 'Question?');

    expect(messages[0].content).toContain(
      'You are DevDocs AI Copilot, a careful technical assistant.',
    );
    expect(messages[0].content).toContain('Question?');
    expect(messages[1]).toEqual({ role: 'user', content: 'Question?' });
    expect(parseConfidence('Confidence: Low')).toBe(Confidence.LOW);
    expect(parseConfidence('Confidence: High')).toBe(Confidence.HIGH);
    expect(parseConfidence('No explicit score')).toBe(Confidence.MEDIUM);
  });
});

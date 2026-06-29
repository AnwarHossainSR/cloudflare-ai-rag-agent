import { BadGatewayException } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';
import { CloudflareAiService } from '../cloudflare-ai/cloudflare-ai.service';

const vector = (n: number) => Array.from({ length: n }, () => 0.01);

describe('EmbeddingsService', () => {
  let ai: jest.Mocked<Pick<CloudflareAiService, 'embed'>>;
  let repo: { create: jest.Mock; save: jest.Mock };
  let service: EmbeddingsService;

  beforeEach(() => {
    ai = { embed: jest.fn() };
    repo = {
      create: jest.fn((row) => row),
      save: jest.fn(async (rows) => rows),
    };
    service = new EmbeddingsService(ai as unknown as CloudflareAiService, repo as any);
  });

  it('chunks, embeds, and persists document chunks', async () => {
    ai.embed.mockImplementation(async (texts) => texts.map(() => vector(1024)));
    const text = Array.from({ length: 900 }, (_, i) => `word${i}`).join(' ');

    const count = await service.processDocument('doc-1', text, 'guide.md');

    expect(count).toBeGreaterThan(1);
    expect(ai.embed).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining('word0')]));
    expect(repo.save).toHaveBeenCalledTimes(1);
    const rows = repo.save.mock.calls[0][0];
    expect(rows).toHaveLength(count);
    expect(rows[0]).toMatchObject({
      documentId: 'doc-1',
      chunkIndex: 0,
      sourceFilename: 'guide.md',
      tokenCount: expect.any(Number),
    });
    expect(rows[0].embedding).toHaveLength(1024);
    expect(rows[1].chunkIndex).toBe(1);
  });

  it('rejects non-1024 dimensional embeddings', async () => {
    ai.embed.mockResolvedValue([vector(3)]);

    await expect(service.processDocument('doc-1', 'hello', 'guide.md')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });
});

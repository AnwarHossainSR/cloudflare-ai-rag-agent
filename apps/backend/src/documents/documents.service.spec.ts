import { NotFoundException } from '@nestjs/common';
import { DocumentStatus } from '@devdocs/shared';
import { DocumentsService } from './documents.service';
import { extractText } from './text-extraction';
import { EmbeddingsService } from '../embeddings/embeddings.service';

const file = {
  originalname: 'guide.md',
  mimetype: 'text/markdown',
  size: 12,
} as any;

describe('extractText', () => {
  it('sanitizes supported text files', async () => {
    await expect(extractText(Buffer.from('hello\0\u0001 world'), 'text/plain')).resolves.toBe(
      'hello world',
    );
  });

});

describe('DocumentsService', () => {
  let repo: { create: jest.Mock; save: jest.Mock; find: jest.Mock; findOne: jest.Mock; remove: jest.Mock };
  let embeddings: jest.Mocked<Pick<EmbeddingsService, 'processDocument'>>;
  let service: DocumentsService;
  let savedStatuses: DocumentStatus[];

  beforeEach(() => {
    repo = {
      create: jest.fn((row) => ({ id: 'doc-1', ...row })),
      save: jest.fn(async (doc) => {
        if (doc.status) savedStatuses.push(doc.status);
        return doc;
      }),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(async (doc) => doc),
    };
    savedStatuses = [];
    embeddings = { processDocument: jest.fn().mockResolvedValue(1) };
    service = new DocumentsService(repo as any, embeddings as unknown as EmbeddingsService);
  });

  it('creates a pending document with upload metadata', async () => {
    const doc = await service.create('user-1', file);

    expect(repo.create).toHaveBeenCalledWith({
      userId: 'user-1',
      filename: 'guide.md',
      mimeType: 'text/markdown',
      sizeBytes: 12,
      status: DocumentStatus.PENDING,
      error: null,
    });
    expect(repo.save).toHaveBeenCalledWith(doc);
  });

  it('processes a document inline and marks it ready', async () => {
    const doc = { id: 'doc-1', filename: 'guide.md', mimeType: 'text/markdown' } as any;

    await service.processInline(doc, Buffer.from('# hello'));

    expect(savedStatuses).toEqual([DocumentStatus.PROCESSING, DocumentStatus.READY]);
    expect(embeddings.processDocument).toHaveBeenCalledWith('doc-1', '# hello', 'guide.md');
  });

  it('marks the document failed when processing throws', async () => {
    embeddings.processDocument.mockRejectedValue(new Error('embed failed'));
    const doc = { id: 'doc-1', filename: 'guide.md', mimeType: 'text/markdown' } as any;

    await service.processInline(doc, Buffer.from('# hello'));

    expect(doc.status).toBe(DocumentStatus.FAILED);
    expect(doc.error).toBe('embed failed');
  });

  it('hides documents owned by another user', async () => {
    repo.findOne.mockResolvedValue({ id: 'doc-1', userId: 'user-2' });

    await expect(service.findOneForUser('user-1', 'doc-1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
